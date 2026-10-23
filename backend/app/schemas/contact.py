"""Contact form request validation."""

import re
import unicodedata

from pydantic import BaseModel, EmailStr, field_validator


def _clean(value: str) -> str:
    """Trim and drop control characters (keeps newlines/tabs for the message)."""
    value = unicodedata.normalize("NFC", value).strip()
    return "".join(ch for ch in value if ch in "\n\t" or unicodedata.category(ch)[0] != "C")


class ContactIn(BaseModel):
    name: str
    phone: str
    email: EmailStr | None = None
    message: str
    # Spam guards: `website` is a hidden field humans never fill; `token` is a signed timestamp.
    website: str = ""
    token: str = ""

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        v = " ".join(_clean(v).split())
        if not 2 <= len(v) <= 80:
            raise ValueError("Enter your name (2 to 80 characters).")
        return v

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        """Accept 10-digit Indian mobile numbers, with optional +91 / 91 / 0 prefix."""
        digits = re.sub(r"[\s\-().]", "", v)
        digits = re.sub(r"^(\+91|0091|91|0)", "", digits) if len(digits) > 10 else digits
        if not re.fullmatch(r"[6-9]\d{9}", digits):
            raise ValueError("Enter a 10-digit mobile number, for example 98XXXXXXXX.")
        return digits

    @field_validator("email", mode="before")
    @classmethod
    def _blank_email(cls, v):
        return None if isinstance(v, str) and not v.strip() else v

    @field_validator("message")
    @classmethod
    def _message(cls, v: str) -> str:
        v = _clean(v)
        if not 10 <= len(v) <= 2000:
            raise ValueError("Write a message of 10 to 2000 characters.")
        return v
