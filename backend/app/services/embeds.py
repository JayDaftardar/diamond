"""Presentation embed links: allowlisted hosts only, normalised, never trusted as-is.

`validate_presentation_url` is used when an admin saves a link AND again when a public
page is rendered, so a bad value can never reach a visitor's browser.
"""

import re
from urllib.parse import parse_qs, urlsplit, urlunsplit

HELP = (
    "Paste an embed link from Google Slides (File > Share > Publish to web > Embed) "
    "or OneDrive / PowerPoint Online (Share > Embed)."
)

_SLIDES_ID = re.compile(r"^/presentation/d/(?P<id>[A-Za-z0-9_-]{10,})(?:/.*)?$")
_SLIDES_PUBLISHED = re.compile(r"^/presentation/d/e/(?P<id>[A-Za-z0-9_-]{10,})(?:/.*)?$")


def validate_presentation_url(raw: str) -> tuple[str, str]:
    """Return (safe_embed_url, provider) or raise ValueError with an admin-friendly message."""
    url = (raw or "").strip()
    try:
        parts = urlsplit(url)
        port = parts.port
    except ValueError:
        raise ValueError(f"That is not a valid link. {HELP}") from None

    if parts.scheme != "https":
        raise ValueError(f"The link must start with https://. {HELP}")
    if parts.username or parts.password or port not in (None, 443):
        raise ValueError(f"That link is not allowed. {HELP}")

    host = (parts.hostname or "").lower()  # compared exactly, never with "contains"

    if host == "docs.google.com":
        published = _SLIDES_PUBLISHED.match(parts.path)
        if published:
            path = f"/presentation/d/e/{published['id']}/embed"
        else:
            normal = _SLIDES_ID.match(parts.path)
            if not normal:
                raise ValueError(f"That is not a Google Slides link. {HELP}")
            path = f"/presentation/d/{normal['id']}/embed"
        return urlunsplit(("https", host, path, "", "")), "google_slides"

    if host == "onedrive.live.com" and parts.path == "/embed":
        return urlunsplit(("https", host, parts.path, parts.query, "")), "onedrive"

    if host == "view.officeapps.live.com" and parts.path == "/op/embed.aspx":
        src = parse_qs(parts.query).get("src", [""])[0]
        if not src.startswith("https://"):
            raise ValueError(f"That Office embed link is missing its file address. {HELP}")
        return urlunsplit(("https", host, parts.path, parts.query, "")), "office_online"

    if host in {"1drv.ms", "onedrive.live.com", "sharepoint.com"} or host.endswith(
        ".sharepoint.com"
    ):
        raise ValueError(f"That is a sharing link, not an embed link. {HELP}")
    raise ValueError(
        f"Only Google Slides and OneDrive / PowerPoint Online links are allowed. {HELP}"
    )


def safe_presentation_url(stored: str | None) -> str | None:
    """Re-validate a stored value at render time; None if it is missing or no longer valid."""
    if not stored:
        return None
    try:
        return validate_presentation_url(stored)[0]
    except ValueError:
        return None
