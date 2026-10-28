"""Tests for role-based permissions."""
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_creator_cannot_manage_guidelines():
    resp = client.post(
        "/api/guidelines/clauses",
        json={"code": "X-99", "title": "Test", "text": "Test clause text"},
        headers={"x-role": "creator"},
    )
    assert resp.status_code == 403


def test_admin_can_manage_guidelines():
    resp = client.post(
        "/api/guidelines/clauses",
        json={"code": "X-TEST-PERM", "title": "Permission Test", "text": "Permission test clause text content here."},
        headers={"x-role": "admin"},
    )
    assert resp.status_code in (201, 409)  # 409 if already exists


def test_reviewer_cannot_submit():
    resp = client.post(
        "/api/submissions",
        json={
            "title": "Test",
            "content_text": "Some content text here.",
            "intended_message": "Testing permissions for submission",
        },
        headers={"x-role": "reviewer"},
    )
    assert resp.status_code == 403


def test_creator_can_submit():
    resp = client.post(
        "/api/submissions",
        json={
            "title": "Permission Test Submit",
            "content_text": "Our customers enjoy great products.",
            "intended_message": "Testing that creators can submit content",
        },
        headers={"x-role": "creator"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["id"] > 0


def test_creator_cannot_approve():
    # Create a submission first
    resp = client.post(
        "/api/submissions",
        json={
            "title": "Approval Test",
            "content_text": "Our customers love us.",
            "intended_message": "Testing approval permissions",
        },
        headers={"x-role": "creator"},
    )
    sub_id = resp.json()["id"]

    # Try to approve as creator (should fail — creator can only submit for review)
    resp2 = client.post(
        f"/api/review/{sub_id}/status",
        json={"status": "approved"},
        headers={"x-role": "creator"},
    )
    assert resp2.status_code == 403


def test_invalid_role_defaults_to_creator():
    resp = client.get("/api/submissions", headers={"x-role": "superuser"})
    # Should work (defaults to creator) but not error with 403 on GET
    assert resp.status_code == 200
