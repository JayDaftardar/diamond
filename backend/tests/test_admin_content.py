from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.main import app
from app.models import ContactSubmission, Department, Doctor, Treatment
from scripts.seed_content import seed_content

IST = ZoneInfo("Asia/Kolkata")
A = "/api/v1/admin"
PUBLIC = TestClient(app)


def dept_id(db, slug):
    return db.scalar(select(Department.id).where(Department.slug == slug))


def treatment_payload(db, **over):
    data = {
        "title": "Coronary Angiography",
        "department_id": dept_id(db, "cardiology"),
        "description_html": "<p>An imaging test of the heart arteries.</p>",
    }
    data.update(over)
    return data


# ------------------------------------------------------------- treatments


def test_create_treatment_sanitises_and_stores_only_the_video_id(admin_client, db):
    seed_content(db)
    r = admin_client.post(
        f"{A}/treatments",
        json=treatment_payload(
            db,
            title="Angioplasty",
            description_html=(
                '<p onclick="x()">Safe <strong>text</strong></p><script>alert(1)</script>'
                '<a href="javascript:alert(1)">bad</a><a href="https://example.org/a">ok</a>'
                '<img src="x" onerror="alert(1)"><iframe src="https://evil.example"></iframe>'
            ),
            youtube_url="https://youtu.be/dQw4w9WgXcQ?t=42",
            presentation_url="https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOp/edit",
        ),
    )
    assert r.status_code == 201, r.text
    body = r.json()
    html = body["description_html"]
    for forbidden in ("script", "onclick", "javascript:", "<img", "iframe", "onerror"):
        assert forbidden not in html
    assert "<strong>text</strong>" in html and 'href="https://example.org/a"' in html
    assert 'rel="noopener noreferrer nofollow"' in html

    assert body["slug"] == "angioplasty" and body["status"] == "public"
    assert body["youtube_video_id"] == "dQw4w9WgXcQ"
    assert body["youtube_url"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert (
        body["presentation_url"] == "https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOp/embed"
    )
    assert body["presentation_provider"] == "google_slides"

    # Stored value is the bare id, and the public page can show it.
    assert (
        db.scalar(select(Treatment.youtube_video_id).where(Treatment.slug == "angioplasty"))
        == "dQw4w9WgXcQ"
    )
    public = PUBLIC.get("/api/v1/public/treatments/angioplasty").json()
    assert public["youtube_video_id"] == "dQw4w9WgXcQ"


def test_treatment_without_description_is_a_draft_and_not_public(admin_client, db):
    seed_content(db)
    r = admin_client.post(
        f"{A}/treatments", json=treatment_payload(db, description_html="<p> </p>")
    )
    assert r.status_code == 201
    assert r.json()["description_html"] is None and r.json()["status"] == "draft"
    assert PUBLIC.get(f"/api/v1/public/treatments/{r.json()['slug']}").status_code == 404


def test_bad_links_are_rejected_with_field_errors(admin_client, db):
    seed_content(db)
    cases = {
        "youtube_url": "https://vimeo.com/123456",
        "presentation_url": "https://evil.example/slides",
        "slug": "Not A Slug!",
    }
    for field, value in cases.items():
        r = admin_client.post(f"{A}/treatments", json=treatment_payload(db, **{field: value}))
        assert r.status_code == 422 and field in r.json()["errors"], (field, r.text)
    # Nothing was created: only the seeded "Coronary Angiography" exists.
    assert (
        db.scalar(select(func.count(Treatment.id)).where(Treatment.title == "Coronary Angiography"))
        == 1
    )


def test_unknown_department_or_doctor_is_rejected(admin_client, db):
    seed_content(db)
    r = admin_client.post(f"{A}/treatments", json=treatment_payload(db, department_id=99999))
    assert r.status_code == 422 and "department_id" in r.json()["errors"]
    r = admin_client.post(f"{A}/treatments", json=treatment_payload(db, doctor_ids=[99999]))
    assert r.status_code == 422 and "doctor_ids" in r.json()["errors"]


def test_edit_hide_filter_and_delete_treatment(admin_client, db):
    seed_content(db)
    tid = db.scalar(select(Treatment.id).where(Treatment.slug == "coronary-angiography"))
    naik = db.scalar(select(Doctor.id).where(Doctor.slug == "dr-vilas-naik"))

    # Seeded treatments start as drafts.
    drafts = admin_client.get(f"{A}/treatments", params={"status": "draft"}).json()
    assert drafts["total"] == 89

    r = admin_client.put(
        f"{A}/treatments/{tid}",
        json=treatment_payload(db, doctor_ids=[naik], youtube_url="", presentation_url=""),
    )
    assert (
        r.status_code == 200 and r.json()["status"] == "public" and r.json()["doctor_ids"] == [naik]
    )
    assert PUBLIC.get("/api/v1/public/treatments/coronary-angiography").status_code == 200

    r = admin_client.patch(f"{A}/treatments/{tid}/visibility", json={"is_hidden": True})
    assert r.json()["status"] == "hidden"
    assert PUBLIC.get("/api/v1/public/treatments/coronary-angiography").status_code == 404
    assert admin_client.get(f"{A}/treatments", params={"status": "hidden"}).json()["total"] == 1

    assert admin_client.delete(f"{A}/treatments/{tid}").status_code == 204
    assert admin_client.get(f"{A}/treatments/{tid}").status_code == 404


def test_search_and_department_filter(admin_client, db):
    seed_content(db)
    found = admin_client.get(f"{A}/treatments", params={"q": "cataract"}).json()
    assert {i["title"] for i in found["items"]} == {"Cataract Surgery", "Laser Cataract Surgery"}
    ent = admin_client.get(f"{A}/treatments", params={"department_id": dept_id(db, "ent")}).json()
    assert ent["total"] == 25


def test_renaming_a_slug_leaves_a_working_redirect_without_chains(admin_client, db):
    seed_content(db)
    tid = db.scalar(select(Treatment.id).where(Treatment.slug == "coronary-angiography"))
    for new in ("angiography-of-the-heart", "heart-angiography"):
        r = admin_client.put(f"{A}/treatments/{tid}", json=treatment_payload(db, slug=new))
        assert r.status_code == 200 and r.json()["slug"] == new
    lookup = PUBLIC.get
    # The very first address now points straight at the final one.
    assert lookup("/api/v1/public/redirects/treatment/coronary-angiography").json() == {
        "new_slug": "heart-angiography"
    }
    assert lookup("/api/v1/public/redirects/treatment/angiography-of-the-heart").json() == {
        "new_slug": "heart-angiography"
    }

    # Taking an address that is already in use is refused.
    other = admin_client.post(
        f"{A}/treatments", json=treatment_payload(db, title="Other", slug="other-one")
    )
    r = admin_client.put(
        f"{A}/treatments/{other.json()['id']}",
        json=treatment_payload(db, title="Other", slug="heart-angiography"),
    )
    assert r.status_code == 422 and "slug" in r.json()["errors"]


# ---------------------------------------------------------------- doctors


def doctor_payload(db, **over):
    data = {
        "name": "Dr. Test Person",
        "designation": "Consultant",
        "speciality": "Urology",
        "department_ids": [dept_id(db, "urology"), dept_id(db, "nephrology")],
        "expertise": ["Kidney Stones", " "],
    }
    data.update(over)
    return data


def test_doctor_lifecycle_with_two_departments(admin_client, db):
    seed_content(db)
    urology, nephrology = dept_id(db, "urology"), dept_id(db, "nephrology")
    r = admin_client.post(
        f"{A}/doctors",
        json=doctor_payload(db, primary_department_id=nephrology, photo_filename="dr-test.jpg"),
    )
    # A blank expertise entry is invalid; fix and retry.
    assert r.status_code == 422 and "expertise" in r.json()["errors"]
    r = admin_client.post(
        f"{A}/doctors",
        json=doctor_payload(
            db,
            expertise=["Kidney Stones"],
            primary_department_id=nephrology,
            photo_filename="dr-test.jpg",
        ),
    )
    assert r.status_code == 201, r.text
    doc = r.json()
    assert doc["slug"] == "dr-test-person" and doc["primary_department_id"] == nephrology
    assert sorted(doc["department_ids"]) == sorted([urology, nephrology])

    # Edit: one department only, new main department.
    r = admin_client.put(
        f"{A}/doctors/{doc['id']}", json=doctor_payload(db, expertise=[], department_ids=[urology])
    )
    assert r.json()["department_ids"] == [urology] and r.json()["primary_department_id"] == urology

    assert admin_client.patch(
        f"{A}/doctors/{doc['id']}/visibility", json={"is_hidden": True}
    ).json()["is_hidden"]
    assert PUBLIC.get("/api/v1/public/doctors/dr-test-person").status_code == 404
    assert admin_client.delete(f"{A}/doctors/{doc['id']}").status_code == 204


def test_doctor_photo_must_be_a_plain_file_name_and_primary_must_be_selected(admin_client, db):
    seed_content(db)
    for bad in ("../secret.jpg", "photo.exe", "Has Space.jpg", "https://x.example/a.jpg"):
        r = admin_client.post(
            f"{A}/doctors", json=doctor_payload(db, expertise=[], photo_filename=bad)
        )
        assert r.status_code == 422 and "photo_filename" in r.json()["errors"], bad
    r = admin_client.post(
        f"{A}/doctors",
        json=doctor_payload(db, expertise=[], primary_department_id=dept_id(db, "ent")),
    )
    assert r.status_code == 422 and "primary_department_id" in r.json()["errors"]


# ------------------------------------------------------------ departments


def test_department_create_edit_hide_reorder_delete(admin_client, db):
    seed_content(db)
    r = admin_client.post(
        f"{A}/departments",
        json={"name": "Dental Care", "intro_html": "<p>Hi</p><script>x</script>"},
    )
    assert r.status_code == 201
    new = r.json()
    assert new["slug"] == "dental-care" and "script" not in new["intro_html"]
    assert new["sort_order"] == 150  # after the 14 seeded ones (10..140)

    # Reorder: move the new department to the front.
    order = [d["id"] for d in admin_client.get(f"{A}/departments").json()]
    order.insert(0, order.pop())
    r = admin_client.put(f"{A}/departments/reorder", json={"ids": order})
    assert [d["id"] for d in r.json()] == order
    assert [d["slug"] for d in PUBLIC.get("/api/v1/public/departments").json()][0] == "dental-care"
    assert admin_client.put(f"{A}/departments/reorder", json={"ids": order[:-1]}).status_code == 422

    # Hide, then it vanishes from the public site.
    admin_client.patch(f"{A}/departments/{new['id']}/visibility", json={"is_hidden": True})
    assert "dental-care" not in [d["slug"] for d in PUBLIC.get("/api/v1/public/departments").json()]

    # Delete works only while the department has no treatments.
    assert admin_client.delete(f"{A}/departments/{new['id']}").status_code == 204
    assert admin_client.delete(f"{A}/departments/{dept_id(db, 'ent')}").status_code == 409


# ------------------------------------------------------ submissions + dashboard


def add_message(db, name, hours_ago, *, read=False, message="Please call me back about a visit."):
    row = ContactSubmission(
        name=name,
        phone="9823456789",
        email=f"{name.lower()}@example.com",
        message=message,
        is_read=read,
        created_at=datetime.now(UTC) - timedelta(hours=hours_ago),
    )
    db.add(row)
    db.commit()
    return row


def test_submissions_list_filter_search_read_delete(admin_client, db):
    old = add_message(db, "Oldest", 72, read=True)
    mid = add_message(db, "Middle", 30, message="Need OPD timings for cardiology")
    new = add_message(db, "Newest", 1)

    page = admin_client.get(f"{A}/submissions").json()
    assert [i["name"] for i in page["items"]] == ["Newest", "Middle", "Oldest"]
    assert page["total"] == 3 and page["unread_total"] == 2

    unread = admin_client.get(f"{A}/submissions", params={"read": "false"}).json()
    assert [i["name"] for i in unread["items"]] == ["Newest", "Middle"]
    assert [
        i["name"]
        for i in admin_client.get(f"{A}/submissions", params={"read": "true"}).json()["items"]
    ] == ["Oldest"]

    assert [
        i["name"] for i in admin_client.get(f"{A}/submissions", params={"q": "opd"}).json()["items"]
    ] == ["Middle"]
    assert admin_client.get(f"{A}/submissions", params={"q": "100%"}).json()["total"] == 0

    # Date filters are calendar days in Kolkata.
    def ist_day(hours_ago):
        return (datetime.now(UTC) - timedelta(hours=hours_ago)).astimezone(IST).date().isoformat()

    only_old = admin_client.get(
        f"{A}/submissions", params={"date_from": ist_day(72), "date_to": ist_day(72)}
    )
    assert [i["name"] for i in only_old.json()["items"]] == ["Oldest"]
    recent = admin_client.get(f"{A}/submissions", params={"date_from": ist_day(1)}).json()
    assert "Oldest" not in [i["name"] for i in recent["items"]] and "Newest" in [
        i["name"] for i in recent["items"]
    ]
    assert (
        admin_client.get(f"{A}/submissions", params={"date_to": ist_day(72)}).json()["total"] == 1
    )

    # Open, mark read/unread, delete.
    assert admin_client.get(f"{A}/submissions/{new.id}").json()["is_read"] is False
    assert (
        admin_client.patch(f"{A}/submissions/{new.id}", json={"is_read": True}).json()["is_read"]
        is True
    )
    assert admin_client.get(f"{A}/submissions").json()["unread_total"] == 1
    assert (
        admin_client.patch(f"{A}/submissions/{old.id}", json={"is_read": False}).json()["is_read"]
        is False
    )
    assert admin_client.delete(f"{A}/submissions/{mid.id}").status_code == 204
    assert admin_client.get(f"{A}/submissions/{mid.id}").status_code == 404
    assert admin_client.get(f"{A}/submissions").json()["total"] == 2


def test_submissions_paginate(admin_client, db):
    for i in range(5):
        add_message(db, f"Person{i}", i + 1)
    page2 = admin_client.get(f"{A}/submissions", params={"page": 2, "page_size": 2}).json()
    assert [i["name"] for i in page2["items"]] == ["Person2", "Person3"] and page2["total"] == 5


def test_dashboard_counts(admin_client, db):
    seed_content(db)
    add_message(db, "Unread", 1)
    add_message(db, "Read", 2, read=True)
    tid = db.scalar(select(Treatment.id).where(Treatment.slug == "coronary-angiography"))
    admin_client.put(f"{A}/treatments/{tid}", json=treatment_payload(db))
    other = db.scalar(select(Treatment.id).where(Treatment.slug == "stapedectomy"))
    admin_client.patch(f"{A}/treatments/{other}/visibility", json={"is_hidden": True})
    doc = db.scalar(select(Doctor.id).where(Doctor.slug == "dr-sayi-prasad"))
    admin_client.patch(f"{A}/doctors/{doc}/visibility", json={"is_hidden": True})

    d = admin_client.get(f"{A}/dashboard").json()
    assert d["unread_submissions"] == 1 and d["total_submissions"] == 2
    assert d["treatments"] == {"total": 89, "public": 1, "draft": 87, "hidden": 1}
    assert d["doctors"] == {"total": 5, "public": 4, "hidden": 1}
    assert d["departments"] == {"total": 14, "public": 14, "hidden": 0}
