"""Doctor photos: upload checks, re-encoding, public serving with caching, removal."""

import io

from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import select

from app.main import app
from app.models import Doctor, DoctorPhoto
from app.services import photos
from scripts.import_doctor_photos import import_doctor_photos
from scripts.seed_content import seed_content

A = "/api/v1/admin"
PUBLIC = TestClient(app)


def image_bytes(fmt="JPEG", size=(1200, 1500), mode="RGB", exif_gps=False) -> bytes:
    image = Image.new(mode, size, (30, 60, 140) if mode == "RGB" else (30, 60, 140, 0))
    out = io.BytesIO()
    kwargs = {}
    if exif_gps:
        exif = Image.Exif()
        exif[0x8825] = {1: "N", 2: (16.0, 42.0, 0.0)}  # GPS info block
        kwargs["exif"] = exif
    image.save(out, format=fmt, **kwargs)
    return out.getvalue()


def doctor(db, slug="dr-vilas-naik") -> Doctor:
    return db.scalar(select(Doctor).where(Doctor.slug == slug))


def upload(client, doctor_id, data, content_type="image/jpeg"):
    return client.put(
        f"{A}/doctors/{doctor_id}/photo", content=data, headers={"Content-Type": content_type}
    )


def test_upload_reencodes_to_small_webp_and_serves_with_long_cache(admin_client, db):
    seed_content(db)
    doc = doctor(db)
    r = upload(admin_client, doc.id, image_bytes(exif_gps=True))
    assert r.status_code == 200, r.text
    url = r.json()["photo_url"]
    assert url.startswith("/api/v1/public/doctors/dr-vilas-naik/photo?v=")

    # Stored as WebP, shrunk to fit 800x1000, with no EXIF (GPS) left in it.
    db.expire_all()
    stored = db.get(DoctorPhoto, doc.id)
    assert stored.content_type == "image/webp"
    with Image.open(io.BytesIO(stored.data)) as image:
        assert image.format == "WEBP" and image.size == (800, 1000)
        assert not image.getexif()

    # The public card carries the same address; fetching it gives the image, cached for a year.
    card = next(
        d for d in PUBLIC.get("/api/v1/public/doctors").json() if d["slug"] == "dr-vilas-naik"
    )
    assert card["photo_url"] == url and "photo_version" not in card
    r = PUBLIC.get(url)
    assert r.status_code == 200 and r.headers["content-type"] == "image/webp"
    assert "immutable" in r.headers["cache-control"]
    assert r.headers["x-content-type-options"] == "nosniff"

    # A stale version is still served, but only cached briefly; a matching ETag gives 304.
    r = PUBLIC.get("/api/v1/public/doctors/dr-vilas-naik/photo?v=old")
    assert r.status_code == 200 and "immutable" not in r.headers["cache-control"]
    r = PUBLIC.get(url, headers={"If-None-Match": r.headers["etag"]})
    assert r.status_code == 304

    # The profile carries it too.
    assert PUBLIC.get("/api/v1/public/doctors/dr-vilas-naik").json()["photo_url"] == url


def test_replacing_a_photo_changes_its_address(admin_client, db):
    seed_content(db)
    doc = doctor(db)
    first = upload(admin_client, doc.id, image_bytes()).json()["photo_url"]
    second = upload(admin_client, doc.id, image_bytes("PNG", (500, 600))).json()["photo_url"]
    assert first != second


def test_transparent_png_is_flattened(admin_client, db):
    seed_content(db)
    r = upload(admin_client, doctor(db).id, image_bytes("PNG", (300, 300), "RGBA"), "image/png")
    assert r.status_code == 200, r.text


def test_files_that_are_not_photos_are_refused(admin_client, db):
    seed_content(db)
    doc_id = doctor(db).id
    cases = [
        (
            b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>",
            "image/svg+xml",
        ),
        (b"GIF89a" + b"\x00" * 50, "image/gif"),
        (b"%PDF-1.7 not an image", "image/jpeg"),  # a lying content type
        (image_bytes("GIF"), "image/gif"),  # a real image, but not an allowed format
        (image_bytes(), "application/octet-stream"),  # not sent as an image
        (b"", "image/jpeg"),
    ]
    for body, content_type in cases:
        r = upload(admin_client, doc_id, body, content_type)
        assert r.status_code == 422 and "photo" in r.json()["errors"], (content_type, r.text)
    assert doctor(db).photo_version is None


def test_oversized_upload_is_refused(admin_client, db):
    seed_content(db)
    too_big = b"\xff\xd8" + b"\x00" * (photos.MAX_UPLOAD_BYTES + 1)
    r = upload(admin_client, doctor(db).id, too_big)
    assert r.status_code == 422 and "8 MB" in r.json()["errors"]["photo"]


def test_removing_a_photo_and_hidden_doctors(admin_client, db):
    seed_content(db)
    doc = doctor(db)
    url = upload(admin_client, doc.id, image_bytes()).json()["photo_url"]

    # Hidden doctor: the photo is not public either.
    admin_client.patch(f"{A}/doctors/{doc.id}/visibility", json={"is_hidden": True})
    assert PUBLIC.get(url).status_code == 404
    admin_client.patch(f"{A}/doctors/{doc.id}/visibility", json={"is_hidden": False})
    assert PUBLIC.get(url).status_code == 200

    r = admin_client.delete(f"{A}/doctors/{doc.id}/photo")
    assert r.status_code == 200 and r.json()["photo_url"] is None
    assert PUBLIC.get(url).status_code == 404
    db.expire_all()
    assert db.get(DoctorPhoto, doc.id) is None


def test_deleting_a_doctor_deletes_the_photo(admin_client, db):
    seed_content(db)
    doc_id = doctor(db).id
    upload(admin_client, doc_id, image_bytes())
    assert admin_client.delete(f"{A}/doctors/{doc_id}").status_code == 204
    db.expire_all()
    assert db.get(DoctorPhoto, doc_id) is None


def test_photo_upload_needs_an_admin_and_the_site_origin(admin_client, db):
    seed_content(db)
    doc_id = doctor(db).id
    anonymous = TestClient(app, headers={"Origin": "http://localhost:3000"})
    r = anonymous.put(
        f"{A}/doctors/{doc_id}/photo", content=image_bytes(), headers={"Content-Type": "image/jpeg"}
    )
    assert r.status_code == 401
    r = admin_client.put(
        f"{A}/doctors/{doc_id}/photo",
        content=image_bytes(),
        headers={"Content-Type": "image/jpeg", "Origin": "https://evil.example"},
    )
    assert r.status_code == 403


def test_seed_photos_import_once_and_never_overwrite(db):
    seed_content(db)
    stored = import_doctor_photos(db)
    assert "dr-vilas-naik" in stored and "dr-shraddha-naik" not in stored
    assert import_doctor_photos(db) == []  # already there: left alone
