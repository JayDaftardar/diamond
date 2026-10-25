"""FastAPI application factory: CORS, security headers, routers."""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.errors import FieldError
from app.routers import admin, public


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Diamond Hospital API", docs_url=None, redoc_url=None)

    # CORS is limited to the site's own origins; credentials needed for the admin cookie.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
        allow_headers=["Content-Type"],
    )

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    @app.exception_handler(RequestValidationError)
    async def validation_errors(request: Request, exc: RequestValidationError):
        """Return {"errors": {field: message}} so forms can show each message by its field."""
        errors: dict[str, str] = {}
        for err in exc.errors():
            loc = [part for part in err["loc"] if part != "body"]
            field = str(loc[0]) if loc else "form"
            message = err["msg"].removeprefix("Value error, ")
            errors.setdefault(field, message)
            if len(loc) > 1 and isinstance(loc[1], int):
                # An item in a list, e.g. "youtube_urls.1", so the form can mark that one entry.
                errors.setdefault(f"{field}.{loc[1]}", message)
        return JSONResponse({"detail": "Validation failed", "errors": errors}, status_code=422)

    @app.exception_handler(FieldError)
    async def field_error(request: Request, exc: FieldError):
        return JSONResponse(
            {"detail": "Validation failed", "errors": {exc.field: exc.message}}, status_code=422
        )

    app.include_router(public.router)
    app.include_router(admin.router)

    # HEAD too: uptime monitors (UptimeRobot) probe with HEAD by default.
    @app.api_route("/health", methods=["GET", "HEAD"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
