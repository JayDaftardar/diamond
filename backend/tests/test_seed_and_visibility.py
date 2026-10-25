import pytest
from sqlalchemy import func, select

from app.models import AdminUser, Department, Doctor, Treatment
from app.security.passwords import verify_password
from app.services.slugs import slugify
from app.services.visibility import public_departments, public_doctors, public_treatments
from scripts.seed_admins import seed_admins
from scripts.seed_content import seed_content


def _public_treatment_count(db):
    stmt = (
        select(func.count(Treatment.id))
        .join(Department, Treatment.department_id == Department.id)
        .where(public_treatments())
    )
    return db.scalar(stmt)


def test_seed_counts_and_idempotent(db):
    first = seed_content(db)
    assert first == {"departments": 14, "doctors": 5, "treatments": 25 + 36 + 21 + 2 + 2 + 3}
    assert seed_content(db) == {"departments": 0, "doctors": 0, "treatments": 0}


def test_slugs_unique_and_readable(db):
    seed_content(db)
    slugs = db.scalars(select(Treatment.slug)).all()
    assert len(slugs) == len(set(slugs))
    assert "coronary-angiography" in slugs
    assert slugify("Cardiology & CVTS") == "cardiology-and-cvts"


def test_seeded_treatments_are_public_even_without_text(db):
    seed_content(db)
    assert _public_treatment_count(db) == 89


def test_treatment_is_hidden_by_its_own_flag_or_its_department(db):
    seed_content(db)
    t = db.scalar(select(Treatment).where(Treatment.slug == "coronary-angiography"))

    t.description_html = "<p>&nbsp; </p>"  # no real text: still shown
    db.commit()
    assert _public_treatment_count(db) == 89

    t.description_html = "<p>An imaging test of the heart arteries.</p>"
    db.commit()
    assert _public_treatment_count(db) == 89

    t.is_hidden = True
    db.commit()
    assert _public_treatment_count(db) == 88

    t.is_hidden = False
    t.department.is_hidden = True  # hidden department hides all its treatments (3)
    db.commit()
    assert _public_treatment_count(db) == 86


def test_hidden_doctor_and_department_filters(db):
    seed_content(db)
    doctor = db.scalar(select(Doctor).where(Doctor.slug == "dr-vilas-naik"))
    assert {link.department.slug for link in doctor.department_links} == {
        "cardiology",
        "nephrology",
    }
    assert [link.is_primary for link in doctor.department_links].count(True) == 1

    doctor.is_hidden = True
    db.commit()
    assert db.scalar(select(func.count(Doctor.id)).where(public_doctors())) == 4
    assert db.scalar(select(func.count(Department.id)).where(public_departments())) == 14


def test_admin_seed_creates_exactly_two_and_hashes(db):
    seed_admins(db, [("A@x.org", "a-very-long-password"), ("b@x.org", "another-long-password")])
    admins = db.scalars(select(AdminUser)).all()
    assert sorted(a.email for a in admins) == ["a@x.org", "b@x.org"]
    assert all(a.password_hash.startswith("$argon2id$") for a in admins)
    assert verify_password(admins[0].password_hash, "a-very-long-password") or verify_password(
        admins[1].password_hash, "a-very-long-password"
    )
    seed_admins(db, [("a@x.org", "a-very-long-password"), ("b@x.org", "another-long-password")])
    assert db.scalar(select(func.count(AdminUser.id))) == 2


@pytest.mark.parametrize(
    "accounts",
    [
        [("a@x.org", "short"), ("b@x.org", "another-long-password")],
        [("a@x.org", "a-very-long-password"), ("a@x.org", "another-long-password")],
        [("a@x.org", "a-very-long-password"), (None, None)],
    ],
)
def test_admin_seed_rejects_bad_input(db, accounts):
    with pytest.raises(SystemExit):
        seed_admins(db, accounts)


def test_admin_seed_refuses_a_third_account(db):
    seed_admins(db, [("a@x.org", "a-very-long-password"), ("b@x.org", "another-long-password")])
    with pytest.raises(SystemExit):
        seed_admins(db, [("a@x.org", "a-very-long-password"), ("c@x.org", "another-long-password")])
