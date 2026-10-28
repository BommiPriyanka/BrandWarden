"""Analysis router: run the full pipeline on a submission."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Submission, Finding, GuidelineClause, ApprovedFact, FindingStatus
from backend.schemas import AnalysisResult, FindingOut
from backend.permissions import get_role, require_permission
from backend.pipeline.rule_engine import run_rule_engine
from backend.pipeline.claim_check import run_claim_check
from backend.pipeline.evidence_gate import run_evidence_gate
from backend.pipeline.retrieval import retrieve_clauses
from backend.pipeline.ai_adapter import call_ai_judge, AI_UNAVAILABLE_BADGE
from backend.pipeline.suggestion import run_suggestion_engine
from backend.pipeline.masking import mask_text

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


def _clauses_to_dicts(clauses):
    return [{"id": c.id, "code": c.code, "title": c.title, "text": c.text} for c in clauses]


def _facts_to_dicts(facts):
    return [{"id": f.id, "key": f.key, "value": f.value, "source": f.source} for f in facts]


@router.post("/{sub_id}", response_model=AnalysisResult)
def run_analysis(
    sub_id: int,
    role: str = Depends(get_role),
    db: Session = Depends(get_db),
):
    require_permission(role, "view_findings")

    sub = db.get(Submission, sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Clear existing open findings
    db.query(Finding).filter_by(submission_id=sub_id, status=FindingStatus.OPEN).delete()
    db.commit()

    all_clauses = _clauses_to_dicts(db.query(GuidelineClause).all())
    all_facts = _facts_to_dicts(db.query(ApprovedFact).all())

    content = sub.content_text
    intended_message = sub.intended_message

    # 1. Rule engine
    rule_findings = run_rule_engine(content)

    # 2. Claim check
    claim_findings = run_claim_check(content, all_facts)

    raw_deterministic = rule_findings + claim_findings

    # 3. Retrieve top clauses for AI
    top_clauses = retrieve_clauses(content, all_clauses, top_k=5)

    # 4. AI judge (with masking)
    masked_content, _ = mask_text(content)
    ai_findings, ai_status = call_ai_judge(masked_content, top_clauses, intended_message, db=db)

    all_raw = raw_deterministic + ai_findings
    total_candidates = len(all_raw)

    # 5. Evidence gate
    verified, discarded = run_evidence_gate(all_raw, all_clauses, all_facts)

    # 6. Suggestions
    enriched = run_suggestion_engine(verified, content, intended_message)

    # Save findings to DB
    saved = []
    for f in enriched:
        finding = Finding(
            submission_id=sub_id,
            category=f.get("category", "tone"),
            severity=f.get("severity", "medium"),
            confidence=f.get("confidence", 1.0),
            reason=f.get("reason", ""),
            source_quote=f.get("source_quote", ""),
            clause_code=f.get("clause_code", ""),
            span_start=f.get("span_start"),
            span_end=f.get("span_end"),
            suggestion=f.get("suggestion"),
            suggestion_drift_flag=f.get("suggestion_drift_flag", False),
            status=FindingStatus.OPEN,
            is_ai_assisted=f.get("is_ai_assisted", False),
        )
        db.add(finding)
        db.flush()
        saved.append(finding)

    db.commit()
    for s in saved:
        db.refresh(s)

    transparency = {
        "total_candidates": total_candidates,
        "rule_engine_findings": len(rule_findings),
        "claim_check_findings": len(claim_findings),
        "ai_findings_raw": len(ai_findings),
        "discarded_by_evidence_gate": len(discarded),
        "shown_findings": len(saved),
        "ai_status": ai_status,
        "discarded_reasons": [
            {
                "clause_code": d.get("clause_code"),
                "category": d.get("category"),
                "reason": d.get("_discard_reason", ""),
            }
            for d in discarded
        ],
        "checks_run": [
            "rule_engine",
            "claim_check",
            *( ["ai_judge"] if ai_status != AI_UNAVAILABLE_BADGE else []),
        ],
        "ai_used": ai_status not in (AI_UNAVAILABLE_BADGE, ""),
    }

    return AnalysisResult(
        submission_id=sub_id,
        findings=[FindingOut.model_validate(s) for s in saved],
        transparency=transparency,
    )
