"""Application settings. Every secret and URL comes from environment variables."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database (Neon pooled URL in production), e.g. postgresql+psycopg://user:pw@host/db
    database_url: str

    # Public site URL (used for canonical links) and browser origins allowed by CORS.
    site_url: str = "http://localhost:3000"
    allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    # Session cookie. `cookie_domain` e.g. ".example.com" so www. and api. share it.
    cookie_domain: str | None = None
    cookie_secure: bool = True
    session_idle_hours: int = 8
    session_absolute_days: int = 7

    # Secret used to sign the contact-form timestamp and to hash IPs.
    app_secret: str

    # Seed script inputs (exactly two admin accounts).
    admin_1_email: str | None = None
    admin_1_password: str | None = None
    admin_2_email: str | None = None
    admin_2_password: str | None = None

    environment: str = "development"

    # Set true only when the API sits behind a proxy that appends the real client IP to
    # X-Forwarded-For (Render, Fly, nginx...). Otherwise the header is ignorable spoofing.
    trust_proxy_headers: bool = False

    # Contact form guards.
    contact_limit_per_hour: int = 5
    contact_min_fill_seconds: int = 3


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
