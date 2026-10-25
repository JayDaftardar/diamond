"""The ONE definition of what is public. Pages, API and sitemap must all use these.

- Department: not hidden.
- Doctor: not hidden.
- Treatment: not hidden, and its department is public. A treatment is shown whether or
  not it has a description yet; the page says details are being added. (Search engines are
  only pointed at the ones that have text: see `has_text` and the sitemap.)
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
    """SQL condition: the description holds visible text once tags and spaces are removed.

    Not part of what is public. Used for the sitemap only, so pages with no content yet are
    not promoted to search engines.
    """
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
    return and_(Treatment.is_hidden.is_(False), Department.is_hidden.is_(False))


def treatment_status(t: Treatment) -> str:
    """Admin-facing label: hidden | public."""
    return "hidden" if t.is_hidden else "public"
