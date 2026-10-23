import time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.main import app
from app.models import ContactSubmission
from app.services import contact_token

client = TestClient(app)
URL = "/api/v1/public/contact"


def payload(**over):
    """A valid submission whose token is 10 seconds old."""
    data = {
        "name": "Asha Patil",
        "phone": "98 2345 6789",
        "email": "asha@example.com",
        "message": "Please call me about OPD timings.",
        "website": "",
        "token": contact_token.make_token(now=time.time() - 10),
    }
    data.update(over)
    return data


def stored(db) -> int:
    return db.scalar(select(func.count(ContactSubmission.id)))


def test_valid_submission_is_stored_normalised(db):
    r = client.post(URL, json=payload(phone="+91 98234-56789"))
    assert r.status_code == 200 and r.json() == {"ok": True}
    row = db.scalar(select(ContactSubmission))
    assert row.phone == "9823456789" and row.is_read is False
    assert row.email == "asha@example.com" and len(row.ip_hash) == 64


def test_email_is_optional(db):
    assert client.post(URL, json=payload(email="")).status_code == 200
    assert db.scalar(select(ContactSubmission)).email is None


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("name", "A"),
        ("phone", "12345"),
        ("phone", "5234567890"),
        ("email", "not-an-email"),
        ("message", "short"),
        ("message", "x" * 2001),
    ],
)
def test_validation_errors_are_reported_per_field(db, field, value):
    r = client.post(URL, json=payload(**{field: value}))
    assert r.status_code == 422
    assert field in r.json()["errors"]
    assert stored(db) == 0


def test_honeypot_gets_fake_success_and_stores_nothing(db):
    r = client.post(URL, json=payload(website="http://spam.example"))
    assert r.status_code == 200 and r.json() == {"ok": True}
    assert stored(db) == 0


def test_too_fast_submission_is_silently_dropped(db):
    r = client.post(URL, json=payload(token=contact_token.make_token()))
    assert r.status_code == 200
    assert stored(db) == 0


@pytest.mark.parametrize("token", ["", "garbage", "123.deadbeef"])
def test_forged_token_is_rejected(db, token):
    assert client.post(URL, json=payload(token=token)).status_code == 400
    assert stored(db) == 0


def test_expired_token_asks_to_reload(db):
    old = contact_token.make_token(now=time.time() - contact_token.MAX_AGE_SECONDS - 60)
    r = client.post(URL, json=payload(token=old))
    assert r.status_code == 400 and "expired" in r.json()["detail"]


def test_rate_limit_blocks_sixth_message_in_an_hour(db):
    for _ in range(5):
        assert client.post(URL, json=payload()).status_code == 200
    assert client.post(URL, json=payload()).status_code == 429
    assert stored(db) == 5


def test_token_endpoint_issues_a_token_that_validates():
    token = client.get(f"{URL}/token").json()["token"]
    assert contact_token.token_age(token) in (0, 1)
