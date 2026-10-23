"""Public, read-only API (plus the contact form). Everything here goes through
app.services.visibility, so hidden and draft items can never be returned."""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.config import get_settings
from app.db import get_db
from app.models import (
    ContactSubmission,
    Department,
    Doctor,
    DoctorDepartment,
    SlugRedirect,
    Treatment,
    TreatmentDoctor,
)
from app.schemas.contact import ContactIn
from app.schemas.public import (
    DepartmentDetail,
    DepartmentListItem,
    DepartmentRef,
    DoctorCard,
    DoctorDepartmentRef,
    DoctorDetail,
    RedirectTarget,
    SitemapEntries,
    SitemapEntry,
    TreatmentDetail,
    TreatmentItem,
)
from app.security.client import client_ip, hash_ip
from app.services import contact_token, ratelimit
from app.services.embeds import safe_presentation_url
from app.services.visibility import public_departments, public_doctors, public_treatments

router = APIRouter(prefix="/api/v1/public")

MAX_SEARCH_RESULTS = 200


def cacheable(response: Response) -> None:
    """Let the SSR server / CDN reuse a response for a minute, so admin edits appear quickly."""
    response.headers["Cache-Control"] = "public, s-maxage=60, stale-while-revalidate=300"


def _lines(text: str | None) -> list[str]:
    return [line.strip() for line in (text or "").splitlines() if line.strip()]


def _treatment_item(t: Treatment) -> TreatmentItem:
    return TreatmentItem(
        slug=t.slug,
        title=t.title,
        department=DepartmentRef(slug=t.department.slug, name=t.department.name),
    )


def _public_treatment_query():
    """Treatments that pass the visibility rule, with their department loaded."""
    return (
        select(Treatment)
        .join(Department, Treatment.department_id == Department.id)
        .options(selectinload(Treatment.department))
        .where(public_treatments())
    )


# ---------------------------------------------------------------- departments


@router.get(
    "/departments", response_model=list[DepartmentListItem], dependencies=[Depends(cacheable)]
)
def list_departments(db: Session = Depends(get_db)):
    counts = dict(
        db.execute(
            select(Treatment.department_id, func.count(Treatment.id))
            .join(Department, Treatment.department_id == Department.id)
            .where(public_treatments())
            .group_by(Treatment.department_id)
        ).all()
    )
    names: dict[int, list[str]] = {}
    for department_id, doctor_name in db.execute(
        select(DoctorDepartment.department_id, Doctor.name)
        .join(Doctor, Doctor.id == DoctorDepartment.doctor_id)
        .where(public_doctors())
        .order_by(Doctor.sort_order, Doctor.id)
    ):
        names.setdefault(department_id, []).append(doctor_name)

    rows = db.scalars(
        select(Department).where(public_departments()).order_by(Department.sort_order)
    )
    return [
        DepartmentListItem(
            slug=d.slug,
            name=d.name,
            summary=d.summary,
            treatment_count=counts.get(d.id, 0),
            doctor_names=names.get(d.id, []),
        )
        for d in rows
    ]


@router.get(
    "/departments/{slug}", response_model=DepartmentDetail, dependencies=[Depends(cacheable)]
)
def get_department(slug: str, db: Session = Depends(get_db)):
    dept = db.scalar(select(Department).where(Department.slug == slug, public_departments()))
    if dept is None:
        raise HTTPException(404, "Department not found")

    treatments = db.scalars(
        _public_treatment_query()
        .where(Treatment.department_id == dept.id)
        .order_by(Treatment.title)
    ).all()
    doctors = db.scalars(
        select(Doctor)
        .join(DoctorDepartment, DoctorDepartment.doctor_id == Doctor.id)
        .where(DoctorDepartment.department_id == dept.id, public_doctors())
        .order_by(Doctor.sort_order)
    ).all()
    return DepartmentDetail(
        slug=dept.slug,
        name=dept.name,
        summary=dept.summary,
        intro_html=dept.intro_html,
        treatment_count=len(treatments),
        doctor_names=[d.name for d in doctors],
        treatments=[_treatment_item(t) for t in treatments],
        doctors=[DoctorCard.model_validate(d) for d in doctors],
    )


# ------------------------------------------------------------------- doctors


@router.get("/doctors", response_model=list[DoctorCard], dependencies=[Depends(cacheable)])
def list_doctors(db: Session = Depends(get_db)):
    rows = db.scalars(select(Doctor).where(public_doctors()).order_by(Doctor.sort_order))
    return [DoctorCard.model_validate(d) for d in rows]


@router.get("/doctors/{slug}", response_model=DoctorDetail, dependencies=[Depends(cacheable)])
def get_doctor(slug: str, db: Session = Depends(get_db)):
    doctor = db.scalar(
        select(Doctor)
        .options(selectinload(Doctor.department_links).selectinload(DoctorDepartment.department))
        .where(Doctor.slug == slug, public_doctors())
    )
    if doctor is None:
        raise HTTPException(404, "Doctor not found")

    related = db.scalars(
        _public_treatment_query()
        .join(TreatmentDoctor, TreatmentDoctor.treatment_id == Treatment.id)
        .where(TreatmentDoctor.doctor_id == doctor.id)
        .order_by(Treatment.title)
    ).all()
    departments = [
        DoctorDepartmentRef(
            slug=link.department.slug, name=link.department.name, is_primary=link.is_primary
        )
        for link in sorted(doctor.department_links, key=lambda x: not x.is_primary)
        if not link.department.is_hidden
    ]
    return DoctorDetail(
        **DoctorCard.model_validate(doctor).model_dump(),
        qualifications=doctor.qualifications,
        training=_lines(doctor.training),
        achievements=_lines(doctor.achievements),
        expertise=doctor.expertise or [],
        departments=departments,
        treatments=[_treatment_item(t) for t in related],
    )


# ---------------------------------------------------------------- treatments


def _like_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("/treatments", response_model=list[TreatmentItem], dependencies=[Depends(cacheable)])
def list_treatments(
    q: str | None = Query(None, max_length=100),
    department: str | None = Query(None, max_length=120),
    db: Session = Depends(get_db),
):
    """Search public treatments by title, optionally within one department."""
    stmt = _public_treatment_query().order_by(Treatment.title).limit(MAX_SEARCH_RESULTS)
    if q and q.strip():
        stmt = stmt.where(Treatment.title.ilike(f"%{_like_escape(q.strip())}%", escape="\\"))
    if department:
        stmt = stmt.where(Department.slug == department)
    return [_treatment_item(t) for t in db.scalars(stmt)]


@router.get("/treatments/{slug}", response_model=TreatmentDetail, dependencies=[Depends(cacheable)])
def get_treatment(slug: str, db: Session = Depends(get_db)):
    treatment = db.scalar(_public_treatment_query().where(Treatment.slug == slug))
    if treatment is None:
        raise HTTPException(404, "Treatment not found")

    doctors = db.scalars(
        select(Doctor)
        .join(TreatmentDoctor, TreatmentDoctor.doctor_id == Doctor.id)
        .where(TreatmentDoctor.treatment_id == treatment.id, public_doctors())
        .order_by(Doctor.sort_order)
    ).all()
    return TreatmentDetail(
        slug=treatment.slug,
        title=treatment.title,
        department=DepartmentRef(slug=treatment.department.slug, name=treatment.department.name),
        description_html=treatment.description_html or "",
        youtube_video_id=treatment.youtube_video_id,
        # Re-validated on every render; an invalid stored link simply isn't shown.
        presentation_embed_url=safe_presentation_url(treatment.presentation_url),
        updated_at=treatment.updated_at,
        doctors=[DoctorCard.model_validate(d) for d in doctors],
    )


# ------------------------------------------------------------ SEO + redirects


@router.get("/sitemap-entries", response_model=SitemapEntries)
def sitemap_entries(db: Session = Depends(get_db)):
    def entries(rows) -> list[SitemapEntry]:
        return [SitemapEntry(slug=slug, updated_at=updated) for slug, updated in rows]

    return SitemapEntries(
        departments=entries(
            db.execute(select(Department.slug, Department.updated_at).where(public_departments()))
        ),
        doctors=entries(db.execute(select(Doctor.slug, Doctor.updated_at).where(public_doctors()))),
        treatments=entries(
            db.execute(
                select(Treatment.slug, Treatment.updated_at)
                .join(Department, Treatment.department_id == Department.id)
                .where(public_treatments())
            )
        ),
    )


@router.get("/redirects/{entity_type}/{slug}", response_model=RedirectTarget)
def get_redirect(entity_type: str, slug: str, db: Session = Depends(get_db)):
    """Where a renamed page now lives, so the site can answer with a 301."""
    new_slug = db.scalar(
        select(SlugRedirect.new_slug).where(
            SlugRedirect.entity_type == entity_type, SlugRedirect.old_slug == slug
        )
    )
    if new_slug is None:
        raise HTTPException(404, "No redirect")
    return RedirectTarget(new_slug=new_slug)


# ------------------------------------------------------------------- contact


@router.get("/contact/token")
def contact_form_token(response: Response):
    """Signed timestamp the form sends back; proves it was loaded some seconds ago."""
    response.headers["Cache-Control"] = "no-store"
    return {"token": contact_token.make_token()}


@router.post("/contact")
def submit_contact(
    payload: ContactIn, request: Request, response: Response, db: Session = Depends(get_db)
):
    response.headers["Cache-Control"] = "no-store"
    settings = get_settings()
    ip_hash = hash_ip(client_ip(request))

    # 1. Rate limit per client (counts every attempt that gets past validation).
    if not ratelimit.allow(db, f"contact:{ip_hash}", settings.contact_limit_per_hour, 3600):
        raise HTTPException(429, "Too many messages. Please try again later or call us directly.")

    # 2. Token must be genuine and not stale.
    age = contact_token.token_age(payload.token)
    if age is None or age > contact_token.MAX_AGE_SECONDS or age < 0:
        raise HTTPException(400, "This form has expired. Reload the page and try again.")

    # 3. Bots: filled the hidden field, or submitted faster than a person can type.
    #    They get a normal-looking success response and nothing is stored.
    if payload.website.strip() or age < settings.contact_min_fill_seconds:
        return {"ok": True}

    db.add(
        ContactSubmission(
            name=payload.name,
            phone=payload.phone,
            email=str(payload.email) if payload.email else None,
            message=payload.message,
            ip_hash=ip_hash,
            user_agent=(request.headers.get("user-agent") or "")[:300] or None,
        )
    )
    db.commit()
    return {"ok": True}
