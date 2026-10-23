"""Contact submissions: list (newest first), open, mark read/unread, delete, filter, search."""

from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import ContactSubmission
from app.schemas.admin import SubmissionOut, SubmissionPage, SubmissionPatch

router = APIRouter(prefix="/submissions")

HOSPITAL_TZ = ZoneInfo("Asia/Kolkata")  # date filters mean calendar days in Kolhapur


def _like(text: str) -> str:
    return "%" + text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"


@router.get("", response_model=SubmissionPage)
def list_submissions(
    read: bool | None = Query(None, description="true = read only, false = unread only"),
    date_from: date | None = None,
    date_to: date | None = None,
    q: str | None = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    conditions = []
    if read is not None:
        conditions.append(ContactSubmission.is_read.is_(read))
    if date_from:
        start = datetime.combine(date_from, time.min, tzinfo=HOSPITAL_TZ)
        conditions.append(ContactSubmission.created_at >= start)
    if date_to:
        end = datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=HOSPITAL_TZ)
        conditions.append(ContactSubmission.created_at < end)
    if q and q.strip():
        pattern = _like(q.strip())
        conditions.append(
            or_(
                *(
                    column.ilike(pattern, escape="\\")
                    for column in (
                        ContactSubmission.name,
                        ContactSubmission.phone,
                        ContactSubmission.email,
                        ContactSubmission.message,
                    )
                )
            )
        )

    total = db.scalar(select(func.count(ContactSubmission.id)).where(*conditions)) or 0
    items = db.scalars(
        select(ContactSubmission)
        .where(*conditions)
        .order_by(ContactSubmission.created_at.desc(), ContactSubmission.id.desc())
        .limit(page_size)
        .offset((page - 1) * page_size)
    ).all()
    unread_total = (
        db.scalar(
            select(func.count(ContactSubmission.id)).where(ContactSubmission.is_read.is_(False))
        )
        or 0
    )
    return SubmissionPage(
        items=[SubmissionOut.model_validate(i) for i in items],
        total=total,
        unread_total=unread_total,
        page=page,
        page_size=page_size,
    )


def _get(db: Session, submission_id: int) -> ContactSubmission:
    row = db.get(ContactSubmission, submission_id)
    if row is None:
        raise HTTPException(404, "Message not found.")
    return row


@router.get("/{submission_id}", response_model=SubmissionOut)
def get_submission(submission_id: int, db: Session = Depends(get_db)):
    return _get(db, submission_id)


@router.patch("/{submission_id}", response_model=SubmissionOut)
def set_read(submission_id: int, body: SubmissionPatch, db: Session = Depends(get_db)):
    row = _get(db, submission_id)
    row.is_read = body.is_read
    db.commit()
    return row


@router.delete("/{submission_id}", status_code=204)
def delete_submission(submission_id: int, db: Session = Depends(get_db)):
    db.delete(_get(db, submission_id))
    db.commit()
