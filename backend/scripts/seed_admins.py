"""Create or update one or two admin accounts from environment values (never more than two).

There is no registration endpoint; this script is the only way accounts are created.
Leave ADMIN_2_* empty to seed only the first account now and add the second later.
It refuses to run if that would leave the database with more than two admins.
Usage:  uv run python -m scripts.seed_admins
"""

import sys

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import SessionLocal
from app.models import AdminUser
from app.security.passwords import MIN_PASSWORD_LENGTH, hash_password


def seed_admins(db: Session, accounts: list[tuple[str | None, str | None]]) -> None:
    if not 1 <= len(accounts) <= 2 or any(not email or not pw for email, pw in accounts):
        raise SystemExit(
            "Set ADMIN_1_EMAIL/PASSWORD (and optionally ADMIN_2_EMAIL/PASSWORD) in the environment."
        )

    emails = [email.strip().lower() for email, _ in accounts]  # type: ignore[union-attr]
    if len(set(emails)) != len(emails):
        raise SystemExit("The two admin emails must be different.")
    for _, pw in accounts:
        if len(pw) < MIN_PASSWORD_LENGTH:  # type: ignore[arg-type]
            raise SystemExit(f"Admin passwords must be at least {MIN_PASSWORD_LENGTH} characters.")

    others = db.scalars(select(AdminUser.email).where(AdminUser.email.not_in(emails))).all()
    if len(others) + len(emails) > 2:
        raise SystemExit(f"Unexpected admin accounts exist: {others}. Remove them first.")

    for email, (_, pw) in zip(emails, accounts, strict=True):
        admin = db.scalar(select(AdminUser).where(AdminUser.email == email))
        if admin is None:
            admin = AdminUser(email=email, password_hash=hash_password(pw))  # type: ignore[arg-type]
            db.add(admin)
        else:
            admin.password_hash = hash_password(pw)  # type: ignore[arg-type]
            admin.is_active = True
    db.commit()


if __name__ == "__main__":
    s = get_settings()
    with SessionLocal() as session:
        given = [
            (s.admin_1_email, s.admin_1_password),
            (s.admin_2_email, s.admin_2_password),
        ]
        # A pair with both values empty means "not seeding this one"; a half-filled pair is an error.
        accounts = [pair for pair in given if pair != (None, None) and pair != ("", "")]
        seed_admins(session, accounts)
    print("Admin accounts ready:", *(email for email, _ in accounts))
    sys.exit(0)
