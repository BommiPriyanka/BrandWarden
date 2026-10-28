"""Claim checker: superlatives, numbers, guarantees vs approved facts."""
import re
from typing import List, Dict, Any

SUPERLATIVE_PATTERNS = [
    r"(?<!\w)#\s*1(?!\w)",
    r"\bbest\b",
    r"\bleading\b",
    r"\bfastest\b",
    r"\bmost popular\b",
    r"\bunbeatable\b",
    r"\bunmatched\b",
    r"\bworld[- ]class\b",
    r"\bnumber one\b",
    r"\bno\.?\s*1\b",
]

GUARANTEE_PATTERNS = [
    r"\bguaranteed\b",
    r"\bforever\b",
    r"\blifetime guarantee\b",
    r"\balways works\b",
    r"\b100%\s+guarantee\b",
]

SHIPPING_PATTERNS = [
    r"free\s+shipping\s+(?:on\s+orders?\s+)?(?:over|above|of\s+\+)?\s*\$?\s*(\d+)",
    r"\$(\d+)\s+(?:or more\s+)?(?:for\s+)?free\s+shipping",
]

APPROVED_SHIPPING_THRESHOLD = 75  # dollars


def _find_all(pattern: str, text: str) -> List[re.Match]:
    return list(re.finditer(pattern, text, re.IGNORECASE))


def check_superlatives(text: str) -> List[Dict[str, Any]]:
    findings = []
    seen_spans = set()
    for pat in SUPERLATIVE_PATTERNS:
        for m in _find_all(pat, text):
            span = (m.start(), m.end())
            if span in seen_spans:
                continue
            seen_spans.add(span)
            findings.append({
                "category": "claim",
                "severity": "high",
                "confidence": 1.0,
                "reason": (
                    f"Superlative or absolute claim '{m.group(0).strip()}' found. "
                    "Per policy C-3.2, superlatives require approved evidence on file."
                ),
                "source_quote": (
                    "Claims policy: superlatives such as '#1', 'best', 'leading', 'fastest', "
                    "'most popular' and absolute guarantees require approved evidence on file."
                ),
                "clause_code": "C-3.2",
                "span_start": m.start(),
                "span_end": m.end(),
                "matched_text": m.group(0).strip(),
                "is_ai_assisted": False,
            })
    return findings


def check_guarantees(text: str) -> List[Dict[str, Any]]:
    findings = []
    seen_spans = set()
    for pat in GUARANTEE_PATTERNS:
        for m in _find_all(pat, text):
            span = (m.start(), m.end())
            if span in seen_spans:
                continue
            seen_spans.add(span)
            findings.append({
                "category": "claim",
                "severity": "high",
                "confidence": 1.0,
                "reason": (
                    f"Unconditional guarantee term '{m.group(0).strip()}' found. "
                    "Policy C-3.4 prohibits absolute promises like 'guaranteed' or 'forever'. "
                    "Use 'designed to last' or 'backed by our warranty' instead."
                ),
                "source_quote": (
                    "No unconditional guarantees: do not use 'guaranteed', 'forever', "
                    "'lifetime guarantee', 'always works', or similar absolute promises."
                ),
                "clause_code": "C-3.4",
                "span_start": m.start(),
                "span_end": m.end(),
                "matched_text": m.group(0).strip(),
                "is_ai_assisted": False,
            })
    return findings


def check_shipping_claims(text: str, approved_facts: List[Dict]) -> List[Dict[str, Any]]:
    """Compare stated shipping threshold against the approved fact."""
    findings = []
    approved_threshold = APPROVED_SHIPPING_THRESHOLD

    # Try to pull the threshold from approved_facts
    for fact in approved_facts:
        if fact.get("key") == "free_shipping_threshold":
            m = re.search(r"\$?(\d+)", fact["value"])
            if m:
                approved_threshold = int(m.group(1))

    for pat in SHIPPING_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            # Extract the dollar amount from the match
            amount_match = re.search(r"(\d+)", m.group(0))
            if not amount_match:
                continue
            stated_amount = int(amount_match.group(1))
            if stated_amount != approved_threshold:
                findings.append({
                    "category": "claim",
                    "severity": "high",
                    "confidence": 1.0,
                    "reason": (
                        f"States free shipping over ${stated_amount}, "
                        f"but the approved threshold is ${approved_threshold}. "
                        "This conflicts with the approved fact on record."
                    ),
                    "source_quote": (
                        "Shipping policy accuracy: always state the current free-shipping threshold exactly. "
                        "The approved threshold is free shipping on orders over $75."
                    ),
                    "clause_code": "S-1.0",
                    "span_start": m.start(),
                    "span_end": m.end(),
                    "matched_text": m.group(0).strip(),
                    "fact_conflict": True,
                    "approved_value": f"free shipping on orders over ${approved_threshold}",
                    "is_ai_assisted": False,
                })
    return findings


def run_claim_check(text: str, approved_facts: List[Dict] = None) -> List[Dict[str, Any]]:
    """Run all claim checks and return raw findings."""
    if approved_facts is None:
        approved_facts = []
    findings = []
    findings.extend(check_superlatives(text))
    findings.extend(check_guarantees(text))
    findings.extend(check_shipping_claims(text, approved_facts))
    return findings
