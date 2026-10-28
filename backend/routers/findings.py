"""Findings router: accept, dismiss, edit findings."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.models import (
    Finding, Submission, SubmissionVersion, AuditLog,
    FindingStatus, SubmissionStatus
)
from backend.schemas import FindingOut, FindingAccept, FindingDismiss
from backend.permissions import get_role, require_permission

router = APIRouter(prefix="/api/findings", tags=["findings"])


def _log(db, role, action, sub_id, detail=None):
    db.add(AuditLog(submission_id=sub_id, actor_role=role, action=action, detail=detail))


@router.get("/submission/{sub_id}", response_model=List[FindingOut])
def list_findings(
    sub_id: int,
    role: str = Depends(get_role),
    db: Session = Depends(get_db),
):
    require_permission(role, "view_findings")
    return (
        db.query(Finding)
        .filter_by(submission_id=sub_id)
        .order_by(Finding.severity.desc(), Finding.created_at)
        .all()
    )


@router.post("/{finding_id}/accept", response_model=FindingOut)
def accept_finding(
    finding_id: int,
    body: FindingAccept,
    role: str = Depends(get_role),
    db: Session = Depends(get_db),
):
    require_permission(role, "accept_finding")
    finding = db.get(Finding, finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    if finding.status != FindingStatus.OPEN:
        raise HTTPException(status_code=400, detail=f"Finding is already {finding.status}")

    finding.status = FindingStatus.ACCEPTED
    sub = db.get(Submission, finding.submission_id)

    # If edited text provided, update submission and create new version
    if body.edited_text and sub:
        old_text = sub.content_text
        # Replace matched text with the edited text in the submission
        new_text = sub.content_text
        matched = getattr(finding, "matched_text", None)
        if matched and matched in new_text:
            new_text = new_text.replace(matched, body.edited_text, 1)
        else:
            new_text = sub.content_text  # no-op if can't find span

        sub.content_text = new_text
        sub.version += 1
        db.add(SubmissionVersion(
            submission_id=sub.id,
            version=sub.version,
            content_text=new_text,
            created_by_role=role,
        ))
        _log(db, role, "accepted_finding_with_edit", sub.id,
             f"Finding #{finding_id}: edited text applied. Version → {sub.version}")
    else:
        _log(db, role, "accepted_finding", finding.submission_id,
             f"Finding #{finding_id} accepted")

    db.commit()
    db.refresh(finding)
    return finding


@router.post("/{finding_id}/dismiss", response_model=FindingOut)
def dismiss_finding(
    finding_id: int,
    body: FindingDismiss,
    role: str = Depends(get_role),
    db: Session = Depends(get_db),
):
    require_permission(role, "dismiss_finding")
    finding = db.get(Finding, finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    if finding.status != FindingStatus.OPEN:
        raise HTTPException(status_code=400, detail=f"Finding is already {finding.status}")

    finding.status = FindingStatus.DISMISSED
    finding.dismissed_reason = body.reason
    _log(db, role, "dismissed_finding", finding.submission_id,
         f"Finding #{finding_id}: {body.reason}")
    db.commit()
    db.refresh(finding)
    return finding
