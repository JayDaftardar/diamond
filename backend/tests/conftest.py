"""Test setup: a throwaway Postgres database (diamond_test), emptied before every test."""

import os
from pathlib import Path


def _test_database_url() -> str:
    """TEST_DATABASE_URL if set; otherwise the dev DATABASE_URL from .env with the database
    name swapped to diamond_test, so no password is ever written into the code."""
    explicit = os.environ.get("TEST_DATABASE_URL")
    if explicit:
        return explicit
    env_file = Path(__file__).resolve().parents[1] / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.startswith("DATABASE_URL="):
                url = line.split("=", 1)[1].strip().strip("\"'")
                return url.rsplit("/", 1)[0] + "/diamond_test"
    raise RuntimeError("Set TEST_DATABASE_URL, or DATABASE_URL in backend/.env.")


# Must be set before any `app` import, because app.db builds its engine at import time.
os.environ["DATABASE_URL"] = _test_database_url()
os.environ.setdefault("APP_SECRET", "test-secret")
# Pin settings the tests depend on, whatever is in a developer's local .env.
os.environ["COOKIE_SECURE"] = "false"
os.environ["ALLOWED_ORIGINS"] = '["http://localhost:3000"]'
os.environ["TRUST_PROXY_HEADERS"] = "false"

import pytest  # noqa: E402
from sqlalchemy import text  # noqa: E402

import app.models  # noqa: E402,F401
from app.db import Base, SessionLocal, engine  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _schema():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture()
def db():
    with SessionLocal() as session:
        yield session
    with engine.begin() as conn:
        names = ", ".join(t.name for t in Base.metadata.sorted_tables)
        conn.execute(text(f"TRUNCATE {names} RESTART IDENTITY CASCADE"))


ORIGIN = "http://localhost:3000"
ADMIN_EMAIL = "admin1@test.local"
ADMIN_PASSWORD = "correct-horse-battery"


@pytest.fixture()
def admin_client(db):
    """A TestClient signed in as an admin, sending the allowed Origin like the real site does."""
    from fastapi.testclient import TestClient

    from app.main import app
    from scripts.seed_admins import seed_admins

    seed_admins(db, [(ADMIN_EMAIL, ADMIN_PASSWORD), ("admin2@test.local", "another-long-password")])
    client = TestClient(app, headers={"Origin": ORIGIN})
    r = client.post(
        "/api/v1/admin/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert r.status_code == 200, r.text
    return client
