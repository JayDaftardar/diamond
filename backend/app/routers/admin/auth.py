"""Admin login, logout and 'who am I'. No registration exists; accounts come from the seed script."""

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import AdminUser
from app.schemas.admin import AdminOut, LoginIn
from app.security import sessions
from app.security.client import client_ip, hash_ip
from app.security.deps import require_admin
from app.security.passwords import hash_password, verify_password
from app.services import ratelimit

router = APIRouter(prefix="/auth")

LOGIN_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 15 * 60
GENERIC_FAILURE = "Incorrect email or password."

# Verified when the email is unknown, so response time doesn't reveal which emails exist.
_DUMMY_HASH = hash_password("dummy-password-for-timing")


@router.post("/login", response_model=AdminOut)
def login(payload: LoginIn, request: Request, response: Response, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    ip_key = f"login-ip:{hash_ip(client_ip(request))}"
    email_key = f"login-email:{email}"

    # Both counters are always advanced, so neither can be used to probe the other.
    ip_ok = ratelimit.allow(db, ip_key, LOGIN_ATTEMPTS, LOGIN_WINDOW_SECONDS)
    email_ok = ratelimit.allow(db, email_key, LOGIN_ATTEMPTS, LOGIN_WINDOW_SECONDS)
    if not (ip_ok and email_ok):
        raise HTTPException(429, "Too many sign-in attempts. Try again in 15 minutes.")

    admin = db.scalar(select(AdminUser).where(AdminUser.email == email))
    valid = verify_password(admin.password_hash if admin else _DUMMY_HASH, payload.password)
    if not (admin and admin.is_active and valid):
        raise HTTPException(401, GENERIC_FAILURE)

    ratelimit.reset(db, ip_key)
    ratelimit.reset(db, email_key)
    token = sessions.create_session(db, admin, hash_ip(client_ip(request)))
    sessions.set_cookie(response, token)
    return admin


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    sessions.end_session(db, request.cookies.get(sessions.COOKIE_NAME))
    sessions.clear_cookie(response)


@router.get("/me", response_model=AdminOut)
def me(admin: AdminUser = Depends(require_admin)):
    return admin
