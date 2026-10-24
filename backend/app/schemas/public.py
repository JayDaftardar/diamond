"""Response shapes for the public (read-only) API."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.services.photos import photo_path


class _Out(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class DepartmentRef(_Out):
    slug: str
    name: str


class DoctorDepartmentRef(DepartmentRef):
    is_primary: bool


class DoctorCard(_Out):
    slug: str
    name: str
    designation: str
    speciality: str
    opd_timings: str | None
    # Read from the doctor row but not sent; visitors get `photo_url` instead.
    photo_version: str | None = Field(default=None, exclude=True)

    @computed_field
    @property
    def photo_url(self) -> str | None:
        """Address of the photo, relative to the API (None = show the silhouette)."""
        return photo_path(self.slug, self.photo_version)


class TreatmentItem(BaseModel):
    slug: str
    title: str
    department: DepartmentRef


class DepartmentListItem(_Out):
    slug: str
    name: str
    summary: str | None
    treatment_count: int
    doctor_names: list[str]  # public doctors in this department, in display order


class DepartmentDetail(DepartmentListItem):
    intro_html: str | None
    treatments: list[TreatmentItem]
    doctors: list[DoctorCard]


class DoctorDetail(DoctorCard):
    qualifications: str | None
    training: list[str]
    achievements: list[str]
    expertise: list[str]
    departments: list[DoctorDepartmentRef]
    treatments: list[TreatmentItem]


class TreatmentDetail(BaseModel):
    slug: str
    title: str
    department: DepartmentRef
    description_html: str
    youtube_video_ids: list[str]
    presentation_embed_urls: list[str]
    updated_at: datetime
    doctors: list[DoctorCard]


class SitemapEntry(BaseModel):
    slug: str
    updated_at: datetime


class SitemapEntries(BaseModel):
    departments: list[SitemapEntry]
    doctors: list[SitemapEntry]
    treatments: list[SitemapEntry]


class RedirectTarget(BaseModel):
    new_slug: str
