"""Settings/About router: transparency disclosure."""
import os
from fastapi import APIRouter
from backend.schemas import SettingsOut

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsOut)
def get_settings():
    provider = os.environ.get("LLM_PROVIDER", "claude").lower()
    key_present = bool(
        os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("GEMINI_API_KEY")
    )

    if provider == "claude":
        model = "claude-3-5-haiku-20241022 (Anthropic)"
    elif provider == "gemini":
        model = "gemini-1.5-flash (Google)"
    else:
        model = "None configured"

    return SettingsOut(
        ai_provider=provider if key_present else "none (fallback mode)",
        ai_model=model if key_present else "Not active — deterministic checks only",
        data_sent_to_ai=(
            "The submission text (after PII masking) and the top-5 most relevant "
            "guideline clauses are sent. No personal data, credentials, or file metadata."
        ),
        masking_applied=(
            "Email addresses, phone numbers, and a configurable list of confidential "
            "terms are replaced with [EMAIL], [PHONE], or [REDACTED] before any AI call."
        ),
        pii_fields_masked=["email addresses", "phone numbers", "confidential terms"],
    )
