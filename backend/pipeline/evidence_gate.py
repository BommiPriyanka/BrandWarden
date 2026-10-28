"""Evidence gate: keeps a finding only if its source_quote appears verbatim
(after whitespace normalisation) in the clause or fact text it cites.
Otherwise the finding is discarded and the reason is logged.
"""
import re
from typing import List, Dict, Any, Tuple


def _normalise(text: str) -> str:
    """Collapse all whitespace runs to single spaces and strip."""
    return re.sub(r"\s+", " ", text).strip()


def verify_finding(
    finding: Dict[str, Any],
    clauses: List[Dict],
    facts: List[Dict],
) -> Tuple[bool, str]:
    """
    Returns (is_verified, discard_reason).
    is_verified=True  → finding passes the gate.
    is_verified=False → finding must be discarded; discard_reason explains why.
    """
    quote = _normalise(finding.get("source_quote", ""))
    clause_code = finding.get("clause_code", "")

    if not quote:
        return False, "No source_quote provided."

    # Search in guideline clauses
    for clause in clauses:
        if clause.get("code") == clause_code:
            clause_text = _normalise(clause.get("text", ""))
            if quote in clause_text:
                return True, ""
            # Try partial: all words of the quote appear in the clause
            quote_words = set(quote.lower().split())
            clause_words = set(clause_text.lower().split())
            if quote_words and quote_words.issubset(clause_words):
                return True, ""
            return (
                False,
                f"Quote not found verbatim in clause {clause_code}. "
                f"Quote: '{quote[:80]}…' | Clause starts: '{clause_text[:80]}…'",
            )

    # Search in approved facts
    for fact in facts:
        fact_text = _normalise(fact.get("value", ""))
        if quote in fact_text or fact_text in quote:
            return True, ""

    # Clause code not found at all
    return (
        False,
        f"Clause code '{clause_code}' not found in guideline library. "
        f"Cannot verify quote: '{quote[:80]}'",
    )


def run_evidence_gate(
    raw_findings: List[Dict[str, Any]],
    clauses: List[Dict],
    facts: List[Dict],
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Filter raw_findings through the evidence gate.

    Returns:
        verified   – findings that passed (shown to user)
        discarded  – findings that failed (logged, never shown)
    """
    verified = []
    discarded = []

    for finding in raw_findings:
        ok, reason = verify_finding(finding, clauses, facts)
        if ok:
            verified.append(finding)
        else:
            discarded.append({**finding, "_discard_reason": reason})

    return verified, discarded
