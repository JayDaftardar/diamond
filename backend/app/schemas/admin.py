"""Admin API request/response shapes. Validators run the security checks, so a bad
YouTube link, presentation link or slug is reported against the field that caused it."""

import re
from datetime import datetime
from typing import Annotated

from pydantic import (
    BaseModel,
    BeforeValidator,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
)

from app.services import embeds, youtube
from app.services.sanitize import MAX_HTML_LENGTH, clean_html
from app.services.slugs import SLUG_MESSAGE, SLUG_PATTERN

Text = Annotated[str, StringConstraints(strip_whitespace=True)]


def _blank_to_none(value: str | None) -> str | None:
    return value.strip() or None if isinstance(value, str) else None


def _youtube_slot(value) -> str | None:
    """One video slot: blank, or a YouTube link turned into its bare 11-character id."""
    value = _blank_to_none(value)
    if value is not None and len(value) > 300:
        raise ValueError("That link is too long.")
    return youtube.extract_video_id(value) if value is not None else None


def _presentation_slot(value) -> str | None:
    """One presentation slot: blank, or an allowlisted link normalised to its embed form."""
    value = _blank_to_none(value)
    if value is not None and len(value) > 1000:
        raise ValueError("That link is too long.")
    return embeds.validate_presentation_url(value)[0] if value is not None else None


def _filled_and_unique(values: list[str | None]) -> list[str]:
    """Drops empty slots and repeats, keeping the admin's order."""
    return list(dict.fromkeys(v for v in values if v))


MAX_MEDIA = 10  # videos, and separately presentations, per treatment
YoutubeSlot = Annotated[str | None, BeforeValidator(_youtube_slot)]
PresentationSlot = Annotated[str | None, BeforeValidator(_presentation_slot)]


class _Out(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class _SlugMixin(BaseModel):
    slug: str | None = Field(None, max_length=120)

    @field_validator("slug", mode="before")
    @classmethod
    def _slug(cls, v):
        v = _blank_to_none(v)
        if v is not None and not re.fullmatch(SLUG_PATTERN, v):
            raise ValueError(SLUG_MESSAGE)
        return v


# ------------------------------------------------------------------ auth


class LoginIn(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=200)


class AdminOut(_Out):
    id: int
    email: str


# ------------------------------------------------------------- dashboard


class TreatmentCounts(BaseModel):
    total: int
    public: int
    hidden: int


class VisibilityCounts(BaseModel):
    total: int
    public: int
    hidden: int


class DashboardOut(BaseModel):
    unread_submissions: int
    total_submissions: int
    treatments: TreatmentCounts
    doctors: VisibilityCounts
    departments: VisibilityCounts


# ----------------------------------------------------------- submissions


class SubmissionOut(_Out):
    id: int
    name: str
    phone: str
    email: str | None
    message: str
    is_read: bool
    created_at: datetime


class SubmissionPage(BaseModel):
    items: list[SubmissionOut]
    total: int
    unread_total: int
    page: int
    page_size: int


class SubmissionPatch(BaseModel):
    is_read: bool


# ----------------------------------------------------------- departments


class DepartmentIn(_SlugMixin):
    name: Text = Field(min_length=2, max_length=160)
    summary: str | None = Field(None, max_length=300)
    intro_html: str | None = Field(None, max_length=MAX_HTML_LENGTH)
    is_hidden: bool = False

    @field_validator("summary", mode="before")
    @classmethod
    def _summary(cls, v):
        return _blank_to_none(v)

    @field_validator("intro_html")
    @classmethod
    def _intro(cls, v):
        return clean_html(v)


class DepartmentOut(_Out):
    id: int
    slug: str
    name: str
    summary: str | None
    intro_html: str | None
    sort_order: int
    is_hidden: bool
    treatment_count: int
    updated_at: datetime


class ReorderIn(BaseModel):
    ids: list[int]


class VisibilityIn(BaseModel):
    is_hidden: bool


# --------------------------------------------------------------- doctors


class DoctorIn(_SlugMixin):
    name: Text = Field(min_length=2, max_length=160)
    designation: Text = Field(min_length=2, max_length=200)
    speciality: Text = Field(min_length=2, max_length=200)
    qualifications: str | None = Field(None, max_length=1000)
    training: str | None = Field(None, max_length=2000)  # one item per line
    achievements: str | None = Field(None, max_length=2000)  # one item per line
    expertise: list[
        Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    ] = Field(default_factory=list, max_length=30)
    opd_timings: str | None = Field(None, max_length=300)
    department_ids: list[int] = Field(min_length=1, max_length=14)
    primary_department_id: int | None = None
    sort_order: int | None = None
    is_hidden: bool = False

    @field_validator("qualifications", "training", "achievements", "opd_timings", mode="before")
    @classmethod
    def _optional_text(cls, v):
        return _blank_to_none(v)


class DoctorOut(_Out):
    id: int
    slug: str
    name: str
    designation: str
    speciality: str
    qualifications: str | None
    training: str | None
    achievements: str | None
    expertise: list[str]
    opd_timings: str | None
    photo_url: str | None  # relative to the API; None until a photo is uploaded
    department_ids: list[int]
    primary_department_id: int | None
    sort_order: int
    is_hidden: bool
    updated_at: datetime


# ------------------------------------------------------------ treatments


class TreatmentIn(_SlugMixin):
    title: Text = Field(min_length=2, max_length=200)
    department_id: int
    description_html: str | None = Field(None, max_length=MAX_HTML_LENGTH)
    # One entry per slot in the form; empty slots are allowed and dropped. An error in a slot
    # is reported as e.g. "youtube_urls.1", so the form can show it next to that slot.
    youtube_urls: list[YoutubeSlot] = Field(default_factory=list, max_length=MAX_MEDIA)
    presentation_urls: list[PresentationSlot] = Field(default_factory=list, max_length=MAX_MEDIA)
    doctor_ids: list[int] = Field(default_factory=list, max_length=20)
    is_hidden: bool = False

    @field_validator("description_html")
    @classmethod
    def _description(cls, v):
        return clean_html(v)  # None when only empty markup is left (a treatment without text)

    @field_validator("youtube_urls", "presentation_urls")
    @classmethod
    def _media(cls, v):
        return _filled_and_unique(v)


class DepartmentRefOut(_Out):
    id: int
    slug: str
    name: str


class TreatmentOut(BaseModel):
    id: int
    slug: str
    title: str
    department: DepartmentRefOut
    description_html: str | None
    youtube_urls: list[str]  # watch links, rebuilt from the stored ids
    presentation_urls: list[str]  # normalised embed links
    doctor_ids: list[int]
    is_hidden: bool
    status: str  # public | hidden
    updated_at: datetime


class TreatmentListItem(BaseModel):
    id: int
    slug: str
    title: str
    department: DepartmentRefOut
    is_hidden: bool
    status: str
    updated_at: datetime


class TreatmentPage(BaseModel):
    items: list[TreatmentListItem]
    total: int
    page: int
    page_size: int
