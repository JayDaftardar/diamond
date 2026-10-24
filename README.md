# Diamond Hospital website

- `frontend/` TanStack Start (React 19, Vite, server-rendered)
- `backend/` FastAPI + SQLAlchemy + PostgreSQL (Neon in production)
- `PLAN.md` design and architecture plan; `info.md` hospital content source

## Run locally
Backend (needs Python 3.13+ and [uv](https://docs.astral.sh/uv/)):

    cd backend
    cp .env.example .env      # fill in DATABASE_URL, APP_SECRET, ADMIN_1/2_*
    uv run alembic upgrade head                    # create / update the tables
    uv run python -m scripts.seed_content          # departments, doctors, draft treatments
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
