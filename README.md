# Diamond Hospital website

- `frontend/` TanStack Start (React 19, Vite, server-rendered)
- `backend/` FastAPI + SQLAlchemy + PostgreSQL (Neon in production)
- `PLAN.md` design and architecture plan; `info.md` hospital content source

## Run locally
Backend (needs Python 3.13+ and [uv](https://docs.astral.sh/uv/)):

    cd backend
    cp .env.example .env      # fill in DATABASE_URL, APP_SECRET
    uv run uvicorn app.main:app --reload --port 8000

Frontend:

    cd frontend
    cp .env.example .env
    npm install
    npm run dev               # http://localhost:3000

Checks: `uv run ruff check . && uv run pytest` (backend), `npm run lint && npm run build` (frontend).
