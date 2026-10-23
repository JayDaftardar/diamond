"""YouTube links: validate and keep ONLY the 11-character video id (never the URL)."""

import re
from urllib.parse import parse_qs, urlsplit

_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")
_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",
}
_PATH_PREFIXES = ("/embed/", "/shorts/", "/live/", "/v/")

HELP = "Paste a YouTube video link, for example https://www.youtube.com/watch?v=XXXXXXXXXXX."


def extract_video_id(raw: str) -> str:
    """Return the video id from any common YouTube link, or raise ValueError."""
    try:
        parts = urlsplit((raw or "").strip())
    except ValueError:
        raise ValueError(f"That is not a valid link. {HELP}") from None

    if parts.scheme not in ("http", "https") or not parts.hostname:
        raise ValueError(f"That is not a valid link. {HELP}")

    host = parts.hostname.lower()
    candidate = ""
    if host == "youtu.be":
        candidate = parts.path.lstrip("/").split("/")[0]
    elif host in _HOSTS:
        if parts.path == "/watch":
            candidate = parse_qs(parts.query).get("v", [""])[0]
        else:
            for prefix in _PATH_PREFIXES:
                if parts.path.startswith(prefix):
                    candidate = parts.path[len(prefix) :].split("/")[0]
                    break
    else:
        raise ValueError(f"Only YouTube links are allowed. {HELP}")

    if not _ID.match(candidate):
        raise ValueError(f"No video found in that link. {HELP}")
    return candidate


def watch_url(video_id: str) -> str:
    """Canonical link shown back to the admin when editing."""
    return f"https://www.youtube.com/watch?v={video_id}"
