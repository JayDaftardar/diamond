"""Doctors management: create, edit, hide, delete. Photos are fixed files in the frontend's
static folder; a doctor only references a file name (no upload anywhere)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.errors import FieldError
from app.models import Department, Doctor, DoctorDepartment
from app.schemas.admin import DoctorIn, DoctorOut, VisibilityIn
from app.services.slugs import assign_slug, change_slug

router = APIRouter(prefix="/doctors")


def _out(doctor: Doctor) -> DoctorOut:
    links = doctor.department_links
    primary = next((link.department_id for link in links if link.is_primary), None)
    return DoctorOut.model_validate(
        {
            **{
                c: getattr(doctor, c)
                for c in (
                    "id",
                    "slug",
                    "name",
                    "designation",
                    "speciality",
                    "qualifications",
                    "training",
                    "achievements",
                    "opd_timings",
                    "photo_filename",
                    "sort_order",
                    "is_hidden",
                    "updated_at",
                )
            },
            "expertise": doctor.expertise or [],
            "department_ids": [link.department_id for link in links],
            "primary_department_id": primary,
        }
    )


def _get(db: Session, doctor_id: int) -> Doctor:
    doctor = db.scalar(
        select(Doctor).options(selectinload(Doctor.department_links)).where(Doctor.id == doctor_id)
    )
    if doctor is None:
        raise HTTPException(404, "Doctor not found.")
    return doctor


def _apply(db: Session, doctor: Doctor, body: DoctorIn) -> None:
    """Copy the form onto the doctor and rebuild their department links."""
    ids = list(dict.fromkeys(body.department_ids))  # de-duplicate, keep order
    found = set(db.scalars(select(Department.id).where(Department.id.in_(ids))))
    if found != set(ids):
        raise FieldError("department_ids", "One of the selected departments does not exist.")
    primary = body.primary_department_id if body.primary_department_id is not None else ids[0]
    if primary not in ids:
        raise FieldError(
            "primary_department_id", "The main department must be one of the selected departments."
        )

    doctor.name = body.name
    doctor.designation = body.designation
    doctor.speciality = body.speciality
    doctor.qualifications = body.qualifications
    doctor.training = body.training
    doctor.achievements = body.achievements
    doctor.expertise = body.expertise
    doctor.opd_timings = body.opd_timings
    doctor.photo_filename = body.photo_filename
    doctor.is_hidden = body.is_hidden
    if body.sort_order is not None:
        doctor.sort_order = body.sort_order

    doctor.department_links.clear()
    db.flush()  # remove old links before inserting the new ones (same primary key)
    for department_id in ids:
        doctor.department_links.append(
            DoctorDepartment(department_id=department_id, is_primary=department_id == primary)
        )


@router.get("", response_model=list[DoctorOut])
def list_doctors(db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Doctor)
        .options(selectinload(Doctor.department_links))
        .order_by(Doctor.sort_order, Doctor.id)
    )
    return [_out(d) for d in rows]


@router.post("", response_model=DoctorOut, status_code=201)
def create_doctor(body: DoctorIn, db: Session = Depends(get_db)):
    doctor = Doctor(
        name=body.name,
        designation=body.designation,
        speciality=body.speciality,
        sort_order=(db.scalar(select(func.max(Doctor.sort_order))) or 0) + 10,
    )
    _apply(db, doctor, body)  # validates first, while `doctor` is not yet in the session
    assign_slug(db, Doctor, doctor, body.slug, body.name)
    db.add(doctor)
    db.commit()
    return _out(_get(db, doctor.id))


@router.get("/{doctor_id}", response_model=DoctorOut)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    return _out(_get(db, doctor_id))


@router.put("/{doctor_id}", response_model=DoctorOut)
def update_doctor(doctor_id: int, body: DoctorIn, db: Session = Depends(get_db)):
    doctor = _get(db, doctor_id)
    change_slug(db, Doctor, "doctor", doctor, body.slug)
    _apply(db, doctor, body)
    db.commit()
    return _out(_get(db, doctor_id))


@router.patch("/{doctor_id}/visibility", response_model=DoctorOut)
def set_visibility(doctor_id: int, body: VisibilityIn, db: Session = Depends(get_db)):
    doctor = _get(db, doctor_id)
    doctor.is_hidden = body.is_hidden
    db.commit()
    return _out(doctor)


@router.delete("/{doctor_id}", status_code=204)
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    db.delete(_get(db, doctor_id))
    db.commit()
