"""Tests verifying the app works with no LLM key."""
import os
import pytest
from fastapi.testclient import TestClient

# Ensure no API keys set during test
os.environ.pop("ANTHROPIC_API_KEY", None)
os.environ.pop("GEMINI_API_KEY", None)

from backend.main import app

client = TestClient(app)

SAMPLE_TEXT = (
    "Our clients love this product! It is the #1 choice! "
    "Guaranteed waterproof forever. Free shipping over $50."
)


def test_analysis_runs_without_llm_key():
    # Create submission
    resp = client.post(
        "/api/submissions",
        json={
            "title": "No LLM Test",
            "content_text": SAMPLE_TEXT,
            "intended_message": "Promote product without AI",
        },
        headers={"x-role": "creator"},
    )
    assert resp.status_code == 201
    sub_id = resp.json()["id"]

    # Run analysis
    resp2 = client.post(f"/api/analysis/{sub_id}", headers={"x-role": "creator"})
    assert resp2.status_code == 200
    data = resp2.json()

    # Should have findings from rule engine + claim check
    assert len(data["findings"]) > 0

    # Transparency should show ai_unavailable
    transparency = data["transparency"]
    from backend.pipeline.ai_adapter import AI_UNAVAILABLE_BADGE
    assert transparency["ai_status"] == AI_UNAVAILABLE_BADGE
    assert transparency["ai_used"] is False
    assert "rule_engine" in transparency["checks_run"]


def test_deterministic_findings_present_without_llm():
    resp = client.post(
        "/api/submissions",
        json={
            "title": "Deterministic Only",
            "content_text": SAMPLE_TEXT,
            "intended_message": "Test deterministic checks",
        },
        headers={"x-role": "creator"},
    )
    sub_id = resp.json()["id"]
    resp2 = client.post(f"/api/analysis/{sub_id}", headers={"x-role": "creator"})
    findings = resp2.json()["findings"]
    codes = [f["clause_code"] for f in findings]

    assert "T-09" in codes    # terminology: clients
    assert "C-3.2" in codes   # superlative: #1
    assert "C-3.4" in codes   # guarantee: guaranteed/forever
    assert "S-1.0" in codes   # wrong shipping amount


def test_settings_endpoint():
    resp = client.get("/api/settings")
    assert resp.status_code == 200
    data = resp.json()
    assert "none" in data["ai_provider"]
