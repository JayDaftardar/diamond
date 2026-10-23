"""Slug generation: lowercase ASCII, hyphen separated, unique per table."""

import re
import unicodedata

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.errors import FieldError
from app.models import SlugRedirect

SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
SLUG_MESSAGE = "Use lowercase letters, numbers and single hyphens only, for example heart-surgery."


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = text.lower().replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-") or "item"


def unique_slug(db: Session, model, base: str, exclude_id: int | None = None) -> str:
    """Return `base`, or `base-2`, `base-3`... until no other row uses it."""
    slug, n = base, 2
    while True:
        stmt = select(model.id).where(model.slug == slug)
        if exclude_id is not None:
            stmt = stmt.where(model.id != exclude_id)
        if db.scalar(stmt) is None:
            return slug
        slug = f"{base}-{n}"
        n += 1


def assign_slug(db: Session, model, obj, requested: str | None, fallback_text: str) -> None:
    """Set a NEW object's slug: the requested one (must be free) or one made from the text."""
    if requested:
        if db.scalar(select(model.id).where(model.slug == requested)):
            raise FieldError("slug", "That web address is already used. Choose another.")
        obj.slug = requested
    else:
        obj.slug = unique_slug(db, model, slugify(fallback_text))


def change_slug(db: Session, model, entity_type: str, obj, new_slug: str | None) -> None:
    """Rename an existing object's slug and keep the old address working via a 301 redirect."""
    if not new_slug or new_slug == obj.slug:
        return
    if db.scalar(select(model.id).where(model.slug == new_slug, model.id != obj.id)):
        raise FieldError("slug", "That web address is already used. Choose another.")

    old = obj.slug
    # If the new slug used to redirect somewhere, it is live again: drop that redirect.
    db.execute(
        delete(SlugRedirect).where(
            SlugRedirect.entity_type == entity_type, SlugRedirect.old_slug == new_slug
        )
    )
    # Anything that pointed at the old slug now points at the new one (no redirect chains).
    db.execute(
        update(SlugRedirect)
        .where(SlugRedirect.entity_type == entity_type, SlugRedirect.new_slug == old)
        .values(new_slug=new_slug)
    )
    existing = db.scalar(
        select(SlugRedirect).where(
            SlugRedirect.entity_type == entity_type, SlugRedirect.old_slug == old
        )
    )
    if existing:
        existing.new_slug = new_slug
    else:
        db.add(SlugRedirect(entity_type=entity_type, old_slug=old, new_slug=new_slug))
    obj.slug = new_slug
