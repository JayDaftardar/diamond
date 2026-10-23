"""Client IP lookup and privacy-preserving IP hashing."""

import hashlib
import hmac

from fastapi import Request

from app.config import get_settings


def client_ip(request: Request) -> str:
    """Real client IP. X-Forwarded-For is trusted only when explicitly enabled in settings."""
    if get_settings().trust_proxy_headers:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            # The LAST entry is the one our own proxy appended; earlier ones can be forged.
            return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def hash_ip(ip: str) -> str:
    """Keyed hash so stored values can't be reversed to an address."""
    key = get_settings().app_secret.encode()
    return hmac.new(key, ip.encode(), hashlib.sha256).hexdigest()
