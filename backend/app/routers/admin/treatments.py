"""Treatments management: create, edit, hide/show, delete.

A treatment with no real description is a DRAFT and is never shown publicly
(see app.services.visibility).
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.errors import FieldError
from app.models import Department, Doctor, Treatment, TreatmentDoctor
from app.schemas.admin import (
    DepartmentRefOut,
    TreatmentIn,
    TreatmentListItem,
    TreatmentOut,
    TreatmentPage,
    VisibilityIn,
)
from app.services import youtube
from app.services.slugs import assign_slug, change_slug
from app.services.visibility import has_text, treatment_status

router = APIRouter(prefix="/treatments")


def _dept(t: Treatment) -> DepartmentRefOut:
    return DepartmentRefOut(id=t.department.id, slug=t.department.slug, name=t.department.name)


def _out(t: Treatment) -> TreatmentOut:
    return TreatmentOut(
        id=t.id,
        slug=t.slug,
        title=t.title,
        department=_dept(t),
        description_html=t.description_html,
        youtube_urls=[youtube.watch_url(video_id) for video_id in t.youtube_video_ids],
        presentation_urls=list(t.presentation_urls),
        doctor_ids=[link.doctor_id for link in t.doctor_links],
        is_hidden=t.is_hidden,
        status=treatment_status(t),
        updated_at=t.updated_at,
    )


def _get(db: Session, treatment_id: int) -> Treatment:
    t = db.scalar(
        select(Treatment)
        .options(selectinload(Treatment.department), selectinload(Treatment.doctor_links))
        .where(Treatment.id == treatment_id)
    )
    if t is None:
        raise HTTPException(404, "Treatment not found.")
    return t


def _apply(db: Session, t: Treatment, body: TreatmentIn) -> None:
    if db.get(Department, body.department_id) is None:
        raise FieldError("department_id", "Choose a department.")
    doctor_ids = list(dict.fromkeys(body.doctor_ids))
    if doctor_ids and set(db.scalars(select(Doctor.id).where(Doctor.id.in_(doctor_ids)))) != set(
        doctor_ids
    ):
        raise FieldError("doctor_ids", "One of the selected doctors does not exist.")

    t.title = body.title
    t.department_id = body.department_id
    t.description_html = body.description_html  # already sanitised by the schema
    t.is_hidden = body.is_hidden
    # Already checked by the schema: bare YouTube ids and normalised presentation embed links.
    t.youtube_video_ids = body.youtube_urls
    t.presentation_urls = body.presentation_urls

    t.doctor_links.clear()
    db.flush()
    for doctor_id in doctor_ids:
        t.doctor_links.append(TreatmentDoctor(doctor_id=doctor_id))


@router.get("", response_model=TreatmentPage)
def list_treatments(
    q: str | None = Query(None, max_length=100),
    department_id: int | None = None,
    status: str | None = Query(None, pattern="^(public|draft|hidden)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    conditions = []
    if q and q.strip():
        escaped = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        conditions.append(Treatment.title.ilike(f"%{escaped}%", escape="\\"))
    if department_id:
        conditions.append(Treatment.department_id == department_id)
    if status == "hidden":
        conditions.append(Treatment.is_hidden.is_(True))
    elif status == "public":
        conditions += [Treatment.is_hidden.is_(False), has_text()]
    elif status == "draft":
        conditions += [Treatment.is_hidden.is_(False), ~has_text()]

    total = db.scalar(select(func.count(Treatment.id)).where(*conditions)) or 0
    rows = db.scalars(
        select(Treatment)
        .options(selectinload(Treatment.department))
        .where(*conditions)
        .order_by(Treatment.title)
        .limit(page_size)
        .offset((page - 1) * page_size)
    ).all()
    items = [
        TreatmentListItem(
            id=t.id,
            slug=t.slug,
            title=t.title,
            department=_dept(t),
            is_hidden=t.is_hidden,
            status=treatment_status(t),
            updated_at=t.updated_at,
        )
        for t in rows
    ]
    return TreatmentPage(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=TreatmentOut, status_code=201)
def create_treatment(body: TreatmentIn, db: Session = Depends(get_db)):
    t = Treatment(title=body.title, department_id=body.department_id)
    _apply(db, t, body)  # validates first, while `t` is not yet in the session
    assign_slug(db, Treatment, t, body.slug, body.title)
    db.add(t)
    db.commit()
    return _out(_get(db, t.id))


@router.get("/{treatment_id}", response_model=TreatmentOut)
def get_treatment(treatment_id: int, db: Session = Depends(get_db)):
    return _out(_get(db, treatment_id))


@router.put("/{treatment_id}", response_model=TreatmentOut)
def update_treatment(treatment_id: int, body: TreatmentIn, db: Session = Depends(get_db)):
    t = _get(db, treatment_id)
    change_slug(db, Treatment, "treatment", t, body.slug)
    _apply(db, t, body)
    db.commit()
    return _out(_get(db, treatment_id))


@router.patch("/{treatment_id}/visibility", response_model=TreatmentOut)
def set_visibility(treatment_id: int, body: VisibilityIn, db: Session = Depends(get_db)):
    t = _get(db, treatment_id)
    t.is_hidden = body.is_hidden
    db.commit()
    return _out(_get(db, treatment_id))


@router.delete("/{treatment_id}", status_code=204)
def delete_treatment(treatment_id: int, db: Session = Depends(get_db)):
    db.delete(_get(db, treatment_id))
    db.commit()
