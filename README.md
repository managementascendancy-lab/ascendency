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

## SEO / Static Prerendering

Ascendancy is a CRA/craco single-page app — by default the server sends a
near-empty `index.html` and React fills it in client-side. That's fine for
crawlers that execute JavaScript (Google), but Bing and most link-unfurl
bots (Slack, Discord, generic SEO tools) see a blank page. To fix that for
the content pages specifically, `yarn build` runs a `postbuild` step
(`frontend/scripts/prerender.js`) that:

1. Serves the freshly built `build/` folder locally.
2. Drives it with a real headless Chromium (Puppeteer) for each content
   route.
3. Writes the fully-rendered HTML back into `build/` as static
   `<route>/index.html` files — e.g. `build/guides/improving-your-wpm/index.html`
   contains the actual rendered article, not an empty `<div id="root">`.

**What gets prerendered**: `/`, `/guides`, and `/guides/:slug` for every
article under `frontend/src/content/guides/`. The slug list is read fresh
off disk on every build — adding a new guide is just dropping in a new
`.md` file with frontmatter (`title`, `description`, `date`, `readTime`);
no route list to update anywhere.

**What does NOT get prerendered, on purpose**: `/simulator`, `/profile`,
`/leaderboard`, `/achievements`, `/auth` — these are authenticated and/or
render live dynamic data, so a static snapshot would either be wrong or
require baking in a specific user's session. They stay client-only.

**Hydration, not replacement**: the prerendered HTML still ships the same
`<script>` bundle tag as the normal build, so React hydrates on top of the
static markup in the browser exactly like any other CRA page — client-side
navigation (SPA behavior) is unaffected. Only the very first HTML response
differs, which is the whole point.

**Why Puppeteer instead of react-snap**: react-snap (and the similar
`prerender-spa-plugin` / `react-snapshot`) are unmaintained and predate
React 18/19's hydration API — using them risked broken output for an
unclear benefit over just driving a real, actively-maintained headless
browser directly. The prerender script is ~120 lines and has no
framework-specific assumptions to go stale.

**Docker**: `frontend/Dockerfile`'s build stage runs on `node:20-bookworm-slim`
(not `-alpine`) specifically because Puppeteer's bundled Chromium needs
glibc; the shipped image is still the small `nginx:alpine` one. `RUN yarn build`
already triggers `postbuild` automatically, so prerendering happens before
the `COPY --from=build /app/build ...` step into the nginx stage — no
Dockerfile ordering changes were needed beyond the base image swap.
`nginx.conf` uses `try_files $uri $uri/ /index.html;` so a request for
`/guides/some-article` resolves to that folder's `index.html` when present,
falling back to the SPA shell for every other route.

## Tests

```
cd backend
pip install -r requirements.txt
pytest                          # set REACT_APP_BACKEND_URL to point at a running backend
```
