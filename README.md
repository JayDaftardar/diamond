# Diamond Hospital website

- `frontend/` TanStack Start (React 19, Vite, server-rendered)
- `backend/` FastAPI + SQLAlchemy + PostgreSQL (Neon in production)
- `PLAN.md` design and architecture plan; `info.md` hospital content source

## Run locally
Backend (needs Python 3.13+ and [uv](https://docs.astral.sh/uv/)):

    cd backend
    cp .env.example .env      # fill in DATABASE_URL, APP_SECRET, ADMIN_1/2_*
    uv run alembic upgrade head                    # create / update the tables
    uv run python -m scripts.seed_content          # departments, doctors, treatments (names only)
    uv run python -m scripts.import_doctor_photos  # starting doctor photos into the database
    uv run python -m scripts.seed_admins           # the two admin accounts
    uv run uvicorn app.main:app --reload --port 8000

The seed and import scripts are safe to re-run; they never overwrite admin edits.
Doctor photos are uploaded in the admin and stored in PostgreSQL.

Frontend:

    cd frontend
    cp .env.example .env
    npm install
    npm run dev               # http://localhost:3000

Checks: `uv run ruff check . && uv run pytest` (backend), `npm run lint && npm run build` (frontend).

## Search engines and security headers
The frontend serves these itself (restart `npm run dev` after pulling, so the headers apply):

- **`/sitemap.xml`** is built on each request from the API's list of public pages, so a new
  doctor or a hidden treatment shows up without a rebuild. Hidden items are left out, and so are
  treatments that have no description yet (those pages are also `noindex`). Cached for an hour;
  answers 503 "try again later" if the API is down rather than publishing an empty list.
- **`/robots.txt`** allows crawling and points to the sitemap. The admin is not listed there on
  purpose (that would advertise it); every admin response carries `X-Robots-Tag: noindex`.
- **Security headers** are added to every frontend response by `frontend/src/start.ts`, using the
  rules in `frontend/src/lib/securityHeaders.ts`: no content-type sniffing, no framing, a strict
  referrer policy, a restrictive permissions policy and `same-origin` opener policy, and, in
  production only, a Content-Security-Policy and HSTS. The policy allows images and requests only
  from the site, the API and YouTube thumbnails, and frames only from YouTube (no-cookie),
  Google Slides, OneDrive / Office and the Google Maps embed. **If you embed from a new host,
  add it to `frame-src` there.** `script-src` still allows inline scripts; closing that gap
  would need a one-time nonce on each inline script.

What these depend on (set when the frontend is built or started):

| Setting | Used for |
|---|---|
| `VITE_SITE_URL` | addresses in the sitemap, robots.txt and page links (set at **build** time) |
| `VITE_API_PUBLIC_URL` | the API address the browser may load photos from and send requests to (set at **build** time) |
| `API_INTERNAL_URL` | where the frontend's server reads data from (set at **run** time) |
