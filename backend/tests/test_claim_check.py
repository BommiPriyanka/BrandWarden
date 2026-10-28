"""Tests for claim check: superlatives, guarantees, fact conflicts."""
import pytest
from backend.pipeline.claim_check import (
    check_superlatives,
    check_guarantees,
    check_shipping_claims,
    run_claim_check,
)

FACTS = [
    {"key": "free_shipping_threshold", "value": "free shipping on orders over $75", "source": "ops"},
]


def test_superlative_catches_number_one():
    findings = check_superlatives("We are the #1 brand in outdoor gear.")
    assert len(findings) >= 1
    assert findings[0]["clause_code"] == "C-3.2"


def test_superlative_catches_best():
    findings = check_superlatives("The best jacket you can buy.")
    assert any(f["clause_code"] == "C-3.2" for f in findings)


def test_superlative_catches_leading():
    findings = check_superlatives("We are the leading choice for adventurers.")
    assert any(f["clause_code"] == "C-3.2" for f in findings)


def test_guarantee_catches_guaranteed():
    findings = check_guarantees("guaranteed waterproof protection")
    assert any(f["clause_code"] == "C-3.4" for f in findings)


def test_guarantee_catches_forever():
    findings = check_guarantees("waterproof protection forever")
    assert any(f["clause_code"] == "C-3.4" for f in findings)


def test_shipping_conflict_flags_wrong_amount():
    findings = check_shipping_claims("free shipping over $50", FACTS)
    assert len(findings) >= 1
    assert findings[0]["clause_code"] == "S-1.0"
    assert findings[0]["fact_conflict"] is True


def test_shipping_correct_amount_no_flag():
    findings = check_shipping_claims("free shipping on orders over $75", FACTS)
    assert len(findings) == 0


def test_run_claim_check_on_sample():
    text = (
        "Introducing the Northwind Summit Jacket — the #1 rated outdoor jacket on the market! "
        "Our clients love it for its guaranteed waterproof protection forever. "
        "Order now and enjoy free shipping over $50!"
    )
    findings = run_claim_check(text, FACTS)
    codes = [f["clause_code"] for f in findings]
    assert "C-3.2" in codes   # superlative
    assert "C-3.4" in codes   # guarantee + forever
    assert "S-1.0" in codes   # wrong shipping amount
