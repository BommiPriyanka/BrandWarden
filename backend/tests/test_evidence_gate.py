"""Tests for the evidence gate."""
import pytest
from backend.pipeline.evidence_gate import verify_finding, run_evidence_gate

CLAUSE = {
    "code": "V-2.1",
    "title": "Voice",
    "text": "Voice: calm, confident, no hype. Use at most one exclamation mark per piece.",
}

FACT = {"key": "shipping", "value": "free shipping on orders over $75", "source": "ops"}


def test_gate_accepts_real_quote():
    finding = {
        "clause_code": "V-2.1",
        "source_quote": "Use at most one exclamation mark per piece.",
        "category": "voice",
    }
    ok, reason = verify_finding(finding, [CLAUSE], [FACT])
    assert ok, f"Expected accept but got: {reason}"


def test_gate_rejects_invented_quote():
    finding = {
        "clause_code": "V-2.1",
        "source_quote": "Never use any punctuation ever in your content.",
        "category": "voice",
    }
    ok, reason = verify_finding(finding, [CLAUSE], [FACT])
    assert not ok, "Expected reject for invented quote"
    assert reason != ""


def test_gate_rejects_missing_clause():
    finding = {
        "clause_code": "FAKE-99",
        "source_quote": "Some text that doesn't exist in any clause.",
        "category": "claim",
    }
    ok, reason = verify_finding(finding, [CLAUSE], [FACT])
    assert not ok
    assert "FAKE-99" in reason


def test_gate_accepts_fact_quote():
    finding = {
        "clause_code": "S-1.0",
        "source_quote": "free shipping on orders over $75",
        "category": "claim",
    }
    ok, reason = verify_finding(finding, [], [FACT])
    assert ok


def test_run_evidence_gate_filters_correctly():
    findings = [
        {
            "clause_code": "V-2.1",
            "source_quote": "Voice: calm, confident, no hype.",
            "category": "voice",
        },
        {
            "clause_code": "V-2.1",
            "source_quote": "This quote is completely invented and wrong.",
            "category": "voice",
        },
    ]
    verified, discarded = run_evidence_gate(findings, [CLAUSE], [FACT])
    assert len(verified) == 1
    assert len(discarded) == 1
    assert discarded[0]["_discard_reason"] != ""


def test_gate_rejects_empty_quote():
    finding = {
        "clause_code": "V-2.1",
        "source_quote": "",
        "category": "voice",
    }
    ok, reason = verify_finding(finding, [CLAUSE], [FACT])
    assert not ok
    assert "No source_quote" in reason
