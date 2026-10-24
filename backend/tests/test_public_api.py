import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.models import Doctor, SlugRedirect, Treatment, TreatmentDoctor
from scripts.seed_content import seed_content

client = TestClient(app)
API = "/api/v1/public"


def publish(db, slug: str, html: str = "<p>Real description.</p>", **fields) -> Treatment:
    t = db.scalar(select(Treatment).where(Treatment.slug == slug))
    t.description_html = html
    for key, value in fields.items():
        setattr(t, key, value)
    db.commit()
    return t


@pytest.fixture()
def seeded(db):
    seed_content(db)
    return db


def test_drafts_never_appear_anywhere(seeded):
    assert client.get(f"{API}/treatments").json() == []
    assert client.get(f"{API}/treatments/coronary-angiography").status_code == 404
    dept = client.get(f"{API}/departments/cardiology").json()
    assert dept["treatments"] == [] and dept["treatment_count"] == 0
    assert client.get(f"{API}/sitemap-entries").json()["treatments"] == []


def test_published_treatment_is_visible_and_searchable(seeded):
    publish(seeded, "coronary-angiography", youtube_video_ids=["dQw4w9WgXcQ"])
    detail = client.get(f"{API}/treatments/coronary-angiography").json()
    assert detail["title"] == "Coronary Angiography"
    assert detail["department"] == {"slug": "cardiology", "name": "Cardiology & CVTS"}
    assert detail["youtube_video_ids"] == ["dQw4w9WgXcQ"]

    assert [t["slug"] for t in client.get(f"{API}/treatments", params={"q": "angio"}).json()] == [
        "coronary-angiography"
    ]
    assert client.get(f"{API}/treatments", params={"q": "zzz"}).json() == []
    assert client.get(f"{API}/treatments", params={"department": "ent"}).json() == []

    listing = client.get(f"{API}/departments").json()
    counts = {d["slug"]: d["treatment_count"] for d in listing}
    doctors = {d["slug"]: d["doctor_names"] for d in listing}
    assert doctors["nephrology"] == ["Dr. Vilas Naik"] and doctors["urology"] == []
    assert counts["cardiology"] == 1 and counts["ent"] == 0
    entries = client.get(f"{API}/sitemap-entries").json()
    assert [e["slug"] for e in entries["treatments"]] == ["coronary-angiography"]


def test_search_treats_wildcards_literally(seeded):
    publish(seeded, "coronary-angiography")
    assert client.get(f"{API}/treatments", params={"q": "%"}).json() == []
    assert client.get(f"{API}/treatments", params={"q": "_"}).json() == []


def test_hidden_treatment_and_department_disappear(seeded):
    t = publish(seeded, "coronary-angiography")
    t.is_hidden = True
    seeded.commit()
    assert client.get(f"{API}/treatments/coronary-angiography").status_code == 404

    t.is_hidden = False
    t.department.is_hidden = True
    seeded.commit()
    assert client.get(f"{API}/treatments/coronary-angiography").status_code == 404
    assert client.get(f"{API}/departments/cardiology").status_code == 404
    assert "cardiology" not in [d["slug"] for d in client.get(f"{API}/departments").json()]


def test_media_links_are_rechecked_at_render(seeded):
    good = "https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOp/edit?usp=sharing"
    publish(seeded, "coronary-angiography", presentation_urls=[good])
    urls = client.get(f"{API}/treatments/coronary-angiography").json()["presentation_embed_urls"]
    assert urls == ["https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOp/embed"]

    # A bad stored value is skipped; the good ones around it are still shown.
    publish(
        seeded,
        "coronary-angiography",
        presentation_urls=["https://evil.example/x", good],
        youtube_video_ids=["<script>", "dQw4w9WgXcQ", 42],
    )
    detail = client.get(f"{API}/treatments/coronary-angiography").json()
    assert detail["presentation_embed_urls"] == urls
    assert detail["youtube_video_ids"] == ["dQw4w9WgXcQ"]


def test_doctor_list_detail_and_related_treatments(seeded):
    doctors = client.get(f"{API}/doctors").json()
    assert len(doctors) == 5 and doctors[0]["slug"] == "dr-sayi-prasad"

    t = publish(seeded, "coronary-angiography")
    naik = seeded.scalar(select(Doctor).where(Doctor.slug == "dr-vilas-naik"))
    seeded.add(TreatmentDoctor(treatment_id=t.id, doctor_id=naik.id))
    seeded.commit()

    d = client.get(f"{API}/doctors/dr-vilas-naik").json()
    assert [x["slug"] for x in d["departments"]] == ["cardiology", "nephrology"]
    assert d["departments"][0]["is_primary"] is True
    assert [x["slug"] for x in d["treatments"]] == ["coronary-angiography"]

    sayi = client.get(f"{API}/doctors/dr-sayi-prasad").json()
    assert sayi["training"] == ["Jaslok Hospital, Mumbai", "St. John's Medical College, Bangalore"]

    # Doctor appears on the treatment page and in their department view.
    assert [
        x["slug"] for x in client.get(f"{API}/treatments/coronary-angiography").json()["doctors"]
    ] == ["dr-vilas-naik"]
    assert "dr-vilas-naik" in [
        x["slug"] for x in client.get(f"{API}/departments/nephrology").json()["doctors"]
    ]


def test_hidden_doctor_is_gone(seeded):
    seeded.scalar(select(Doctor).where(Doctor.slug == "dr-shraddha-naik")).is_hidden = True
    seeded.commit()
    assert client.get(f"{API}/doctors/dr-shraddha-naik").status_code == 404
    assert len(client.get(f"{API}/doctors").json()) == 4
    assert "dr-shraddha-naik" not in [
        e["slug"] for e in client.get(f"{API}/sitemap-entries").json()["doctors"]
    ]


def test_slug_redirect_lookup(seeded):
    seeded.add(SlugRedirect(entity_type="treatment", old_slug="old-name", new_slug="new-name"))
    seeded.commit()
    assert client.get(f"{API}/redirects/treatment/old-name").json() == {"new_slug": "new-name"}
    assert client.get(f"{API}/redirects/treatment/missing").status_code == 404


def test_public_responses_are_cacheable_but_contact_is_not(seeded):
    assert "s-maxage=60" in client.get(f"{API}/departments").headers["cache-control"]
    assert client.get(f"{API}/contact/token").headers["cache-control"] == "no-store"
