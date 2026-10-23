"""Departments management: create, edit, reorder, hide (and delete only when empty)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.errors import FieldError
from app.models import Department, Treatment
from app.schemas.admin import DepartmentIn, DepartmentOut, ReorderIn, VisibilityIn
from app.services.slugs import assign_slug, change_slug

router = APIRouter(prefix="/departments")


def _out(db: Session, dept: Department) -> DepartmentOut:
    count = db.scalar(select(func.count(Treatment.id)).where(Treatment.department_id == dept.id))
    return DepartmentOut.model_validate({**_columns(dept), "treatment_count": count or 0})


def _columns(dept: Department) -> dict:
    return {
        c: getattr(dept, c)
        for c in (
            "id",
            "slug",
            "name",
            "summary",
            "intro_html",
            "sort_order",
            "is_hidden",
            "updated_at",
        )
    }


def _get(db: Session, department_id: int) -> Department:
    dept = db.get(Department, department_id)
    if dept is None:
        raise HTTPException(404, "Department not found.")
    return dept


@router.get("", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    counts = dict(
        db.execute(
            select(Treatment.department_id, func.count(Treatment.id)).group_by(
                Treatment.department_id
            )
        ).all()
    )
    rows = db.scalars(select(Department).order_by(Department.sort_order, Department.id))
    return [
        DepartmentOut.model_validate({**_columns(d), "treatment_count": counts.get(d.id, 0)})
        for d in rows
    ]


@router.post("", response_model=DepartmentOut, status_code=201)
def create_department(body: DepartmentIn, db: Session = Depends(get_db)):
    last = db.scalar(select(func.max(Department.sort_order))) or 0
    dept = Department(
        name=body.name,
        summary=body.summary,
        intro_html=body.intro_html,
        is_hidden=body.is_hidden,
        sort_order=last + 10,
    )
    assign_slug(db, Department, dept, body.slug, body.name)
    db.add(dept)
    db.commit()
    return _out(db, dept)


# Declared before "/{department_id}" so "reorder" is never read as an id.
@router.put("/reorder", response_model=list[DepartmentOut])
def reorder_departments(body: ReorderIn, db: Session = Depends(get_db)):
    """Set the display order. `ids` must list every department exactly once."""
    depts = {d.id: d for d in db.scalars(select(Department))}
    if len(body.ids) != len(set(body.ids)) or set(body.ids) != set(depts):
        raise FieldError("ids", "Send every department exactly once.")
    for position, department_id in enumerate(body.ids, start=1):
        depts[department_id].sort_order = position * 10
    db.commit()
    return list_departments(db)


@router.get("/{department_id}", response_model=DepartmentOut)
def get_department(department_id: int, db: Session = Depends(get_db)):
    return _out(db, _get(db, department_id))


@router.put("/{department_id}", response_model=DepartmentOut)
def update_department(department_id: int, body: DepartmentIn, db: Session = Depends(get_db)):
    dept = _get(db, department_id)
    change_slug(db, Department, "department", dept, body.slug)
    dept.name = body.name
    dept.summary = body.summary
    dept.intro_html = body.intro_html
    dept.is_hidden = body.is_hidden
    db.commit()
    return _out(db, dept)


@router.patch("/{department_id}/visibility", response_model=DepartmentOut)
def set_visibility(department_id: int, body: VisibilityIn, db: Session = Depends(get_db)):
    dept = _get(db, department_id)
    dept.is_hidden = body.is_hidden
    db.commit()
    return _out(db, dept)


@router.delete("/{department_id}", status_code=204)
def delete_department(department_id: int, db: Session = Depends(get_db)):
    dept = _get(db, department_id)
    if db.scalar(select(func.count(Treatment.id)).where(Treatment.department_id == dept.id)):
        raise HTTPException(
            409,
            "This department still has treatments. Move or delete them first, or hide the department instead.",
        )
    db.delete(dept)
    db.commit()
