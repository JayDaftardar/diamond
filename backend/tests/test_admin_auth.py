import re
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.models import AdminSession, AdminUser
from app.security.sessions import COOKIE_NAME
from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD, ORIGIN

LOGIN = "/api/v1/admin/auth/login"
ME = "/api/v1/admin/auth/me"
OPEN_ROUTES = {"/api/v1/admin/auth/login", "/api/v1/admin/auth/logout"}


def anonymous():
    return TestClient(app, headers={"Origin": ORIGIN})


def _api_routes():
    """(method, path) for every endpoint, read from the OpenAPI schema because FastAPI
    nests included routers lazily and `app.routes` no longer lists them flat."""
    for path, operations in app.openapi()["paths"].items():
        for method in operations:
            yield method.upper(), path


def test_every_admin_route_requires_a_session():
    """Protection is on the server: no cookie means 401 on every admin endpoint but login/logout."""
    checked = 0
    for method, path in _api_routes():
        if not path.startswith("/api/v1/admin") or path in OPEN_ROUTES:
            continue
        concrete = re.sub(r"\{[a-z_]+\}", "1", path)
        r = anonymous().request(method, concrete, json={})
        assert r.status_code == 401, f"{method} {path} -> {r.status_code}"
        checked += 1
    assert checked >= 25  # guards against the loop silently checking nothing


def test_there_is_no_registration_endpoint():
    paths = {path for _, path in _api_routes()}
    assert not any("register" in p or "signup" in p for p in paths)


def test_login_sets_secure_cookie_and_session_works(admin_client, db):
    cookie = admin_client.cookies.get(COOKIE_NAME)
    assert cookie
    assert admin_client.get(ME).json()["email"] == ADMIN_EMAIL

    # Only a hash of the token is stored, never the token.
    stored = db.scalar(select(AdminSession.token_hash))
    assert stored != cookie and len(stored) == 64


def test_login_cookie_flags(db):
    from scripts.seed_admins import seed_admins

    seed_admins(db, [(ADMIN_EMAIL, ADMIN_PASSWORD), ("admin2@test.local", "another-long-password")])
    r = anonymous().post(LOGIN, json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    header = r.headers["set-cookie"].lower()
    assert "httponly" in header and "samesite=strict" in header and "path=/" in header
    assert r.headers["cache-control"] == "no-store"


def test_logout_ends_the_session(admin_client):
    assert admin_client.post("/api/v1/admin/auth/logout").status_code == 204
    assert admin_client.get(ME).status_code == 401


def test_wrong_password_and_unknown_email_look_identical(admin_client):
    bad_pw = anonymous().post(LOGIN, json={"email": ADMIN_EMAIL, "password": "nope-nope-nope"})
    unknown = anonymous().post(
        LOGIN, json={"email": "who@test.local", "password": "nope-nope-nope"}
    )
    assert bad_pw.status_code == unknown.status_code == 401
    assert bad_pw.json() == unknown.json() == {"detail": "Incorrect email or password."}


def test_login_is_rate_limited_even_for_the_right_password(db):
    from scripts.seed_admins import seed_admins

    seed_admins(db, [(ADMIN_EMAIL, ADMIN_PASSWORD), ("admin2@test.local", "another-long-password")])
    client = anonymous()
    for _ in range(5):
        assert (
            client.post(
                LOGIN, json={"email": ADMIN_EMAIL, "password": "wrong-wrong-wrong"}
            ).status_code
            == 401
        )
    r = client.post(LOGIN, json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 429


def test_inactive_admin_cannot_sign_in(db):
    from scripts.seed_admins import seed_admins

    seed_admins(db, [(ADMIN_EMAIL, ADMIN_PASSWORD), ("admin2@test.local", "another-long-password")])
    db.scalar(select(AdminUser).where(AdminUser.email == ADMIN_EMAIL)).is_active = False
    db.commit()
    r = anonymous().post(LOGIN, json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 401


@pytest.mark.parametrize("origin", ["", "https://evil.example"])
def test_state_changing_requests_need_an_allowed_origin(admin_client, origin):
    """A missing/empty or foreign Origin is refused even with a valid session cookie."""
    r = admin_client.post(
        "/api/v1/admin/departments", json={"name": "Dental"}, headers={"Origin": origin}
    )
    assert r.status_code == 403
    # Reads are unaffected.
    assert (
        admin_client.get("/api/v1/admin/departments", headers={"Origin": origin}).status_code == 200
    )


def test_idle_session_expires(admin_client, db):
    session = db.scalar(select(AdminSession))
    session.last_seen_at = datetime.now(UTC) - timedelta(hours=9)
    db.commit()
    assert admin_client.get(ME).status_code == 401
    assert db.scalar(select(AdminSession)) is None  # expired row is removed


def test_absolute_session_lifetime_is_enforced(admin_client, db):
    session = db.scalar(select(AdminSession))
    session.expires_at = datetime.now(UTC) - timedelta(minutes=1)
    db.commit()
    assert admin_client.get(ME).status_code == 401
