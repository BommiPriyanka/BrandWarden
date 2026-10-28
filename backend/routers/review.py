"""Review router: status transitions, comments, versions, audit log."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import (
    Submission, Comment, AuditLog, SubmissionVersion,
    SubmissionStatus, Finding, FindingSeverity, FindingStatus
)
from backend.schemas import (
    StatusUpdate, CommentCreate, CommentOut,
    AuditLogOut, VersionOut, SubmissionOut
)
from backend.permissions import get_role, require_permission

router = APIRouter(prefix="/api/review", tags=["review"])

# Valid status transitions per role
TRANSITIONS = {
    "creator": {
        SubmissionStatus.DRAFT: [SubmissionStatus.IN_REVIEW],
        SubmissionStatus.NEEDS_CHANGES: [SubmissionStatus.IN_REVIEW],
    },
    "manager": {
        SubmissionStatus.IN_REVIEW: [
            SubmissionStatus.APPROVED,
            SubmissionStatus.REJECTED,
            SubmissionStatus.NEEDS_CHANGES,
        ],
    },
    "reviewer": {
        SubmissionStatus.IN_REVIEW: [
            SubmissionStatus.APPROVED,
            SubmissionStatus.REJECTED,
            SubmissionStatus.NEEDS_CHANGES,
        ],
    },
    "admin": {
        SubmissionStatus.DRAFT: [SubmissionStatus.IN_REVIEW],
        SubmissionStatus.NEEDS_CHANGES: [SubmissionStatus.IN_REVIEW],
        SubmissionStatus.IN_REVIEW: [
            SubmissionStatus.APPROVED,
            SubmissionStatus.REJECTED,
            SubmissionStatus.NEEDS_CHANGES,
        ],
    },
}


def _log(db, role, action, sub_id, detail=None):
    db.add(AuditLog(submission_id=sub_id, actor_role=role, action=action, detail=detail))


def _has_blocking_findings(db, sub_id: int) -> bool:
    """Return True if there are open high-severity findings."""
    return (
        db.query(Finding)
        .filter_by(submission_id=sub_id, status=FindingStatus.OPEN, severity=FindingSeverity.HIGH)
        .count()
        > 0
    )


@router.post("/{sub_id}/status", response_model=SubmissionOut)
def update_status(
    sub_id: int,
    body: StatusUpdate,
    role: str = Depends(get_role),
    db: Session = Depends(get_db),
):
    sub = db.get(Submission, sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    new_status_str = body.status.lower()
    try:
        new_status = SubmissionStatus(new_status_str)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {body.status}")

    allowed = TRANSITIONS.get(role, {}).get(sub.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=403,
            detail=f"Role '{role}' cannot transition from '{sub.status}' to '{new_status}'",
        )

    # Block approval if open high-severity findings exist (unless override given)
    if new_status == SubmissionStatus.APPROVED:
        require_permission(role, "approve")
        if _has_blocking_findings(db, sub_id):
            if not body.override_reason:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "Cannot approve: unresolved high-severity findings exist. "
                        "Provide override_reason to override."
                    ),
                )
            _log(db, role, "approval_override", sub_id,
                 f"Override reason: {body.override_reason}")

    if new_status == SubmissionStatus.NEEDS_CHANGES:
        require_permission(role, "request_changes")
        if not body.comment:
            raise HTTPException(
                status_code=422,
                detail="A comment is required when requesting changes.",
            )

    if new_status == SubmissionStatus.REJECTED:
        require_permission(role, "reject")

    old_status = sub.status
    sub.status = new_status

    if body.comment:
        db.add(Comment(
            submission_id=sub_id,
            author_role=role,
            text=body.comment,
        ))

    _log(db, role, f"status_changed:{old_status}→{new_status}", sub_id,
         body.comment or None)
    db.commit()
    db.refresh(sub)
    return sub


@router.post("/{sub_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(
    sub_id: int,
    body: CommentCreate,
    role: str = Depends(get_role),
    db: Session = Depends(get_db),
):
    require_permission(role, "comment")
    sub = db.get(Submission, sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    comment = Comment(submission_id=sub_id, author_role=role, text=body.text)
    db.add(comment)
    _log(db, role, "commented", sub_id, body.text[:80])
    db.commit()
    db.refresh(comment)
    return comment


@router.get("/{sub_id}/comments", response_model=List[CommentOut])
def list_comments(sub_id: int, db: Session = Depends(get_db)):
    return db.query(Comment).filter_by(submission_id=sub_id).order_by(Comment.created_at).all()


@router.get("/{sub_id}/audit", response_model=List[AuditLogOut])
def get_audit_log(sub_id: int, db: Session = Depends(get_db)):
    return (
        db.query(AuditLog)
        .filter_by(submission_id=sub_id)
        .order_by(AuditLog.created_at)
        .all()
    )


@router.get("/{sub_id}/versions", response_model=List[VersionOut])
def list_versions(sub_id: int, db: Session = Depends(get_db)):
    return (
        db.query(SubmissionVersion)
        .filter_by(submission_id=sub_id)
        .order_by(SubmissionVersion.version)
        .all()
    )
