"""Pydantic schemas for request/response validation."""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ── Guidelines ──────────────────────────────────────────────────────────────

class GuidelineClauseOut(BaseModel):
    id: int
    code: str
    title: str
    text: str
    version: str
    created_at: datetime

    model_config = {"from_attributes": True}


class GuidelineClauseCreate(BaseModel):
    code: str
    title: str
    text: str
    version: str = "1.0"


class ApprovedFactOut(BaseModel):
    id: int
    key: str
    value: str
    source: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ApprovedFactCreate(BaseModel):
    key: str
    value: str
    source: str = "Manual entry"


# ── Submissions ──────────────────────────────────────────────────────────────

class SubmissionCreate(BaseModel):
    title: str = "Untitled"
    content_text: str = Field(..., min_length=1)
    intended_message: str = Field(..., min_length=5)


class SubmissionOut(BaseModel):
    id: int
    title: str
    content_text: str
    intended_message: str
    status: str
    version: int
    created_by_role: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Findings ─────────────────────────────────────────────────────────────────

class FindingOut(BaseModel):
    id: int
    submission_id: int
    category: str
    severity: str
    confidence: float
    reason: str
    source_quote: str
    clause_code: str
    span_start: Optional[int]
    span_end: Optional[int]
    suggestion: Optional[str]
    suggestion_drift_flag: bool
    status: str
    dismissed_reason: Optional[str]
    is_ai_assisted: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class FindingAccept(BaseModel):
    edited_text: Optional[str] = None  # if None, suggestion auto-accepted


class FindingDismiss(BaseModel):
    reason: str = Field(..., min_length=5)


# ── Analysis result ──────────────────────────────────────────────────────────

class AnalysisResult(BaseModel):
    submission_id: int
    findings: List[FindingOut]
    transparency: dict  # pipeline transparency info


# ── Review ───────────────────────────────────────────────────────────────────

class StatusUpdate(BaseModel):
    status: str
    comment: Optional[str] = None
    override_reason: Optional[str] = None  # required when overriding high-severity block


class CommentCreate(BaseModel):
    text: str = Field(..., min_length=1)


class CommentOut(BaseModel):
    id: int
    submission_id: int
    author_role: str
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogOut(BaseModel):
    id: int
    submission_id: Optional[int]
    actor_role: str
    action: str
    detail: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class VersionOut(BaseModel):
    id: int
    submission_id: int
    version: int
    content_text: str
    created_by_role: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Settings ─────────────────────────────────────────────────────────────────

class SettingsOut(BaseModel):
    ai_provider: str
    ai_model: str
    data_sent_to_ai: str
    masking_applied: str
    pii_fields_masked: List[str]
