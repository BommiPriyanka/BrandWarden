"""AI adapter with Claude/Gemini support, fallback, timeout=10s, and DB cache."""
import hashlib
import json
import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "claude").lower()
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
TIMEOUT_SECONDS = 10

AI_UNAVAILABLE_BADGE = "ai_unavailable"


def _cache_key(text: str, clauses_text: str) -> str:
    raw = f"{text}||{clauses_text}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def _build_prompt(content: str, clauses: List[Dict], intended_message: str) -> str:
    clause_block = "\n".join(
        f"[{c['code']}] {c['title']}: {c['text']}" for c in clauses
    )
    return (
        "You are a brand-governance assistant. "
        "Analyse the CONTENT below against the GUIDELINES and return a JSON array of findings. "
        "Focus on tone and messaging issues only (not terminology or claim facts — those are checked separately). "
        "Each finding must be an object with these exact keys:\n"
        '  "clause_code": string (must be one of the provided clause codes),\n'
        '  "quote": string (a verbatim phrase from CONTENT that violates the guideline),\n'
        '  "explanation": string (plain-language explanation, one sentence),\n'
        '  "severity": "high" | "medium" | "low",\n'
        '  "confidence": number between 0 and 1\n'
        "Return ONLY the JSON array, no markdown, no extra keys.\n\n"
        f"INTENDED MESSAGE: {intended_message}\n\n"
        f"GUIDELINES:\n{clause_block}\n\n"
        f"CONTENT:\n{content}"
    )


def _call_claude(prompt: str) -> List[Dict]:
    import anthropic  # local import so missing package doesn't crash startup

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY, timeout=TIMEOUT_SECONDS)
    response = client.messages.create(
        model="claude-3-5-haiku-20241022",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


def _call_gemini(prompt: str) -> List[Dict]:
    import google.generativeai as genai  # local import

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"},
        request_options={"timeout": TIMEOUT_SECONDS},
    )
    return json.loads(response.text)


def _findings_from_ai_response(
    raw: List[Dict], clauses: List[Dict]
) -> List[Dict[str, Any]]:
    """Convert AI JSON array to internal finding dicts."""
    clause_map = {c["code"]: c for c in clauses}
    findings = []
    for item in raw:
        clause_code = item.get("clause_code", "")
        clause = clause_map.get(clause_code)
        if not clause:
            continue
        quote = item.get("quote", "")
        if not quote:
            continue
        findings.append({
            "category": "tone",
            "severity": item.get("severity", "medium"),
            "confidence": float(item.get("confidence", 0.7)),
            "reason": item.get("explanation", "AI-detected issue."),
            "source_quote": clause["text"][:300],  # verbatim from stored clause
            "clause_code": clause_code,
            "span_start": None,
            "span_end": None,
            "matched_text": quote,
            "is_ai_assisted": True,
        })
    return findings


def call_ai_judge(
    content: str,
    clauses: List[Dict],
    intended_message: str,
    db=None,
) -> tuple[List[Dict[str, Any]], str]:
    """
    Returns (findings, status).
    status is "ok", "cached", or AI_UNAVAILABLE_BADGE.
    """
    # Check cache
    clauses_text = json.dumps([c.get("code", "") + c.get("text", "") for c in clauses])
    key = _cache_key(content, clauses_text)

    if db is not None:
        from backend.models import LLMCache
        cached = db.query(LLMCache).filter_by(cache_key=key).first()
        if cached:
            try:
                raw = json.loads(cached.response_json)
                findings = _findings_from_ai_response(raw, clauses)
                return findings, "cached"
            except Exception:
                pass

    if not clauses:
        return [], AI_UNAVAILABLE_BADGE

    provider = LLM_PROVIDER
    api_key = ANTHROPIC_API_KEY if provider == "claude" else GEMINI_API_KEY

    if not api_key:
        return [], AI_UNAVAILABLE_BADGE

    prompt = _build_prompt(content, clauses, intended_message)

    try:
        if provider == "claude":
            raw = _call_claude(prompt)
        elif provider == "gemini":
            raw = _call_gemini(prompt)
        else:
            return [], AI_UNAVAILABLE_BADGE

        # Store in cache
        if db is not None:
            from backend.models import LLMCache
            db.add(LLMCache(cache_key=key, response_json=json.dumps(raw)))
            db.commit()

        findings = _findings_from_ai_response(raw, clauses)
        return findings, "ok"

    except Exception as exc:
        logger.warning("AI call failed: %s", exc)
        return [], AI_UNAVAILABLE_BADGE
