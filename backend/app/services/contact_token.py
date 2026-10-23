"""Signed timestamp for the contact form.

The page fetches a token when it renders. A submission that arrives faster than a human
could fill the form (or with a forged/expired token) is treated as a bot.
"""

import hashlib
import hmac
import time

from app.config import get_settings

MAX_AGE_SECONDS = 2 * 60 * 60  # a form left open longer than this must be reloaded


def _sign(ts: int) -> str:
    key = get_settings().app_secret.encode()
    return hmac.new(key, f"contact:{ts}".encode(), hashlib.sha256).hexdigest()


def make_token(now: float | None = None) -> str:
    ts = int(now if now is not None else time.time())
    return f"{ts}.{_sign(ts)}"


def token_age(token: str, now: float | None = None) -> int | None:
    """Seconds since the token was issued, or None if it is malformed or forged."""
    try:
        ts_text, sig = token.split(".", 1)
        ts = int(ts_text)
    except ValueError:
        return None
    if not hmac.compare_digest(sig, _sign(ts)):
        return None
    return int((now if now is not None else time.time()) - ts)
