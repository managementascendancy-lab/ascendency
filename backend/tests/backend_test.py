"""Ascendancy backend API tests: auth, simulations, profile, leaderboard."""
import os
import time
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

# Same .env the running backend loads (server.py's ROOT_DIR is backend/,
# one level up from this tests/ dir) — so admin credentials here can never
# silently drift from what the server under test is actually configured with.
load_dotenv(Path(__file__).parent.parent / ".env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")


@pytest.fixture(scope="module")
def unique_user():
    uid = uuid.uuid4().hex[:8]
    return {
        "email": f"TEST_{uid}@ascendtest.io",
        "username": f"TEST_{uid}",
        "password": "TestPass@2026",
    }


@pytest.fixture(scope="module")
def session():
    return requests.Session()


# -------- auth --------

class TestAuth:
    def test_register_new_user(self, session, unique_user):
        r = session.post(f"{API}/auth/register", json=unique_user)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == unique_user["email"].lower()
        assert data["username"] == unique_user["username"]
        assert "access_token" in session.cookies or any("access_token" in c.name for c in session.cookies)

    def test_me_after_register(self, session, unique_user):
        r = session.get(f"{API}/auth/me")
        assert r.status_code == 200, r.text
        assert r.json()["email"] == unique_user["email"].lower()

    def test_duplicate_email_rejected(self, session, unique_user):
        r = requests.post(f"{API}/auth/register", json=unique_user)
        assert r.status_code == 400

    def test_logout(self, session):
        r = session.post(f"{API}/auth/logout")
        assert r.status_code == 200
        me = session.get(f"{API}/auth/me")
        assert me.status_code == 401

    def test_login_valid(self, session, unique_user):
        r = session.post(f"{API}/auth/login", json={"email": unique_user["email"], "password": unique_user["password"]})
        assert r.status_code == 200, r.text
        me = session.get(f"{API}/auth/me")
        assert me.status_code == 200

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "nobody@nope.io", "password": "wrong"})
        assert r.status_code == 401

    def test_admin_login(self):
        if not ADMIN_EMAIL or not ADMIN_PASSWORD:
            pytest.skip("ADMIN_EMAIL/ADMIN_PASSWORD not set in backend/.env — nothing to test")
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        assert r.json()["email"] == ADMIN_EMAIL


# -------- simulations & profile --------

class TestSimulation:
    def test_submit_simulation_and_persist(self, session):
        payload = {
            "wpm": 85.5,
            "accuracy": 96.2,
            "consistency": 88.0,
            "correctCharacters": 300,
            "incorrectCharacters": 12,
            "totalCharacters": 312,
            "duration": 30,
        }
        r = session.post(f"{API}/simulations", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "result" in data and "user" in data
        assert data["result"]["wpm"] == 85.5
        assert data["result"]["hero"]
        assert data["user"]["totalTests"] >= 1
        assert data["user"]["bestWpm"] >= 85.5

    def test_profile_reflects_simulation(self, session):
        r = session.get(f"{API}/profile")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["totalTests"] >= 1
        assert len(data["history"]) >= 1
        # ensure no ObjectId leak
        for s in data["history"]:
            assert "_id" not in s

    def test_history_endpoint(self, session):
        r = session.get(f"{API}/simulations/history")
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list) and len(arr) >= 1

    def test_simulations_requires_auth(self):
        r = requests.post(f"{API}/simulations", json={
            "wpm": 50, "accuracy": 90, "consistency": 80,
            "correctCharacters": 100, "incorrectCharacters": 5,
            "totalCharacters": 105, "duration": 30
        })
        assert r.status_code == 401


# -------- leaderboard --------

class TestLeaderboard:
    @pytest.mark.parametrize("sort", ["score", "wpm", "accuracy"])
    def test_leaderboard_sorts(self, sort):
        r = requests.get(f"{API}/leaderboard", params={"sort": sort})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "rows" in data
        assert isinstance(data["rows"], list)
        # no ObjectId leak
        for row in data["rows"]:
            assert "_id" not in row
            assert "rank" in row

    def test_leaderboard_current_user_marker(self, session):
        r = session.get(f"{API}/leaderboard?sort=score")
        assert r.status_code == 200
        data = r.json()
        assert data["currentUserId"] is not None
        # user should appear in rows
        assert any(row["id"] == data["currentUserId"] for row in data["rows"])
