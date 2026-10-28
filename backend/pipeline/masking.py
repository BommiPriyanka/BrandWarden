"""PII and confidential-term masking before external AI calls."""
import re
from typing import List, Tuple

# Patterns to mask
_EMAIL_PAT = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
_PHONE_PAT = re.compile(
    r"(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}"
)

DEFAULT_CONFIDENTIAL_TERMS: List[str] = [
    "internal",
    "confidential",
    "proprietary",
    "trade secret",
    "restricted",
]


def mask_text(
    text: str,
    confidential_terms: List[str] = None,
) -> Tuple[str, List[Tuple[str, str]]]:
    """
    Mask PII and confidential terms.

    Returns:
        masked_text – text safe to send to external AI
        replacements – list of (original, placeholder) pairs for audit
    """
    if confidential_terms is None:
        confidential_terms = DEFAULT_CONFIDENTIAL_TERMS

    masked = text
    replacements: List[Tuple[str, str]] = []

    # Emails
    for m in reversed(list(_EMAIL_PAT.finditer(masked))):
        placeholder = "[EMAIL]"
        replacements.append((m.group(0), placeholder))
        masked = masked[: m.start()] + placeholder + masked[m.end() :]

    # Phone numbers
    for m in reversed(list(_PHONE_PAT.finditer(masked))):
        placeholder = "[PHONE]"
        replacements.append((m.group(0), placeholder))
        masked = masked[: m.start()] + placeholder + masked[m.end() :]

    # Confidential terms
    for term in confidential_terms:
        pattern = re.compile(re.escape(term), re.IGNORECASE)
        masked = pattern.sub("[REDACTED]", masked)
        if pattern.search(text):
            replacements.append((term, "[REDACTED]"))

    return masked, replacements
