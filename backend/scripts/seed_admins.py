"""Create or update EXACTLY two admin accounts from environment values.

There is no registration endpoint; this script is the only way accounts are created.
It refuses to run if the database already holds any admin outside the two configured emails.
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
    if len(accounts) != 2 or any(not email or not pw for email, pw in accounts):
        raise SystemExit(
            "Set ADMIN_1_EMAIL/PASSWORD and ADMIN_2_EMAIL/PASSWORD in the environment."
        )

    emails = [email.strip().lower() for email, _ in accounts]  # type: ignore[union-attr]
    if emails[0] == emails[1]:
        raise SystemExit("The two admin emails must be different.")
    for _, pw in accounts:
        if len(pw) < MIN_PASSWORD_LENGTH:  # type: ignore[arg-type]
            raise SystemExit(f"Admin passwords must be at least {MIN_PASSWORD_LENGTH} characters.")

    others = db.scalars(select(AdminUser.email).where(AdminUser.email.not_in(emails))).all()
    if others:
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
        seed_admins(
            session, [(s.admin_1_email, s.admin_1_password), (s.admin_2_email, s.admin_2_password)]
        )
    print("Admin accounts ready:", s.admin_1_email, s.admin_2_email)
    sys.exit(0)
