"""Submissions router: create, list, retrieve."""
import io
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Submission, SubmissionVersion, AuditLog, SubmissionStatus
from backend.schemas import SubmissionCreate, SubmissionOut
from backend.permissions import get_role, require_permission
from backend.seed import SAMPLE_DRAFT

router = APIRouter(prefix="/api/submissions", tags=["submissions"])


def _log(db: Session, role: str, action: str, sub_id: int = None, detail: str = None):
    db.add(AuditLog(submission_id=sub_id, actor_role=role, action=action, detail=detail))


@router.get("/sample-draft")
def get_sample_draft():
    """Return the seed sample draft content for the demo."""
    return SAMPLE_DRAFT


@router.post("", response_model=SubmissionOut, status_code=201)
def create_submission(
    body: SubmissionCreate,
    role: str = Depends(get_role),
    db: Session = Depends(get_db),
):
    require_permission(role, "submit")
    sub = Submission(
        title=body.title,
        content_text=body.content_text,
        intended_message=body.intended_message,
        created_by_role=role,
        status=SubmissionStatus.DRAFT,
        version=1,
    )
    db.add(sub)
    db.flush()
    # Save version 1
    db.add(SubmissionVersion(
        submission_id=sub.id,
        version=1,
        content_text=body.content_text,
        created_by_role=role,
    ))
    _log(db, role, "created", sub.id, f"Title: {body.title}")
    db.commit()
    db.refresh(sub)
    return sub


@router.post("/upload", response_model=SubmissionOut, status_code=201)
async def upload_submission(
    file: UploadFile = File(...),
    intended_message: str = Form(...),
    title: str = Form("Untitled"),
    role: str = Depends(get_role),
    db: Session = Depends(get_db),
):
    require_permission(role, "submit")
    content = await file.read()
    filename = file.filename or ""

    if filename.endswith(".docx"):
        from docx import Document
        doc = Document(io.BytesIO(content))
        text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    else:
        text = content.decode("utf-8", errors="replace")

    sub = Submission(
        title=title,
        content_text=text,
        intended_message=intended_message,
        created_by_role=role,
        status=SubmissionStatus.DRAFT,
        version=1,
    )
    db.add(sub)
    db.flush()
    db.add(SubmissionVersion(
        submission_id=sub.id,
        version=1,
        content_text=text,
        created_by_role=role,
    ))
    _log(db, role, "created_via_upload", sub.id, f"File: {filename}")
    db.commit()
    db.refresh(sub)
    return sub


@router.get("", response_model=List[SubmissionOut])
def list_submissions(
    role: str = Depends(get_role),
    db: Session = Depends(get_db),
):
    q = db.query(Submission).order_by(Submission.created_at.desc())
    if role == "creator":
        q = q.filter_by(created_by_role="creator")
    return q.all()


@router.get("/{sub_id}", response_model=SubmissionOut)
def get_submission(
    sub_id: int,
    role: str = Depends(get_role),
    db: Session = Depends(get_db),
):
    sub = db.get(Submission, sub_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub
