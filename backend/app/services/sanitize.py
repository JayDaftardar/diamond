"""Sanitise admin-entered formatted text. Only the tags the editor can produce survive."""

import nh3

from app.services.visibility import has_content

ALLOWED_TAGS = {"p", "br", "strong", "em", "u", "h2", "h3", "ul", "ol", "li", "blockquote", "a"}
ALLOWED_ATTRIBUTES = {"a": {"href"}}
ALLOWED_SCHEMES = {"https", "mailto", "tel"}

MAX_HTML_LENGTH = 50_000


def clean_html(html: str | None) -> str | None:
    """Return safe HTML, or None when nothing visible is left (so an empty editor saves as no text)."""
    if not html or not html.strip():
        return None
    cleaned = nh3.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes=ALLOWED_SCHEMES,
        link_rel="noopener noreferrer nofollow",
        strip_comments=True,
    ).strip()

    return cleaned if has_content(cleaned) else None
