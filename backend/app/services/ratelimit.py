"""Database-backed rate limiting (works across several API instances)."""

from datetime import timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models import RateLimitHit


def allow(db: Session, key: str, limit: int, window_seconds: int) -> bool:
    """Record a hit and return True if `key` is still within `limit` per window.

    A denied attempt is not recorded, so a blocked client regains access exactly one
    window after its oldest counted hit.
    """
    window = timedelta(seconds=window_seconds)
    cutoff = func.now() - window

    db.execute(
        delete(RateLimitHit).where(RateLimitHit.key == key, RateLimitHit.created_at < cutoff)
    )
    used = db.scalar(
        select(func.count(RateLimitHit.id)).where(
            RateLimitHit.key == key, RateLimitHit.created_at >= cutoff
        )
    )
    if used >= limit:
        db.commit()
        return False
    db.add(RateLimitHit(key=key))
    db.commit()
    return True


def reset(db: Session, key: str) -> None:
    """Forget all hits for a key (e.g. after a successful login)."""
    db.execute(delete(RateLimitHit).where(RateLimitHit.key == key))
    db.commit()
