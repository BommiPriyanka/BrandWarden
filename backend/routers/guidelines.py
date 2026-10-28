"""Guidelines router: view clauses, terms, facts. Admin can add."""
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import GuidelineClause, ApprovedFact
from backend.schemas import GuidelineClauseOut, GuidelineClauseCreate, ApprovedFactOut, ApprovedFactCreate
from backend.permissions import get_role, require_permission

router = APIRouter(prefix="/api/guidelines", tags=["guidelines"])


def _parse_docx(content: bytes) -> str:
    from docx import Document
    doc = Document(io.BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def _parse_text(content: bytes) -> str:
    return content.decode("utf-8", errors="replace")


@router.get("/clauses", response_model=List[GuidelineClauseOut])
def list_clauses(db: Session = Depends(get_db)):
    return db.query(GuidelineClause).order_by(GuidelineClause.code).all()


@router.get("/clauses/{code}", response_model=GuidelineClauseOut)
def get_clause(code: str, db: Session = Depends(get_db)):
    clause = db.query(GuidelineClause).filter_by(code=code).first()
    if not clause:
        raise HTTPException(status_code=404, detail=f"Clause '{code}' not found")
    return clause


@router.post("/clauses", response_model=GuidelineClauseOut, status_code=201)
def create_clause(
    body: GuidelineClauseCreate,
    role: str = Depends(get_role),
    db: Session = Depends(get_db),
):
    require_permission(role, "manage_guidelines")
    existing = db.query(GuidelineClause).filter_by(code=body.code).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Clause code '{body.code}' already exists")
    clause = GuidelineClause(**body.model_dump())
    db.add(clause)
    db.commit()
    db.refresh(clause)
    return clause


@router.post("/clauses/upload", response_model=List[GuidelineClauseOut], status_code=201)
async def upload_clauses(
    file: UploadFile = File(...),
    role: str = Depends(get_role),
    db: Session = Depends(get_db),
):
    require_permission(role, "manage_guidelines")
    content = await file.read()
    filename = file.filename or ""

    if filename.endswith(".docx"):
        text = _parse_docx(content)
    else:
        text = _parse_text(content)

    # Split by headings (lines starting with # or ALL CAPS or ending with :)
    import re
    lines = text.splitlines()
    clauses_created = []
    current_title = ""
    current_body: List[str] = []

    def flush(title: str, body: List[str]):
        if not title or not body:
            return None
        text_body = " ".join(body).strip()
        if not text_body:
            return None
        code = f"U-{len(clauses_created) + 1:03d}"
        existing = db.query(GuidelineClause).filter_by(code=code).first()
        if existing:
            return None
        c = GuidelineClause(code=code, title=title[:256], text=text_body, version="1.0")
        db.add(c)
        clauses_created.append(c)
        return c

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if re.match(r"^#{1,3}\s+", stripped):
            flush(current_title, current_body)
            current_title = re.sub(r"^#+\s*", "", stripped)
            current_body = []
        else:
            current_body.append(stripped)

    flush(current_title, current_body)
    if not clauses_created and text.strip():
        # Whole file as one clause
        c = GuidelineClause(code=f"U-001", title="Uploaded guideline", text=text[:4000], version="1.0")
        db.add(c)
        clauses_created.append(c)

    db.commit()
    for c in clauses_created:
        db.refresh(c)
    return clauses_created


@router.get("/facts", response_model=List[ApprovedFactOut])
def list_facts(db: Session = Depends(get_db)):
    return db.query(ApprovedFact).order_by(ApprovedFact.key).all()


@router.post("/facts", response_model=ApprovedFactOut, status_code=201)
def create_fact(
    body: ApprovedFactCreate,
    role: str = Depends(get_role),
    db: Session = Depends(get_db),
):
    require_permission(role, "manage_guidelines")
    existing = db.query(ApprovedFact).filter_by(key=body.key).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Fact key '{body.key}' already exists")
    fact = ApprovedFact(**body.model_dump())
    db.add(fact)
    db.commit()
    db.refresh(fact)
    return fact
