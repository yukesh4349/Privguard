import pytest
from fastapi.testclient import TestClient

def test_login_success(client: TestClient):
    login_data = {
        "username": "admin_test",
        "password": "password123",
    }
    r = client.post("/api/v1/auth/login", data=login_data)
    assert r.status_code == 200
    tokens = r.json()
    assert "access_token" in tokens
    assert tokens["username"] == "admin_test"

def test_login_failure(client: TestClient):
    login_data = {
        "username": "admin_test",
        "password": "wrongpassword",
    }
    r = client.post("/api/v1/auth/login", data=login_data)
    assert r.status_code == 400
