from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import logging
import bcrypt
import jwt
import re
import uuid

from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from classification import compute_score, classify, hero_id_for_index, HERO_REQUIREMENTS

# ---------------------------------------------------------------- infra
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def get_google_client_id() -> str:
    return os.environ.get("GOOGLE_CLIENT_ID", "")


ENVIRONMENT = os.environ.get("ENVIRONMENT", "production").strip().lower()

# A previously-documented default that must never be accepted again, even if
# someone pastes it into a real .env out of habit.
_LEAKED_DEFAULT_ADMIN_PASSWORD = "Ascend@2026"
_MIN_ADMIN_PASSWORD_LENGTH = 10

# Per-IP request limits on auth endpoints, tunable without a code change.
# slowapi's rate-string format: "<count>/<second|minute|hour|day>".
LOGIN_RATE_LIMIT = os.environ.get("LOGIN_RATE_LIMIT", "5/minute")
REGISTER_RATE_LIMIT = os.environ.get("REGISTER_RATE_LIMIT", "10/hour")
REFRESH_RATE_LIMIT = os.environ.get("REFRESH_RATE_LIMIT", "20/minute")
FORGOT_PASSWORD_RATE_LIMIT = os.environ.get("FORGOT_PASSWORD_RATE_LIMIT", "5/hour")
RESET_PASSWORD_RATE_LIMIT = os.environ.get("RESET_PASSWORD_RATE_LIMIT", "10/hour")
DELETE_ACCOUNT_RATE_LIMIT = os.environ.get("DELETE_ACCOUNT_RATE_LIMIT", "5/hour")

# Used to build the link in the (dev-stub) password reset email — see
# forgot_password() below. No email infra exists yet; this only affects the
# URL that gets logged to the console.
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")


app = FastAPI()
api_router = APIRouter(prefix="/api")

# In-memory (per-process) limiter — fine for a single backend instance; would
# need a shared Redis storage backend if this ever runs as multiple replicas.
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    response = JSONResponse(
        status_code=429,
        content={"detail": f"Too many requests — rate limit exceeded ({exc.detail})"},
    )
    return limiter._inject_headers(response, request.state.view_rate_limit)

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


def create_password_reset_token(user_id: str, jti: str) -> str:
    payload = {"sub": user_id, "jti": jti, "type": "password_reset",
               "exp": datetime.now(timezone.utc) + timedelta(minutes=30)}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True,
                        samesite="none", max_age=900, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True,
                        samesite="none", max_age=604800, path="/")


def hero_progress_with_legacy_fallback(user: dict) -> dict:
    """heroProgress didn't exist before per-locale unlocks were introduced,
    so every simulation run before then is undated with no locale attached.
    Those all happened under the app's default locale (English) — seed an
    "en" entry from the old global fields so accounts that already have
    progress don't appear to suddenly lose it, while every other locale
    correctly starts at zero, unproven."""
    hero_progress = dict(user.get("heroProgress", {}))
    if "en" not in hero_progress and user.get("highestHeroIndex", 0) > 0:
        hero_progress["en"] = {
            "highestHeroIndex": user.get("highestHeroIndex", 0),
            "currentHero": user.get("currentHero", "nova"),
        }
    return hero_progress


def public_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "username": user["username"],
        "role": user.get("role", "ascendant"),
        "currentHero": user.get("currentHero", "nova"),
        "highestHeroIndex": user.get("highestHeroIndex", 0),
        "heroProgress": hero_progress_with_legacy_fallback(user),
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


class ForgotPasswordInput(BaseModel):
    email: EmailStr


class ResetPasswordInput(BaseModel):
    token: str
    new_password: str = Field(min_length=6, max_length=128)


class DeleteAccountInput(BaseModel):
    password: str


class GoogleAuthInput(BaseModel):
    credential: str


class GoogleCompleteInput(BaseModel):
    setupToken: str
    username: str = Field(min_length=3, max_length=20)
    password: str = Field(min_length=6, max_length=128)


class SimulationInput(BaseModel):
    wpm: float
    accuracy: float
    consistency: float
    correctCharacters: int
    incorrectCharacters: int
    totalCharacters: int
    duration: int
    locale: str = Field(default="en", max_length=16)


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
@limiter.limit(REGISTER_RATE_LIMIT)
async def register(request: Request, input: RegisterInput, response: Response):
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
@limiter.limit(LOGIN_RATE_LIMIT)
async def login(request: Request, input: LoginInput, response: Response):
    email = input.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access = create_access_token(str(user["_id"]), email)
    refresh = create_refresh_token(str(user["_id"]))
    set_auth_cookies(response, access, refresh)
    return public_user(user)


@api_router.post("/auth/forgot-password")
@limiter.limit(FORGOT_PASSWORD_RATE_LIMIT)
async def forgot_password(request: Request, input: ForgotPasswordInput):
    email = input.email.lower().strip()
    user = await db.users.find_one({"email": email})

    if user:
        jti = uuid.uuid4().hex
        # Overwriting the stored jti also invalidates any link from a
        # previous forgot-password call — only the most recent one works.
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"reset_token_jti": jti}})
        token = create_password_reset_token(str(user["_id"]), jti)
        reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
        # No email-sending infra exists in this codebase yet (SendGrid/SES/
        # Postmark etc. would need to be wired up separately) — logging the
        # link is a deliberate dev-only stand-in, not the finished feature.
        logger.warning(f"[DEV] Password reset link for {email}: {reset_url}")

    # Always the same response, whether or not the email is registered —
    # otherwise this endpoint becomes an account-enumeration oracle.
    return {"message": "If an account with that email exists, a password reset link has been sent."}


@api_router.post("/auth/reset-password")
@limiter.limit(RESET_PASSWORD_RATE_LIMIT)
async def reset_password(request: Request, input: ResetPasswordInput):
    try:
        payload = jwt.decode(input.token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="This reset link has expired — request a new one")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    # The jti match is what makes the token single-use: a successful reset
    # (or a newer forgot-password request) clears/overwrites it below, so a
    # replayed or superseded token no longer matches.
    if not user or user.get("reset_token_jti") != payload.get("jti"):
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": hash_password(input.new_password)},
         "$unset": {"reset_token_jti": ""}},
    )
    # Known limitation: refresh tokens are stateless signed JWTs with no
    # server-side revocation list, so any refresh token issued before this
    # reset remains valid until it naturally expires (see create_refresh_token).
    # Building revocation is a separate piece of work, not a side effect of this one.
    return {"message": "Password reset successful — sign in with your new password."}


@api_router.post("/auth/google")
async def google_auth(input: GoogleAuthInput, response: Response):
    client_id = get_google_client_id()
    if not client_id:
        raise HTTPException(status_code=500, detail="Google sign-in is not configured")
    try:
        payload = google_id_token.verify_oauth2_token(
            input.credential, google_requests.Request(), client_id
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google credential")

    if not payload.get("email_verified", False):
        raise HTTPException(status_code=401, detail="Google email is not verified")

    email = payload["email"].lower().strip()
    user = await db.users.find_one({"email": email})

    if user is None:
        # No account with this Google email yet — don't create one until the
        # ascendant picks a callsign and access key. Issue a short-lived
        # token proving the email was already verified by Google, so the
        # completion step doesn't need to re-check the raw credential.
        setup_token = jwt.encode(
            {"email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "google_setup"},
            get_jwt_secret(), algorithm=JWT_ALGORITHM,
        )
        return {"needsSetup": True, "email": email, "setupToken": setup_token}

    access = create_access_token(str(user["_id"]), email)
    refresh = create_refresh_token(str(user["_id"]))
    set_auth_cookies(response, access, refresh)
    return public_user(user)


@api_router.post("/auth/google/complete")
async def google_auth_complete(input: GoogleCompleteInput, response: Response):
    try:
        payload = jwt.decode(input.setupToken, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "google_setup":
            raise HTTPException(status_code=401, detail="Invalid setup token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Setup session expired — sign in with Google again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid setup token")

    email = payload["email"]
    username = re.sub(r"[^A-Za-z0-9_\-]", "", input.username).strip()
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Callsign must be 3+ alphanumeric characters")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An ascendant with this email already exists")
    if await db.users.find_one({"username": username}):
        raise HTTPException(status_code=400, detail="That callsign is already taken")

    doc = {
        "email": email,
        "username": username,
        "password_hash": hash_password(input.password),
        "auth_provider": "google",
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


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


@api_router.delete("/auth/account")
@limiter.limit(DELETE_ACCOUNT_RATE_LIMIT)
async def delete_account(request: Request, input: DeleteAccountInput, response: Response,
                          user: dict = Depends(get_current_user)):
    if not verify_password(input.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password")

    # Leaderboard rows are derived live from user documents (bestWpm,
    # leaderboardScore, etc. on db.users) rather than aggregated from
    # db.simulations at read time, and no endpoint exposes simulations
    # across users — so deleting this user's simulation rows alongside
    # their account has no effect on anyone else's leaderboard integrity,
    # and there's nothing left that could ever read the orphaned rows.
    # Full cascading delete, not anonymization, is the correct call here.
    await db.simulations.delete_many({"user_id": str(user["_id"])})
    await db.users.delete_one({"_id": user["_id"]})

    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Account deleted"}


@api_router.post("/auth/refresh")
@limiter.limit(REFRESH_RATE_LIMIT)
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
    # Hero unlocks are scoped per language: typing fast in English proves
    # nothing about typing fast in, say, Japanese, so each locale keeps its
    # own high-water mark rather than sharing the global one.
    locale = re.sub(r"[^a-z0-9-]", "", (input.locale or "en").strip().lower())[:16] or "en"

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
        "locale": locale,
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
    # Global high-water mark across all locales — still used for the
    # cross-language achievement badges (ascension/velocity/sovereign) and
    # the leaderboard's decorative hero column, neither of which is
    # language-specific.
    highest_index = max(user.get("highestHeroIndex", 0), hero_index)

    hero_progress = hero_progress_with_legacy_fallback(user)
    previous_locale_highest = hero_progress.get(locale, {}).get("highestHeroIndex", 0)
    locale_highest = max(previous_locale_highest, hero_index)
    hero_progress[locale] = {"highestHeroIndex": locale_highest, "currentHero": hero_id}

    is_personal_best = round(wpm, 1) > user.get("bestWpm", 0)
    is_new_classification = hero_index > previous_locale_highest

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
        "heroProgress": hero_progress,
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
        "heroProgress": updated["heroProgress"],
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

    admin_email = os.environ.get("ADMIN_EMAIL")
    admin_password = os.environ.get("ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        if ENVIRONMENT == "development":
            logger.warning(
                "ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin account creation "
                "(ENVIRONMENT=development)."
            )
            return
        raise RuntimeError(
            "ADMIN_EMAIL and ADMIN_PASSWORD must both be set in the environment — "
            "there is no default admin account. Set ENVIRONMENT=development to boot "
            "without one during local development."
        )

    if admin_password == _LEAKED_DEFAULT_ADMIN_PASSWORD:
        raise RuntimeError(
            "ADMIN_PASSWORD is set to a previously public default value and must be "
            "changed before startup."
        )
    if len(admin_password) < _MIN_ADMIN_PASSWORD_LENGTH:
        raise RuntimeError(
            f"ADMIN_PASSWORD must be at least {_MIN_ADMIN_PASSWORD_LENGTH} characters."
        )

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
