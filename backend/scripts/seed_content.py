"""Seed departments, doctors and draft treatments from seed/hospital_seed.py.

Safe to re-run: existing rows (matched by slug) are left untouched, so admin edits are
never overwritten. Usage:  uv run python -m scripts.seed_content
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import Department, Doctor, DoctorDepartment, Treatment
from app.services.slugs import slugify, unique_slug
from seed.hospital_seed import DEPARTMENTS, DOCTORS, TREATMENTS


def seed_content(db: Session) -> dict[str, int]:
    created = {"departments": 0, "doctors": 0, "treatments": 0}

    # Departments
    by_slug: dict[str, Department] = {}
    for order, (slug, name) in enumerate(DEPARTMENTS, start=1):
        dept = db.scalar(select(Department).where(Department.slug == slug))
        if dept is None:
            dept = Department(slug=slug, name=name, sort_order=order * 10)
            db.add(dept)
            created["departments"] += 1
        by_slug[slug] = dept
    db.flush()

    # Treatments: names only, no description, so they are drafts.
    for dept_slug, titles in TREATMENTS.items():
        dept = by_slug[dept_slug]
        for title in titles:
            exists = db.scalar(
                select(Treatment.id).where(
                    Treatment.title == title, Treatment.department_id == dept.id
                )
            )
            if exists:
                continue
            slug = unique_slug(db, Treatment, slugify(title))
            db.add(Treatment(slug=slug, title=title, department_id=dept.id, description_html=None))
            db.flush()
            created["treatments"] += 1

    # Doctors
    for order, data in enumerate(DOCTORS, start=1):
        if db.scalar(select(Doctor.id).where(Doctor.slug == data["slug"])):
            continue
        fields = {k: v for k, v in data.items() if k != "departments"}
        doctor = Doctor(**fields, sort_order=order * 10)
        for dept_slug, is_primary in data["departments"]:
            doctor.department_links.append(
                DoctorDepartment(department_id=by_slug[dept_slug].id, is_primary=is_primary)
            )
        db.add(doctor)
        created["doctors"] += 1

    db.commit()
    return created


if __name__ == "__main__":
    with SessionLocal() as session:
        print("Created:", seed_content(session))
