"""Load the starting doctor photos (backend/seed/photos) into the database.

Each photo goes through the same checks and re-encoding as an admin upload.
Safe to re-run: doctors who already have a photo are skipped, so a photo an admin has
uploaded or removed is never overwritten. Use --force to replace them anyway.

Usage:  uv run python -m scripts.import_doctor_photos [--force]
"""

import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import Doctor, DoctorPhoto
from app.services import photos
from seed.hospital_seed import DOCTORS

PHOTO_DIR = Path(__file__).resolve().parents[1] / "seed" / "photos"


def import_doctor_photos(db: Session, force: bool = False) -> list[str]:
    """Store the seed photo for each seeded doctor; returns the slugs that were updated."""
    updated = []
    for data in DOCTORS:
        file_name = data.get("photo")
        if not file_name:
            continue
        doctor = db.scalar(select(Doctor).where(Doctor.slug == data["slug"]))
        if doctor is None or (doctor.photo_version and not force):
            continue
        processed = photos.process_photo((PHOTO_DIR / file_name).read_bytes())
        row = db.get(DoctorPhoto, doctor.id) or DoctorPhoto(doctor_id=doctor.id)
        row.content_type = photos.CONTENT_TYPE
        row.data = processed.data
        row.width = processed.width
        row.height = processed.height
        db.add(row)
        doctor.photo_version = processed.version
        updated.append(doctor.slug)
    db.commit()
    return updated


if __name__ == "__main__":
    with SessionLocal() as session:
        done = import_doctor_photos(session, force="--force" in sys.argv)
        print("Photos stored:", ", ".join(done) if done else "none (all already have photos)")
