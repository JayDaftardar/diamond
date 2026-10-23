from fastapi.testclient import TestClient

from app.main import app


def test_health_and_security_headers():
    r = TestClient(app).get("/health")
    assert r.status_code == 200
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["x-frame-options"] == "DENY"
