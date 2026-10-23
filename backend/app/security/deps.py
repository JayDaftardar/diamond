"""FastAPI dependencies that protect every admin route on the server."""

from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import AdminUser
from app.security import sessions

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def require_same_origin(request: Request) -> None:
    """CSRF defence in depth (cookie is also SameSite=Strict): any state-changing request
    must come from one of our own origins."""
    if request.method in SAFE_METHODS:
        return
    origin = request.headers.get("origin")
    if origin not in get_settings().allowed_origins:
        raise HTTPException(403, "Request origin not allowed.")


def require_admin(request: Request, db: Session = Depends(get_db)) -> AdminUser:
    admin = sessions.find_admin(db, request.cookies.get(sessions.COOKIE_NAME))
    if admin is None:
        raise HTTPException(401, "Please sign in.")
    return admin


def no_store(response: Response) -> None:
    """Admin responses contain private data and must never be cached."""
    response.headers["Cache-Control"] = "no-store"
