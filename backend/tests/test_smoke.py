"""End-to-end smoke test of the demo journey."""
import os
import pytest
from fastapi.testclient import TestClient

os.environ.pop("ANTHROPIC_API_KEY", None)
os.environ.pop("GEMINI_API_KEY", None)

from backend.main import app
from backend.seed import SAMPLE_DRAFT

client = TestClient(app)

SAMPLE_TEXT = SAMPLE_DRAFT["content_text"]
SAMPLE_INTENDED = SAMPLE_DRAFT["intended_message"]


def test_full_demo_journey():
    """
    Smoke test of the full demo journey:
    1. Open sample draft (GET /api/submissions/sample-draft)
    2. Submit it
    3. Analyse
    4. Accept 2 findings
    5. Dismiss 1 finding with a reason
    6. Submit for review (creator → in_review)
    7. Switch to reviewer, add comment
    8. Approve (with override for high-severity)
    """

    # 1. Get sample draft
    resp = client.get("/api/submissions/sample-draft")
    assert resp.status_code == 200
    draft = resp.json()
    assert "content_text" in draft

    # 2. Submit
    resp = client.post(
        "/api/submissions",
        json={
            "title": draft["title"],
            "content_text": draft["content_text"],
            "intended_message": draft["intended_message"],
        },
        headers={"x-role": "creator"},
    )
    assert resp.status_code == 201
    sub_id = resp.json()["id"]

    # 3. Analyse
    resp = client.post(f"/api/analysis/{sub_id}", headers={"x-role": "creator"})
    assert resp.status_code == 200
    data = resp.json()
    findings = data["findings"]
    transparency = data["transparency"]
    assert len(findings) > 0
    assert transparency["shown_findings"] == len(findings)
    assert transparency["total_candidates"] >= transparency["shown_findings"]

    open_findings = [f for f in findings if f["status"] == "open"]
    assert len(open_findings) >= 3, f"Need at least 3 open findings, got {len(open_findings)}"

    # 4. Accept 2 findings
    for finding in open_findings[:2]:
        resp = client.post(
            f"/api/findings/{finding['id']}/accept",
            json={},
            headers={"x-role": "creator"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "accepted"

    # 5. Dismiss 1 finding with reason
    third_finding = open_findings[2]
    resp = client.post(
        f"/api/findings/{third_finding['id']}/dismiss",
        json={"reason": "This phrasing is intentional and approved by legal."},
        headers={"x-role": "creator"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "dismissed"
    assert resp.json()["dismissed_reason"] != ""

    # 6. Submit for review
    resp = client.post(
        f"/api/review/{sub_id}/status",
        json={"status": "in_review"},
        headers={"x-role": "creator"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_review"

    # 7. Switch to reviewer — add comment
    resp = client.post(
        f"/api/review/{sub_id}/comments",
        json={"text": "Looks mostly good, approved with note on superlative removal."},
        headers={"x-role": "reviewer"},
    )
    assert resp.status_code == 201

    # 8. Approve (may need override if high-severity open)
    resp = client.post(
        f"/api/review/{sub_id}/status",
        json={
            "status": "approved",
            "override_reason": "Remaining issues acknowledged, approved for publication.",
        },
        headers={"x-role": "reviewer"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "approved"

    # Verify audit log has entries
    resp = client.get(f"/api/review/{sub_id}/audit")
    assert resp.status_code == 200
    audit = resp.json()
    actions = [a["action"] for a in audit]
    assert any("created" in a for a in actions)
    assert any("status_changed" in a for a in actions)

    # Verify version history
    resp = client.get(f"/api/review/{sub_id}/versions")
    assert resp.status_code == 200
    versions = resp.json()
    assert len(versions) >= 1
