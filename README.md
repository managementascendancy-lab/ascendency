# Ascendancy

A typing-speed simulator: measure WPM, accuracy and consistency, then unlock
hero classifications and climb the leaderboard.

- `backend/` — FastAPI + MongoDB (Motor), JWT auth in httpOnly cookies
- `frontend/` — React (CRA/craco) + Tailwind + Radix UI

## Local development

**Backend**

```
cd backend
python -m venv venv && venv\Scripts\activate   # or `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
copy .env.example .env   # then fill in real values
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

**Frontend**

```
cd frontend
yarn install
copy .env.example .env   # then fill in real values
yarn start
```

The app is served at `http://localhost:3000`, the API at `http://localhost:8001`.

## Docker (backend + frontend + MongoDB)

```
cp backend/.env.example backend/.env   # fill in real values
docker compose up --build
```

Frontend on `http://localhost:3000`, API on `http://localhost:8001`, MongoDB
persisted in a named volume.

## Deploying

1. **Database**: a MongoDB Atlas free-tier cluster is the least-effort option;
   self-hosting `mongod` works too. Set `MONGO_URL`/`DB_NAME` accordingly.
2. **Backend**: deploy `backend/` (via its `Dockerfile`, or any Python host)
   behind HTTPS. Set `JWT_SECRET`, `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`
   (the frontend's exact origin), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. **Frontend**: build with `REACT_APP_BACKEND_URL` pointed at the backend's
   public HTTPS URL, then serve the static `build/` output (via the provided
   `Dockerfile`+nginx, or any static host).
4. **HTTPS is required on both**: auth cookies are set with
   `samesite="none"; secure=true`, so browsers will silently drop them over
   plain HTTP or on a mismatched origin.

## Tests

```
cd backend
pip install -r requirements.txt
pytest                          # set REACT_APP_BACKEND_URL to point at a running backend
```
