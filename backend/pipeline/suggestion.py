"""Suggestion engine: one fix per finding + intent-drift check."""
import re
from typing import Dict, Any, List, Optional


_TERMINOLOGY_FIXES: Dict[str, str] = {
    "clients": "customers",
    "client": "customer",
    "guaranteed": "designed to last",
    "forever": "for years to come",
}

_SUPERLATIVE_FIXES: Dict[str, str] = {
    "#1": "highly rated",
    "best": "a great choice for",
    "leading": "well-regarded",
    "fastest": "quick",
}


def _token_overlap(a: str, b: str) -> float:
    """Simple token-Jaccard overlap for intent drift check."""
    tokens_a = set(re.findall(r"\b\w+\b", a.lower()))
    tokens_b = set(re.findall(r"\b\w+\b", b.lower()))
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a & tokens_b
    union = tokens_a | tokens_b
    return len(intersection) / len(union)


def _suggest_terminology_fix(original_text: str, matched_text: str, intended_message: str) -> Optional[str]:
    lower = matched_text.lower()
    if lower in _TERMINOLOGY_FIXES:
        replacement = _TERMINOLOGY_FIXES[lower]
        # Preserve capitalisation
        if matched_text[0].isupper():
            replacement = replacement.capitalize()
        return f"Replace '{matched_text}' with '{replacement}'"
    return None


def _suggest_superlative_fix(matched_text: str) -> Optional[str]:
    lower = matched_text.lower().strip()
    for pat, fix in _SUPERLATIVE_FIXES.items():
        if pat in lower:
            return f"Replace '{matched_text.strip()}' with '{fix}' and add your supporting evidence reference"
    return f"Remove or qualify the superlative '{matched_text.strip()}' and cite supporting evidence"


def _suggest_guarantee_fix(matched_text: str) -> Optional[str]:
    lower = matched_text.lower().strip()
    if "guaranteed" in lower:
        return "Replace 'guaranteed' with 'designed to last' or 'backed by our warranty'"
    if "forever" in lower:
        return "Replace 'forever' with 'for years to come' or 'with proper care'"
    return f"Remove or soften '{matched_text.strip()}' — use conditional language instead"


def _suggest_exclamation_fix(content: str) -> Optional[str]:
    return (
        "Remove the extra exclamation mark(s). Keep at most one per piece "
        "to maintain a calm, confident brand voice."
    )


def _suggest_shipping_fix(matched_text: str, approved_value: str) -> Optional[str]:
    return f"Update the shipping threshold: change '{matched_text.strip()}' to '{approved_value}'"


def generate_suggestion(
    finding: Dict[str, Any],
    content: str,
    intended_message: str,
) -> Dict[str, Any]:
    """
    Returns the finding dict enriched with `suggestion` and `suggestion_drift_flag`.
    Never auto-applies; returns text advice only.
    """
    category = finding.get("category", "")
    clause_code = finding.get("clause_code", "")
    matched_text = finding.get("matched_text", "")

    suggestion: Optional[str] = None

    if category == "terminology":
        suggestion = _suggest_terminology_fix(content, matched_text, intended_message)
    elif category == "claim":
        if finding.get("fact_conflict"):
            approved = finding.get("approved_value", "the approved value")
            suggestion = _suggest_shipping_fix(matched_text, approved)
        elif clause_code == "C-3.4":
            suggestion = _suggest_guarantee_fix(matched_text)
        else:
            suggestion = _suggest_superlative_fix(matched_text)
    elif category == "voice":
        suggestion = _suggest_exclamation_fix(content)
    elif category == "accessibility":
        suggestion = (
            "Break this sentence into two or more shorter sentences, "
            "each expressing a single idea clearly."
        )
    elif category == "tone":
        # AI finding
        suggestion = (
            f"Revise this passage to align with the brand's calm, confident voice. "
            f"Ensure the core message — '{intended_message[:80]}' — is preserved."
        )
    else:
        suggestion = "Review this passage against the cited guideline clause."

    # Intent drift check: compare the suggestion's described change with intended_message
    drift_flag = False
    if suggestion and intended_message:
        overlap = _token_overlap(suggestion, intended_message)
        # Low overlap between suggestion and intended message may indicate drift
        if overlap < 0.05 and category == "tone":
            drift_flag = True

    return {
        **finding,
        "suggestion": suggestion,
        "suggestion_drift_flag": drift_flag,
    }


def run_suggestion_engine(
    findings: List[Dict[str, Any]],
    content: str,
    intended_message: str,
) -> List[Dict[str, Any]]:
    """Enrich each finding with a suggestion."""
    return [generate_suggestion(f, content, intended_message) for f in findings]
