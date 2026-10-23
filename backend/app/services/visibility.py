"""The ONE definition of what is public. Pages, API and sitemap must all use these.

- Department: not hidden.
- Doctor: not hidden.
- Treatment: not hidden, has real description text (otherwise it is a draft),
  and its department is public.
"""

import re

from sqlalchemy import and_, func

from app.models import Department, Doctor, Treatment

_TAGS = re.compile(r"<[^>]*>")


def has_content(html: str | None) -> bool:
    """True if the HTML contains visible text once tags and spaces are removed."""
    return bool(html and _TAGS.sub("", html).replace("&nbsp;", " ").strip())


def public_departments():
    return Department.is_hidden.is_(False)


def public_doctors():
    return Doctor.is_hidden.is_(False)


def has_text():
    """SQL condition: the description holds visible text once tags and spaces are removed."""
    stripped = func.trim(
        func.replace(
            func.regexp_replace(func.coalesce(Treatment.description_html, ""), "<[^>]*>", "", "g"),
            "&nbsp;",
            " ",
        )
    )
    return stripped != ""


def public_treatments():
    """SQL filter for treatments; the query must also join Department."""
    return and_(Treatment.is_hidden.is_(False), has_text(), Department.is_hidden.is_(False))


def treatment_status(t: Treatment) -> str:
    """Admin-facing label: hidden | draft | public."""
    if t.is_hidden:
        return "hidden"
    return "public" if has_content(t.description_html) else "draft"
