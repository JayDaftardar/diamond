"""Admin sessions: random cookie token, only its SHA-256 hash is stored."""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import AdminSession, AdminUser

COOKIE_NAME = "dh_admin_session"
TOUCH_INTERVAL = timedelta(minutes=1)  # don't write last_seen on every single request


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(db: Session, admin: AdminUser, ip_hash: str | None) -> str:
    """Start a session and return the raw token (to be set as the cookie, never stored)."""
    settings = get_settings()
    now = datetime.now(UTC)
    db.execute(delete(AdminSession).where(AdminSession.expires_at < now))  # tidy old rows

    token = secrets.token_urlsafe(32)
    db.add(
        AdminSession(
            token_hash=_hash(token),
            admin_id=admin.id,
            expires_at=now + timedelta(days=settings.session_absolute_days),
            ip_hash=ip_hash,
        )
    )
    admin.last_login_at = now
    db.commit()
    return token


def find_admin(db: Session, token: str | None) -> AdminUser | None:
    """Return the admin for a valid, unexpired session; otherwise None."""
    if not token:
        return None
    settings = get_settings()
    session = db.scalar(select(AdminSession).where(AdminSession.token_hash == _hash(token)))
    if session is None:
        return None

    now = datetime.now(UTC)
    idle_limit = session.last_seen_at + timedelta(hours=settings.session_idle_hours)
    if now >= session.expires_at or now >= idle_limit:
        db.delete(session)
        db.commit()
        return None

    admin = db.get(AdminUser, session.admin_id)
    if admin is None or not admin.is_active:
        return None

    if now - session.last_seen_at > TOUCH_INTERVAL:
        session.last_seen_at = now
        db.commit()
    return admin


def end_session(db: Session, token: str | None) -> None:
    if token:
        db.execute(delete(AdminSession).where(AdminSession.token_hash == _hash(token)))
        db.commit()


def set_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=settings.session_absolute_days * 86400,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
        domain=settings.cookie_domain or None,
        path="/",
    )


def clear_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(COOKIE_NAME, domain=settings.cookie_domain or None, path="/")
