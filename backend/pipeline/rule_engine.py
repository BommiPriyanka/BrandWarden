"""Rule engine: terminology, banned words, exclamation count, sentence length."""
import re
from typing import List, Dict, Any


TERMINOLOGY_RULES = [
    {
        "pattern": r"\bclients?\b",
        "replacement": "customers",
        "clause_code": "T-09",
        "source_quote": "Terminology: always say 'customers', never 'clients'.",
        "reason": "Brand guidelines require 'customers' instead of 'clients' in all customer-facing copy.",
        "severity": "high",
        "category": "terminology",
    },
]

BANNED_PATTERNS = [
    # handled in claim_check: superlatives, guarantees
]


def _normalise(text: str) -> str:
    return " ".join(text.split())


def check_terminology(text: str) -> List[Dict[str, Any]]:
    findings = []
    for rule in TERMINOLOGY_RULES:
        for m in re.finditer(rule["pattern"], text, re.IGNORECASE):
            matched_word = m.group(0)
            findings.append({
                "category": rule["category"],
                "severity": rule["severity"],
                "confidence": 1.0,
                "reason": rule["reason"],
                "source_quote": rule["source_quote"],
                "clause_code": rule["clause_code"],
                "span_start": m.start(),
                "span_end": m.end(),
                "matched_text": matched_word,
                "is_ai_assisted": False,
            })
    return findings


def check_exclamation_marks(text: str) -> List[Dict[str, Any]]:
    findings = []
    marks = [m for m in re.finditer(r"!", text)]
    if len(marks) > 1:
        # Flag every mark after the first
        for m in marks[1:]:
            # Get surrounding context (up to 60 chars)
            start = max(0, m.start() - 40)
            end = min(len(text), m.end() + 20)
            context = text[start:end].strip()
            findings.append({
                "category": "voice",
                "severity": "medium",
                "confidence": 1.0,
                "reason": (
                    f"Found {len(marks)} exclamation marks. "
                    "Brand guidelines allow at most one per piece (V-2.1)."
                ),
                "source_quote": "Use at most one exclamation mark per piece.",
                "clause_code": "V-2.1",
                "span_start": m.start(),
                "span_end": m.end(),
                "matched_text": context,
                "is_ai_assisted": False,
            })
    return findings


def check_sentence_length(text: str) -> List[Dict[str, Any]]:
    findings = []
    sentences = re.split(r"(?<=[.!?])\s+", text)
    char_pos = 0
    for sentence in sentences:
        word_count = len(sentence.split())
        if word_count > 30:
            start = text.find(sentence, char_pos)
            end = start + len(sentence) if start >= 0 else -1
            findings.append({
                "category": "accessibility",
                "severity": "low",
                "confidence": 0.9,
                "reason": (
                    f"Sentence has {word_count} words. "
                    "Plain language guidelines prefer sentences under 25 words (A-1.1)."
                ),
                "source_quote": "Short sentences (under 25 words) are preferred.",
                "clause_code": "A-1.1",
                "span_start": start if start >= 0 else None,
                "span_end": end if end >= 0 else None,
                "matched_text": sentence[:80] + ("…" if len(sentence) > 80 else ""),
                "is_ai_assisted": False,
            })
        char_pos += len(sentence) + 1
    return findings


def run_rule_engine(text: str) -> List[Dict[str, Any]]:
    """Run all deterministic rules and return raw findings."""
    findings = []
    findings.extend(check_terminology(text))
    findings.extend(check_exclamation_marks(text))
    findings.extend(check_sentence_length(text))
    return findings
