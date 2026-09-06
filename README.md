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

Production (`ascendancytyping.com`) runs the frontend and backend on
separate hosts:

1. **Database**: MongoDB Atlas. Set `MONGO_URL`/`DB_NAME` on the backend
   accordingly.
2. **Backend**: deployed separately (Render, via `backend/Dockerfile`) behind
   HTTPS. Set `JWT_SECRET`, `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS` (the
   frontend's exact origin), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `RESEND_API_KEY`,
   `RESEND_FROM_EMAIL`, `FRONTEND_URL`.
3. **Frontend**: deployed to **Cloudflare Pages**, automatically, via
   `.github/workflows/deploy.yml` on every push to `main` that touches
   `frontend/`. The workflow builds with `REACT_APP_BACKEND_URL` (from a
   repo secret) pointed at the backend's public HTTPS URL, then runs
   `wrangler pages deploy` — no manual build/upload step. Requires these
   GitHub repo secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
   `REACT_APP_BACKEND_URL`.
4. **HTTPS is required on both**: auth cookies are set with
   `samesite="none"; secure=true`, so browsers will silently drop them over
   plain HTTP or on a mismatched origin. Render and Cloudflare Pages both
   provide this automatically.

**Self-hosted alternative**: the `Dockerfile`+nginx setup under `frontend/`
(and the `docker compose` setup above) still works for building and serving
the frontend yourself instead of Cloudflare Pages — useful for local
testing or a fully self-hosted deployment, but it's not what production
actually runs.

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
