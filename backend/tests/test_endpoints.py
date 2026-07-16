import pytest
from fastapi.testclient import TestClient

def test_get_dashboard_stats(client: TestClient, admin_token_headers: dict):
    r = client.get("/api/v1/dashboard/stats", headers=admin_token_headers)
    assert r.status_code == 200
    data = r.json()
    assert "total_events" in data

def test_get_alerts(client: TestClient, admin_token_headers: dict):
    r = client.get("/api/v1/dashboard/alerts", headers=admin_token_headers)
    assert r.status_code == 200

def test_get_flagged_users_admin(client: TestClient, admin_token_headers: dict):
    r = client.get("/api/v1/users/flagged-users", headers=admin_token_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)

def test_get_flagged_users_normal(client: TestClient, normal_user_token_headers: dict):
    r = client.get("/api/v1/users/flagged-users", headers=normal_user_token_headers)
    assert r.status_code == 403

def test_endpoints_unauthenticated(client: TestClient):
    r = client.get("/api/v1/dashboard/stats")
    assert r.status_code == 401
