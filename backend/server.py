from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import logging
import bcrypt
import jwt
import re

from classification import compute_score, classify, hero_id_for_index, HERO_REQUIREMENTS

# ---------------------------------------------------------------- infra
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------- auth utils

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True,
                        samesite="none", max_age=900, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True,
                        samesite="none", max_age=604800, path="/")


def public_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "username": user["username"],
        "role": user.get("role", "ascendant"),
        "currentHero": user.get("currentHero", "nova"),
        "highestHeroIndex": user.get("highestHeroIndex", 0),
        "bestWpm": user.get("bestWpm", 0),
        "averageWpm": round(user.get("sumWpm", 0) / user["totalTests"]) if user.get("totalTests") else 0,
        "bestAccuracy": user.get("bestAccuracy", 0),
        "averageAccuracy": round(user.get("sumAccuracy", 0) / user["totalTests"], 1) if user.get("totalTests") else 0,
        "bestConsistency": user.get("bestConsistency", 0),
        "totalTests": user.get("totalTests", 0),
        "totalCharacters": user.get("totalCharacters", 0),
        "streak": user.get("streak", 0),
        "leaderboardScore": user.get("leaderboardScore", 0),
        "achievements": user.get("achievements", []),
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------------------------------------------------------------- models

class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    username: str = Field(min_length=3, max_length=20)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class SimulationInput(BaseModel):
    wpm: float
    accuracy: float
    consistency: float
    correctCharacters: int
    incorrectCharacters: int
    totalCharacters: int
    duration: int


ACHIEVEMENT_IDS = [
    "first_simulation", "precision", "speed_surge", "overdrive",
    "break_the_limit", "perfect_execution", "ascension", "velocity", "sovereign",
]


def compute_achievements(user: dict) -> List[str]:
    unlocked = set(user.get("achievements", []))
    if user.get("totalTests", 0) >= 1:
        unlocked.add("first_simulation")
    if user.get("bestAccuracy", 0) >= 99:
        unlocked.add("precision")
    if user.get("bestAccuracy", 0) >= 100:
        unlocked.add("perfect_execution")
    if user.get("bestWpm", 0) >= 80:
        unlocked.add("speed_surge")
    if user.get("bestWpm", 0) >= 100:
        unlocked.add("overdrive")
    if user.get("bestWpm", 0) >= 120:
        unlocked.add("break_the_limit")
    hi = user.get("highestHeroIndex", 0)
    if hi >= 7:
        unlocked.add("ascension")
    if hi >= 8:
        unlocked.add("velocity")
    if hi >= 9:
        unlocked.add("sovereign")
    return [a for a in ACHIEVEMENT_IDS if a in unlocked]


# ---------------------------------------------------------------- auth routes

@api_router.post("/auth/register")
async def register(input: RegisterInput, response: Response):
    email = input.email.lower().strip()
    username = re.sub(r"[^A-Za-z0-9_\-]", "", input.username).strip()
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be 3+ alphanumeric characters")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An ascendant with this email already exists")
    doc = {
        "email": email,
        "username": username,
        "password_hash": hash_password(input.password),
        "role": "ascendant",
        "currentHero": "nova",
        "highestHeroIndex": 0,
        "bestWpm": 0, "bestAccuracy": 0, "bestConsistency": 0,
        "sumWpm": 0, "sumAccuracy": 0,
        "totalTests": 0, "totalCharacters": 0,
        "streak": 0, "lastTestDate": None,
        "leaderboardScore": 0,
        "achievements": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id
    access = create_access_token(str(res.inserted_id), email)
    refresh = create_refresh_token(str(res.inserted_id))
    set_auth_cookies(response, access, refresh)
    return public_user(doc)


@api_router.post("/auth/login")
async def login(input: LoginInput, response: Response):
    email = input.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access = create_access_token(str(user["_id"]), email)
    refresh = create_refresh_token(str(user["_id"]))
    set_auth_cookies(response, access, refresh)
    return public_user(user)


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


@api_router.post("/auth/refresh")
async def refresh_token_route(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie("access_token", access, httponly=True, secure=True,
                            samesite="none", max_age=900, path="/")
        return {"message": "refreshed"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


# ---------------------------------------------------------------- simulation

@api_router.post("/simulations")
async def submit_simulation(input: SimulationInput, user: dict = Depends(get_current_user)):
    wpm = max(0.0, min(input.wpm, 400.0))
    accuracy = max(0.0, min(input.accuracy, 100.0))
    consistency = max(0.0, min(input.consistency, 100.0))

    score = compute_score(wpm, accuracy, consistency)
    hero_index = classify(wpm, accuracy, consistency)
    hero_id = hero_id_for_index(hero_index)

    now = datetime.now(timezone.utc)
    sim = {
        "user_id": str(user["_id"]),
        "username": user["username"],
        "wpm": round(wpm, 1),
        "accuracy": round(accuracy, 1),
        "consistency": round(consistency, 1),
        "correctCharacters": input.correctCharacters,
        "incorrectCharacters": input.incorrectCharacters,
        "totalCharacters": input.totalCharacters,
        "duration": input.duration,
        "score": score,
        "hero": hero_id,
        "heroIndex": hero_index,
        "created_at": now.isoformat(),
    }
    await db.simulations.insert_one(sim)
    sim.pop("_id", None)

    # streak logic
    today = now.date()
    last_date = user.get("lastTestDate")
    streak = user.get("streak", 0)
    if last_date:
        try:
            last = datetime.fromisoformat(last_date).date()
            delta = (today - last).days
            if delta == 1:
                streak += 1
            elif delta > 1:
                streak = 1
            elif streak == 0:
                streak = 1
        except Exception:
            streak = 1
    else:
        streak = 1

    total_tests = user.get("totalTests", 0) + 1
    new_best_wpm = max(user.get("bestWpm", 0), round(wpm, 1))
    new_best_acc = max(user.get("bestAccuracy", 0), round(accuracy, 1))
    new_best_cons = max(user.get("bestConsistency", 0), round(consistency, 1))
    highest_index = max(user.get("highestHeroIndex", 0), hero_index)

    is_personal_best = round(wpm, 1) > user.get("bestWpm", 0)
    is_new_classification = hero_index > user.get("highestHeroIndex", 0)

    updated = {
        **user,
        "bestWpm": new_best_wpm,
        "bestAccuracy": new_best_acc,
        "bestConsistency": new_best_cons,
        "sumWpm": user.get("sumWpm", 0) + wpm,
        "sumAccuracy": user.get("sumAccuracy", 0) + accuracy,
        "totalTests": total_tests,
        "totalCharacters": user.get("totalCharacters", 0) + input.totalCharacters,
        "currentHero": hero_id,
        "highestHeroIndex": highest_index,
        "leaderboardScore": max(user.get("leaderboardScore", 0), score),
        "streak": streak,
        "lastTestDate": now.isoformat(),
    }
    updated["achievements"] = compute_achievements(updated)

    await db.users.update_one({"_id": user["_id"]}, {"$set": {
        "bestWpm": updated["bestWpm"],
        "bestAccuracy": updated["bestAccuracy"],
        "bestConsistency": updated["bestConsistency"],
        "sumWpm": updated["sumWpm"],
        "sumAccuracy": updated["sumAccuracy"],
        "totalTests": updated["totalTests"],
        "totalCharacters": updated["totalCharacters"],
        "currentHero": updated["currentHero"],
        "highestHeroIndex": updated["highestHeroIndex"],
        "leaderboardScore": updated["leaderboardScore"],
        "streak": updated["streak"],
        "lastTestDate": updated["lastTestDate"],
        "achievements": updated["achievements"],
    }})

    return {
        "result": sim,
        "isPersonalBest": is_personal_best,
        "isNewClassification": is_new_classification,
        "isAscensionComplete": hero_index == len(HERO_REQUIREMENTS) - 1 and is_new_classification,
        "user": public_user(updated),
    }


@api_router.get("/simulations/history")
async def simulation_history(user: dict = Depends(get_current_user)):
    cursor = db.simulations.find({"user_id": str(user["_id"])}).sort("created_at", -1).limit(50)
    sims = await cursor.to_list(50)
    for s in sims:
        s.pop("_id", None)
    return list(reversed(sims))


# ---------------------------------------------------------------- profile

@api_router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    cursor = db.simulations.find({"user_id": str(user["_id"])}).sort("created_at", 1).limit(50)
    sims = await cursor.to_list(50)
    for s in sims:
        s.pop("_id", None)
    return {"user": public_user(user), "history": sims, "achievements": user.get("achievements", [])}


# ---------------------------------------------------------------- leaderboard

@api_router.get("/leaderboard")
async def leaderboard(sort: str = "score", request: Request = None):
    sort_field = {"score": "leaderboardScore", "wpm": "bestWpm", "accuracy": "bestAccuracy"}.get(sort, "leaderboardScore")
    cursor = db.users.find({"totalTests": {"$gt": 0}}).sort(sort_field, -1).limit(100)
    users = await cursor.to_list(100)
    rows = []
    for i, u in enumerate(users):
        rows.append({
            "rank": i + 1,
            "id": str(u["_id"]),
            "username": u["username"],
            "wpm": u.get("bestWpm", 0),
            "accuracy": u.get("bestAccuracy", 0),
            "hero": u.get("currentHero", "nova"),
            "heroIndex": u.get("highestHeroIndex", 0),
            "score": u.get("leaderboardScore", 0),
        })

    current_id = None
    if request is not None:
        try:
            me_user = await get_current_user(request)
            current_id = str(me_user["_id"])
        except HTTPException:
            current_id = None
    return {"rows": rows, "currentUserId": current_id}


# ---------------------------------------------------------------- startup

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@ascendancy.io")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Ascend@2026")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "username": "ADMIN",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "currentHero": "nova", "highestHeroIndex": 0,
            "bestWpm": 0, "bestAccuracy": 0, "bestConsistency": 0,
            "sumWpm": 0, "sumAccuracy": 0,
            "totalTests": 0, "totalCharacters": 0,
            "streak": 0, "lastTestDate": None,
            "leaderboardScore": 0, "achievements": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
