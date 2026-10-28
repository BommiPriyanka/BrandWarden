"""Tests for the rule engine."""
import pytest
from backend.pipeline.rule_engine import (
    check_terminology,
    check_exclamation_marks,
    check_sentence_length,
    run_rule_engine,
)


def test_terminology_catches_clients():
    findings = check_terminology("Our clients love our products.")
    assert any(f["clause_code"] == "T-09" for f in findings)
    assert any("clients" in f["matched_text"].lower() for f in findings)


def test_terminology_passes_customers():
    findings = check_terminology("Our customers love our products.")
    assert len(findings) == 0


def test_exclamation_one_allowed():
    findings = check_exclamation_marks("Great product!")
    assert len(findings) == 0


def test_exclamation_two_flagged():
    findings = check_exclamation_marks("Great product! Buy now!")
    assert len(findings) >= 1
    assert findings[0]["clause_code"] == "V-2.1"


def test_exclamation_three_flags_two():
    findings = check_exclamation_marks("Amazing! Buy now! Limited time!")
    # Should flag the 2nd and 3rd
    assert len(findings) == 2


def test_sentence_length_short_ok():
    findings = check_sentence_length("This is a short sentence.")
    assert len(findings) == 0


def test_sentence_length_long_flagged():
    long_sentence = " ".join(["word"] * 35) + "."
    findings = check_sentence_length(long_sentence)
    assert len(findings) >= 1
    assert findings[0]["clause_code"] == "A-1.1"


def test_run_rule_engine_on_sample():
    text = (
        "Introducing the Northwind Summit Jacket — the #1 rated outdoor jacket on the market! "
        "Our clients love it for its guaranteed waterproof protection forever. "
        "Made from premium materials, this jacket will keep you dry in any conditions! "
        "Order now and enjoy free shipping over $50! "
        "With over a decade of outdoor expertise, we are the leading choice for adventurers everywhere!"
    )
    findings = run_rule_engine(text)
    categories = [f["category"] for f in findings]
    # Should have terminology (clients) and voice (exclamation marks)
    assert "terminology" in categories
    assert "voice" in categories
