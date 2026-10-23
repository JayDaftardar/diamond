"""Import every model so Alembic and metadata see them."""

from app.models.content import (
    Department,
    Doctor,
    DoctorDepartment,
    SlugRedirect,
    Treatment,
    TreatmentDoctor,
)
from app.models.system import AdminSession, AdminUser, ContactSubmission, RateLimitHit

__all__ = [
    "AdminSession",
    "AdminUser",
    "ContactSubmission",
    "Department",
    "Doctor",
    "DoctorDepartment",
    "RateLimitHit",
    "SlugRedirect",
    "Treatment",
    "TreatmentDoctor",
]
