from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from pymongo.collation import Collation
import logging
import bcrypt
import jwt
import re
import uuid
import resend

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
# Keyed per-user (see get_user_or_ip_key below), not per-IP like every other
# limiter in this file — submission abuse is meaningfully an account-level
# concern here, not an IP-level one.
SIMULATION_SUBMIT_RATE_LIMIT = os.environ.get("SIMULATION_SUBMIT_RATE_LIMIT", "20/hour")
# How long a /simulations/start session stays redeemable before the TTL
# index reaps it. Not env-configurable — this isn't a knob anyone would
# tune per-deployment the way the rate limits above are.
SIMULATION_SESSION_MINUTES = 5

# Used to build the link in the password reset email — see forgot_password()
# below.
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")

# Resend delivers the actual reset email when configured. Without a key
# (local dev, or before it's set up), forgot_password() falls back to logging
# the link instead of failing outright.
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "noreply@ascendancytyping.com")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def send_password_reset_email(to_email: str, reset_url: str) -> None:
    resend.Emails.send({
        "from": f"Ascendancy <{RESEND_FROM_EMAIL}>",
        "to": [to_email],
        "subject": "Reset your Ascendancy access key",
        "html": (
            "<p>Someone requested a password reset for this Ascendancy account.</p>"
            f'<p><a href="{reset_url}">Click here to reset your password</a></p>'
            "<p>This link expires in 30 minutes. If you didn't request this, "
            "you can safely ignore this email.</p>"
        ),
    })


# The interactive docs/schema hand anyone a complete map of every endpoint,
# field and validator for free — fine in development, unnecessary exposure
# once ENVIRONMENT=production.
_docs_enabled = ENVIRONMENT == "development"
app = FastAPI(
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)
api_router = APIRouter(prefix="/api")

# In-memory (per-process) limiter — fine for a single backend instance; would
# need a shared Redis storage backend if this ever runs as multiple replicas.
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


def get_user_or_ip_key(request: Request) -> str:
    """Rate-limit key for /simulations specifically: by authenticated user
    rather than IP, since submission abuse is an account-level concern here
    (falls back to IP only if the token can't be read/decoded, which
    shouldn't happen for an already-authenticated route in practice)."""
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if token:
        try:
            payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
            if payload.get("type") == "access" and payload.get("sub"):
                return f"user:{payload['sub']}"
        except Exception:
            pass
    return get_remote_address(request)


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


# bcrypt.checkpw takes ~300ms by design. login() must run it unconditionally
# even when no account matches the submitted email — otherwise "user not
# found" short-circuits instantly while "wrong password" takes ~300ms, and
# that gap is trivially measurable over the network, turning login into an
# account-enumeration oracle via timing alone.
_DUMMY_PASSWORD_HASH = bcrypt.hashpw(b"no-such-account-timing-parity", bcrypt.gensalt()).decode("utf-8")


def create_access_token(user_id: str, email: str, token_version: int = 0) -> str:
    payload = {"sub": user_id, "email": email, "ver": token_version,
               "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str, token_version: int = 0) -> str:
    payload = {"sub": user_id, "ver": token_version,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def revoke_all_tokens(user_id) -> None:
    """Bumping tokenVersion invalidates every access/refresh token issued
    before this call (both embed the version they were minted under) — used
    on logout and password reset so a stolen/leftover token from before that
    moment stops working immediately instead of riding out its own 7-day
    (refresh) or 15-minute (access) expiry."""
    await db.users.update_one({"_id": user_id}, {"$inc": {"tokenVersion": 1}})


def create_password_reset_token(user_id: str, jti: str) -> str:
    payload = {"sub": user_id, "jti": jti, "type": "password_reset",
               "exp": datetime.now(timezone.utc) + timedelta(minutes=30)}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True,
                        samesite="none", max_age=900, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True,
                        samesite="none", max_age=604800, path="/")


def next_streak(last_date_iso, current_streak: int, today) -> int:
    """Shared by the global streak and each locale's own streak — a day-over-day
    practice count only makes sense against the same clock/rules either way."""
    if not last_date_iso:
        return 1
    try:
        last = datetime.fromisoformat(last_date_iso).date()
        delta = (today - last).days
        if delta == 1:
            return current_streak + 1
        if delta > 1:
            return 1
        if current_streak == 0:
            return 1
        return current_streak
    except Exception:
        return 1


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
            "bestWpm": user.get("bestWpm", 0),
            "bestAccuracy": user.get("bestAccuracy", 0),
            "bestConsistency": user.get("bestConsistency", 0),
            "sumWpm": user.get("sumWpm", 0),
            "sumAccuracy": user.get("sumAccuracy", 0),
            "totalTests": user.get("totalTests", 0),
            "totalCharacters": user.get("totalCharacters", 0),
            "streak": user.get("streak", 0),
            "lastTestDate": user.get("lastTestDate"),
            "leaderboardScore": user.get("leaderboardScore", 0),
        }
    return hero_progress


def public_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "username": user["username"],
        "firstName": user.get("firstName", ""),
        "lastName": user.get("lastName", ""),
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


async def username_taken(username: str) -> bool:
    """Case-insensitive: "Player1" and "player1" must not both be
    registerable — they'd be indistinguishable at a glance on a public
    leaderboard, which is exactly what makes look-alike/impersonation
    usernames possible."""
    existing = await db.users.find_one({"username": {"$regex": f"^{re.escape(username)}$", "$options": "i"}})
    return existing is not None


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
        if payload.get("ver", 0) != user.get("tokenVersion", 0):
            raise HTTPException(status_code=401, detail="Token revoked")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------------------------------------------------------------- models

# Generic password requirements applied everywhere a user sets/changes their
# own access key (register, reset-password, Google account setup) — not
# enforced on login, since a login password was already valid when it was set.
_PASSWORD_MIN_LENGTH = 12
_PASSWORD_UPPER_RE = re.compile(r"[A-Z]")
_PASSWORD_LOWER_RE = re.compile(r"[a-z]")
_PASSWORD_DIGIT_RE = re.compile(r"\d")
_PASSWORD_SPECIAL_RE = re.compile(r"[^A-Za-z0-9]")


def _validate_password_strength(value: str) -> str:
    if len(value) < _PASSWORD_MIN_LENGTH:
        raise ValueError(f"Access key must be at least {_PASSWORD_MIN_LENGTH} characters.")
    if not _PASSWORD_UPPER_RE.search(value):
        raise ValueError("Access key must contain at least one uppercase letter.")
    if not _PASSWORD_LOWER_RE.search(value):
        raise ValueError("Access key must contain at least one lowercase letter.")
    if not _PASSWORD_DIGIT_RE.search(value):
        raise ValueError("Access key must contain at least one number.")
    if not _PASSWORD_SPECIAL_RE.search(value):
        raise ValueError("Access key must contain at least one special character.")
    return value


# Known throwaway/temp-inbox providers — blocked at registration since an
# account behind one of these isn't reachable by anyone in particular,
# defeating password reset, certificate ownership, and abuse follow-up alike.
# Not exhaustive (new ones appear constantly) — this catches the common,
# well-established ones, not a guarantee every disposable address is caught.
DISPOSABLE_EMAIL_DOMAINS = frozenset({
    "mailinator.com", "guerrillamail.com", "guerrillamail.info", "guerrillamail.biz",
    "guerrillamail.de", "guerrillamail.net", "guerrillamail.org", "sharklasers.com",
    "10minutemail.com", "10minutemail.net", "20minutemail.com", "temp-mail.org",
    "tempmail.com", "tempmail.net", "temp-mail.io", "tempinbox.com", "tempmailo.com",
    "throwawaymail.com", "yopmail.com", "yopmail.net", "yopmail.fr", "mailnesia.com",
    "mailcatch.com", "mailnull.com", "mytemp.email", "getnada.com", "moakt.com",
    "dispostable.com", "fakeinbox.com", "trashmail.com", "trashmail.net", "trash-mail.com",
    "maildrop.cc", "mintemail.com", "mohmal.com", "emailondeck.com", "spamgourmet.com",
    "spam4.me", "grr.la", "pokemail.net", "anonbox.net", "discard.email", "discardmail.com",
    "mailtemp.info", "tempr.email", "tempmail.plus", "tempmail.dev", "burnermail.io",
    "throwam.com", "33mail.com", "mail-temporaire.fr", "jetable.org", "einrot.com",
    "correotemporal.org", "wegwerfmail.de", "wegwerfemail.de", "spambog.com",
    "spambog.de", "spambog.ru", "tempemail.co", "tempemail.net", "emailfake.com",
    "fakemailgenerator.com", "crazymailing.com", "inboxbear.com", "luxusmail.org",
    "zetmail.com", "cool.fr.nf", "moburl.com", "rcpt.at", "mail-temp.com",
})


class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=_PASSWORD_MIN_LENGTH, max_length=128)
    username: str = Field(min_length=3, max_length=20)
    firstName: str = Field(min_length=1, max_length=50)
    lastName: str = Field(min_length=1, max_length=50)

    @field_validator("password")
    @classmethod
    def _check_password(cls, v):
        return _validate_password_strength(v)

    @field_validator("email")
    @classmethod
    def _check_not_disposable(cls, v):
        domain = v.split("@")[-1].lower()
        if domain in DISPOSABLE_EMAIL_DOMAINS:
            raise ValueError("Disposable/temporary email addresses aren't allowed — please use a real email address.")
        return v


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordInput(BaseModel):
    email: EmailStr


class ResetPasswordInput(BaseModel):
    token: str
    new_password: str = Field(min_length=_PASSWORD_MIN_LENGTH, max_length=128)

    @field_validator("new_password")
    @classmethod
    def _check_password(cls, v):
        return _validate_password_strength(v)


class DeleteAccountInput(BaseModel):
    password: str


class GoogleAuthInput(BaseModel):
    credential: str


class GoogleCompleteInput(BaseModel):
    setupToken: str
    username: str = Field(min_length=3, max_length=20)
    password: str = Field(min_length=_PASSWORD_MIN_LENGTH, max_length=128)
    firstName: str = Field(min_length=1, max_length=50)
    lastName: str = Field(min_length=1, max_length=50)

    @field_validator("password")
    @classmethod
    def _check_password(cls, v):
        return _validate_password_strength(v)


# The only durations the simulator ever offers — a submission claiming any
# other value didn't come from the real UI.
ALLOWED_SIMULATION_DURATIONS = {15, 30, 60, 120}


class UpdateNameInput(BaseModel):
    firstName: str = Field(min_length=1, max_length=50)
    lastName: str = Field(min_length=1, max_length=50)


class SimulationInput(BaseModel):
    wpm: float
    accuracy: float
    consistency: float
    correctCharacters: int = Field(ge=0)
    incorrectCharacters: int = Field(ge=0)
    totalCharacters: int = Field(ge=0)
    duration: int
    # Actual wall-clock seconds the run took, per the client's own timer.
    # Superseded by the server-tracked simulation_sessions timing below for
    # the actual wpm computation, but still accepted/stored for now rather
    # than ripped out — see submit_simulation()'s duration-handling comment.
    elapsedSeconds: float = Field(gt=0)
    locale: str = Field(default="en", max_length=16)
    # Optional (not Field(...) required) specifically so a missing session_id
    # can be rejected with a deliberate 400 + clear message in the route body,
    # rather than FastAPI's generic 422 for a missing required field.
    session_id: Optional[str] = None

    @field_validator("duration")
    @classmethod
    def _check_duration(cls, v):
        if v not in ALLOWED_SIMULATION_DURATIONS:
            raise ValueError("Invalid duration")
        return v


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
    first_name = input.firstName.strip()
    last_name = input.lastName.strip()
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be 3+ alphanumeric characters")
    if not first_name or not last_name:
        raise HTTPException(status_code=400, detail="First and last name are required")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An ascendant with this email already exists")
    if await username_taken(username):
        raise HTTPException(status_code=400, detail="That callsign is already taken")
    doc = {
        "email": email,
        "username": username,
        "firstName": first_name,
        "lastName": last_name,
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
        "tokenVersion": 0,
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
    # Always run bcrypt, win or lose, against a real hash either way — see
    # _DUMMY_PASSWORD_HASH above for why.
    password_ok = verify_password(input.password, user["password_hash"] if user else _DUMMY_PASSWORD_HASH)
    if not user or not password_ok:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token_version = user.get("tokenVersion", 0)
    access = create_access_token(str(user["_id"]), email, token_version)
    refresh = create_refresh_token(str(user["_id"]), token_version)
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
        if RESEND_API_KEY:
            try:
                send_password_reset_email(email, reset_url)
            except Exception:
                logger.exception(f"Failed to send password reset email to {email}")
        else:
            # No RESEND_API_KEY configured (e.g. local dev) — log the link
            # instead of failing the request outright.
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
    # A password reset is exactly the moment an attacker's still-live session
    # (from before the account owner regained control) needs to stop working
    # immediately, not ride out its own expiry.
    await revoke_all_tokens(user["_id"])
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
        # ascendant confirms a name, picks a callsign and sets an access key.
        # Issue a short-lived token proving the email was already verified by
        # Google, so the completion step doesn't need to re-check the raw credential.
        setup_token = jwt.encode(
            {"email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "google_setup"},
            get_jwt_secret(), algorithm=JWT_ALGORITHM,
        )
        # Google's given_name/family_name are only a prefill suggestion for
        # that form — the ascendant still confirms or edits them, so the
        # completion step takes firstName/lastName from the submitted form,
        # not back out of Google's claims.
        return {
            "needsSetup": True,
            "email": email,
            "setupToken": setup_token,
            "firstName": payload.get("given_name", ""),
            "lastName": payload.get("family_name", ""),
        }

    token_version = user.get("tokenVersion", 0)
    access = create_access_token(str(user["_id"]), email, token_version)
    refresh = create_refresh_token(str(user["_id"]), token_version)
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
    first_name = input.firstName.strip()
    last_name = input.lastName.strip()
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Callsign must be 3+ alphanumeric characters")
    if not first_name or not last_name:
        raise HTTPException(status_code=400, detail="First and last name are required")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An ascendant with this email already exists")
    if await username_taken(username):
        raise HTTPException(status_code=400, detail="That callsign is already taken")

    doc = {
        "email": email,
        "username": username,
        "firstName": first_name,
        "lastName": last_name,
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
        "tokenVersion": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id

    access = create_access_token(str(res.inserted_id), email)
    refresh = create_refresh_token(str(res.inserted_id))
    set_auth_cookies(response, access, refresh)
    return public_user(doc)


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    # Best-effort revocation: bump tokenVersion for whoever the (possibly
    # already-expired) access token belongs to, so a copy of that token
    # sitting anywhere else stops working immediately rather than riding out
    # its own expiry. Logout still always succeeds even if this can't
    # identify anyone (e.g. already logged out, or no cookie at all).
    token = request.cookies.get("access_token") or request.cookies.get("refresh_token")
    if token:
        try:
            payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM], options={"verify_exp": False})
            await revoke_all_tokens(ObjectId(payload["sub"]))
        except Exception:
            pass
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
        if payload.get("ver", 0) != user.get("tokenVersion", 0):
            raise HTTPException(status_code=401, detail="Refresh token revoked")
        access = create_access_token(str(user["_id"]), user["email"], user.get("tokenVersion", 0))
        response.set_cookie("access_token", access, httponly=True, secure=True,
                            samesite="none", max_age=900, path="/")
        return {"message": "refreshed"}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


# ---------------------------------------------------------------- simulation

@api_router.post("/simulations/start")
async def start_simulation_session(user: dict = Depends(get_current_user)):
    """Issues a short-lived, single-use session the client must present when
    it later submits a result — created_at becomes the server's own clock
    for that run, replacing reliance on the client's self-reported elapsed
    time. No rate limit here on purpose (not asked for, and the submit
    endpoint's own per-user limit already bounds how many actual scored
    submissions can land per hour regardless of how many sessions get
    started)."""
    now = datetime.now(timezone.utc)
    session_id = uuid.uuid4().hex
    await db.simulation_sessions.insert_one({
        "session_id": session_id,
        "user_id": str(user["_id"]),
        "created_at": now,
        "expires_at": now + timedelta(minutes=SIMULATION_SESSION_MINUTES),
        "used": False,
    })
    return {"session_id": session_id, "server_start_time": now.isoformat()}


@api_router.post("/simulations")
@limiter.limit(SIMULATION_SUBMIT_RATE_LIMIT, key_func=get_user_or_ip_key)
async def submit_simulation(request: Request, input: SimulationInput, user: dict = Depends(get_current_user)):
    if input.correctCharacters + input.incorrectCharacters != input.totalCharacters:
        raise HTTPException(status_code=400, detail="Character counts don't add up")

    # ---- session validation (server-authoritative timer) ----
    # Distinct messages per failure mode, per spec, so the frontend can show
    # something sensible rather than one generic "invalid session" string.
    if not input.session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    session = await db.simulation_sessions.find_one(
        {"session_id": input.session_id, "user_id": str(user["_id"])}
    )
    if not session:
        raise HTTPException(status_code=400, detail="Simulation session not found")

    now = datetime.now(timezone.utc)
    # Motor/pymongo hand back naive datetimes (this client wasn't constructed
    # with tz_aware=True, matching the rest of this codebase) — every other
    # timestamp in this app is stored/compared as an ISO string instead, but
    # a TTL index requires a real BSON Date, so this collection is a
    # deliberate one-off exception. Treat the naive value as UTC explicitly
    # rather than let a naive/aware comparison raise TypeError.
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if now > expires_at:
        raise HTTPException(status_code=400, detail="Simulation session expired")

    # Atomic compare-and-swap: the filter re-checks used=False at write time,
    # so of two concurrent requests racing on the same session, only one can
    # ever flip it — the loser sees modified_count == 0 and is rejected here,
    # same as a genuinely-already-used session. This closes the replay race
    # a naive "read used, then separately write used=True" would leave open.
    # It runs before any plausibility check below on purpose: a submission
    # that gets rejected for implausible stats still burns the session, so
    # repeatedly probing one session_id with tweaked numbers isn't a way to
    # get multiple guesses — each attempt needs a fresh /simulations/start
    # call, which the submit endpoint's own rate limit ultimately bounds.
    claim_result = await db.simulation_sessions.update_one(
        {"_id": session["_id"], "used": False},
        {"$set": {"used": True}},
    )
    if claim_result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Simulation session already used")

    created_at = session["created_at"]
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    # Floor at 1s: a near-instant replay attempt right after /start would
    # otherwise blow up the expected-wpm division below.
    server_duration_seconds = max((now - created_at).total_seconds(), 1.0)

    # ---- plausibility checks (422) ----
    # 400, not 250 — raised alongside the Hero Archive's expansion to 20
    # tiers, since INFINITE's own 300+ WPM requirement would otherwise be
    # permanently unreachable (this ceiling would reject the submission
    # before classify() ever saw the value). Keeps real headroom above the
    # new top tier the same way 250 gave headroom above the old one (130).
    if input.wpm > 400:
        raise HTTPException(status_code=422, detail="Reported WPM exceeds plausible maximum (400)")
    if input.accuracy > 100 or input.accuracy < 0:
        raise HTTPException(status_code=422, detail="Reported accuracy must be between 0 and 100")
    if input.correctCharacters > 0:
        # Spec's own formula uses totalCharacters, but that's not what "wpm"
        # actually means anywhere else in this codebase (frontend calcWpm and
        # this same endpoint's own recomputation below both use CORRECT
        # characters) — using totalCharacters here would inflate the
        # expected baseline for anyone with typos and could reject a
        # legitimate, merely-imperfect typist. Using correctCharacters
        # instead, to match the app's actual, established WPM definition.
        expected_wpm = (input.correctCharacters / 5) / (server_duration_seconds / 60)
        # 15%, per spec's own "roughly" — tunable, not derived from anything
        # more rigorous. Accounts for network/setTimeout jitter between the
        # client's last keystroke and this request landing.
        tolerance = 0.15
        if expected_wpm > 0 and abs(input.wpm - expected_wpm) / expected_wpm > tolerance:
            raise HTTPException(
                status_code=422,
                detail="Reported WPM is inconsistent with character count and elapsed time",
            )

    # wpm/accuracy are recomputed from the reported character counts and the
    # server-tracked duration above rather than trusted directly from the
    # client — this closes the trivial "just POST wpm: 400" path to a forged
    # leaderboard entry or certificate. This is a plausibility floor, not
    # full anti-cheat: a scripted client can still fabricate
    # internally-consistent character counts, since nothing here verifies a
    # real passage was actually typed.
    wpm = max(0.0, min((input.correctCharacters / 5) / (server_duration_seconds / 60), 400.0))
    accuracy = (
        max(0.0, min((input.correctCharacters / input.totalCharacters) * 100, 100.0))
        if input.totalCharacters > 0
        else 100.0
    )
    consistency = max(0.0, min(input.consistency, 100.0))

    score = compute_score(wpm, accuracy, consistency)
    hero_index = classify(wpm, accuracy, consistency, server_duration_seconds)
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
    streak = next_streak(user.get("lastTestDate"), user.get("streak", 0), today)

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
    previous_locale = hero_progress.get(locale, {})
    previous_locale_highest = previous_locale.get("highestHeroIndex", 0)
    locale_highest = max(previous_locale_highest, hero_index)
    locale_streak = next_streak(previous_locale.get("lastTestDate"), previous_locale.get("streak", 0), today)
    # Every stat shown on the profile is tracked per locale, not just the
    # classification — the profile's whole stats grid is scoped to whichever
    # language is being viewed, so a global number sitting next to a
    # per-locale classification never visibly contradicts it again (e.g. a
    # "Best WPM" that clears the next hero's bar while still showing tier 1).
    hero_progress[locale] = {
        "highestHeroIndex": locale_highest,
        "currentHero": hero_id,
        "bestWpm": max(previous_locale.get("bestWpm", 0), round(wpm, 1)),
        "bestAccuracy": max(previous_locale.get("bestAccuracy", 0), round(accuracy, 1)),
        "bestConsistency": max(previous_locale.get("bestConsistency", 0), round(consistency, 1)),
        "sumWpm": previous_locale.get("sumWpm", 0) + wpm,
        "sumAccuracy": previous_locale.get("sumAccuracy", 0) + accuracy,
        "totalTests": previous_locale.get("totalTests", 0) + 1,
        "totalCharacters": previous_locale.get("totalCharacters", 0) + input.totalCharacters,
        "streak": locale_streak,
        "lastTestDate": now.isoformat(),
        "leaderboardScore": max(previous_locale.get("leaderboardScore", 0), score),
    }

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


@api_router.patch("/profile/name")
async def update_name(input: UpdateNameInput, user: dict = Depends(get_current_user)):
    # Accounts that registered before firstName/lastName were required (or via
    # Google before this endpoint existed) have no way to set them after the
    # fact otherwise — certificates fall back to displaying the username
    # instead of a real name until this is filled in.
    first_name = input.firstName.strip()
    last_name = input.lastName.strip()
    if not first_name or not last_name:
        raise HTTPException(status_code=400, detail="First and last name are required")
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"firstName": first_name, "lastName": last_name}},
    )
    user["firstName"] = first_name
    user["lastName"] = last_name
    return public_user(user)


# ---------------------------------------------------------------- health

@api_router.get("/health")
async def health():
    # No DB round-trip and no rate limit on purpose — this exists to be
    # pinged frequently (e.g. an external keep-alive job) without touching
    # real data or counting against any user-facing limiter.
    return {"status": "ok"}


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
    # strength=2 collation makes the uniqueness case-insensitive at the
    # storage layer too — the app-level check in username_taken() can't by
    # itself close the race between two simultaneous registrations for
    # usernames that only differ in case.
    try:
        await db.users.drop_index("username_1")
    except Exception:
        pass
    await db.users.create_index(
        "username", unique=True, collation=Collation(locale="en", strength=2)
    )
    # TTL index: MongoDB reaps a document once its expires_at value (a real
    # BSON Date — see start_simulation_session()) is expireAfterSeconds=0
    # seconds in the past, i.e. as soon as it's expired. No manual cleanup
    # job needed.
    await db.simulation_sessions.create_index("expires_at", expireAfterSeconds=0)

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
            "tokenVersion": 0,
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
