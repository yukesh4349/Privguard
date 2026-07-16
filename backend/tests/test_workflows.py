import pytest
from fastapi.testclient import TestClient

def test_ingest_event_with_jwt(client: TestClient, normal_user_token_headers: dict):
    event_data = {
        "event_id": "evt-1234",
        "session_id": "session-1",
        "username": "user_test",
        "timestamp": "2026-07-16T12:00:00Z",
        "event_type": "file_read",
        "target_system": "local",
        "target_object": "document.txt",
        "bytes_transferred": 100,
        "command_text": "cat document.txt",
        "result_status": "success"
    }
    r = client.post("/api/v1/events/ingest", json=event_data, headers=normal_user_token_headers)
    assert r.status_code == 200
    res = r.json()
    assert "composite_risk_score" in res
    assert res["risk_band"] == "Low"

def test_ingest_event_with_api_key(client: TestClient):
    event_data = {
        "event_id": "evt-1235",
        "session_id": "session-2",
        "username": "user_test",
        "timestamp": "2026-07-16T12:05:00Z",
        "event_type": "privilege_grant",
        "target_system": "dc-master",
        "target_object": "admin_group",
        "bytes_transferred": 500,
        "command_text": "chmod 777 sensitive_file",
        "result_status": "success"
    }
    headers = {"X-API-Key": "privguard-secret-api-key"}
    r = client.post("/api/v1/events/ingest", json=event_data, headers=headers)
    assert r.status_code == 200
    res = r.json()
    # It should trigger a medium/high/critical score due to chmod 777 and dc-master
    assert res["risk_band"] in ["Medium", "High", "Critical"]

def test_ingest_event_unauthenticated(client: TestClient):
    event_data = {
        "event_id": "evt-1236",
        "session_id": "session-3",
        "username": "user_test",
        "timestamp": "2026-07-16T12:10:00Z",
        "event_type": "login",
    }
    r = client.post("/api/v1/events/ingest", json=event_data)
    assert r.status_code == 401
