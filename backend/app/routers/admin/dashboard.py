"""Dashboard counts for the admin home screen."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import ContactSubmission, Department, Doctor, Treatment
from app.schemas.admin import DashboardOut, TreatmentCounts, VisibilityCounts

router = APIRouter(prefix="/dashboard")


def _count(db: Session, *conditions) -> int:
    return db.scalar(select(func.count()).select_from(Treatment).where(*conditions)) or 0


def _visibility_counts(db: Session, model) -> VisibilityCounts:
    total = db.scalar(select(func.count(model.id))) or 0
    hidden = db.scalar(select(func.count(model.id)).where(model.is_hidden.is_(True))) or 0
    return VisibilityCounts(total=total, public=total - hidden, hidden=hidden)


@router.get("", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db)):
    visible = Treatment.is_hidden.is_(False)
    return DashboardOut(
        unread_submissions=db.scalar(
            select(func.count(ContactSubmission.id)).where(ContactSubmission.is_read.is_(False))
        )
        or 0,
        total_submissions=db.scalar(select(func.count(ContactSubmission.id))) or 0,
        treatments=TreatmentCounts(
            total=_count(db),
            public=_count(db, visible),
            hidden=_count(db, Treatment.is_hidden.is_(True)),
        ),
        doctors=_visibility_counts(db, Doctor),
        departments=_visibility_counts(db, Department),
    )
