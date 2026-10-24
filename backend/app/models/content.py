"""Public content: departments, doctors, treatments and their links."""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.mixins import TimestampMixin


class Department(TimestampMixin, Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    summary: Mapped[str | None] = mapped_column(String(300))  # meta description + directory line
    intro_html: Mapped[str | None] = mapped_column(Text)  # sanitised on save
    sort_order: Mapped[int] = mapped_column(Integer, default=0, index=True)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)

    treatments: Mapped[list["Treatment"]] = relationship(back_populates="department")
    doctor_links: Mapped[list["DoctorDepartment"]] = relationship(
        back_populates="department", cascade="all, delete-orphan"
    )


class Doctor(TimestampMixin, Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    designation: Mapped[str] = mapped_column(String(200))
    speciality: Mapped[str] = mapped_column(String(200))
    qualifications: Mapped[str | None] = mapped_column(Text)
    training: Mapped[str | None] = mapped_column(Text)
    achievements: Mapped[str | None] = mapped_column(Text)
    expertise: Mapped[list[str]] = mapped_column(JSONB, default=list)
    opd_timings: Mapped[str | None] = mapped_column(String(300))
    # Short hash of the stored photo (None = no photo). It goes into the photo's address, so
    # browsers can cache a photo forever and still fetch a new one the moment it changes.
    photo_version: Mapped[str | None] = mapped_column(String(16))
    sort_order: Mapped[int] = mapped_column(Integer, default=0, index=True)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)

    department_links: Mapped[list["DoctorDepartment"]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan"
    )
    treatment_links: Mapped[list["TreatmentDoctor"]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan"
    )


class DoctorPhoto(Base):
    """A doctor's portrait, stored in the database as a small re-encoded WebP.

    Kept in its own table so the image bytes are only read when the photo itself is
    requested, never when doctors are listed.
    """

    __tablename__ = "doctor_photos"

    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id", ondelete="CASCADE"), primary_key=True
    )
    content_type: Mapped[str] = mapped_column(String(40))
    data: Mapped[bytes] = mapped_column(LargeBinary)
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class DoctorDepartment(Base):
    """A doctor can belong to several departments; exactly one is the primary."""

    __tablename__ = "doctor_departments"

    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id", ondelete="CASCADE"), primary_key=True
    )
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"), primary_key=True
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    doctor: Mapped[Doctor] = relationship(back_populates="department_links")
    department: Mapped[Department] = relationship(back_populates="doctor_links")


class Treatment(TimestampMixin, Base):
    __tablename__ = "treatments"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), index=True)
    # Sanitised on save. Empty/NULL means the treatment is a draft (see services/visibility).
    description_html: Mapped[str | None] = mapped_column(Text)
    # In the order the admin entered them. Only bare 11-character YouTube ids are stored, and
    # presentations as normalised embed links; both are checked again before they are shown.
    youtube_video_ids: Mapped[list[str]] = mapped_column(JSONB, default=list, server_default="[]")
    presentation_urls: Mapped[list[str]] = mapped_column(JSONB, default=list, server_default="[]")
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)

    department: Mapped[Department] = relationship(back_populates="treatments")
    doctor_links: Mapped[list["TreatmentDoctor"]] = relationship(
        back_populates="treatment", cascade="all, delete-orphan"
    )


class TreatmentDoctor(Base):
    __tablename__ = "treatment_doctors"

    treatment_id: Mapped[int] = mapped_column(
        ForeignKey("treatments.id", ondelete="CASCADE"), primary_key=True
    )
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id", ondelete="CASCADE"), primary_key=True
    )

    treatment: Mapped[Treatment] = relationship(back_populates="doctor_links")
    doctor: Mapped[Doctor] = relationship(back_populates="treatment_links")


class SlugRedirect(Base):
    """Old slug -> new slug, so renamed pages keep their links and rankings (301)."""

    __tablename__ = "slug_redirects"
    __table_args__ = (UniqueConstraint("entity_type", "old_slug", name="uq_slug_redirect"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(20))  # department | doctor | treatment
    old_slug: Mapped[str] = mapped_column(String(160))
    new_slug: Mapped[str] = mapped_column(String(160))
