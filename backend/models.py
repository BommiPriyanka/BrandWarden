"""SQLAlchemy ORM models for BrandWarden."""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Float,
    ForeignKey, Boolean, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from backend.database import Base


class SubmissionStatus(str, enum.Enum):
    DRAFT = "draft"
    NEEDS_CHANGES = "needs_changes"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class FindingStatus(str, enum.Enum):
    OPEN = "open"
    ACCEPTED = "accepted"
    DISMISSED = "dismissed"


class FindingCategory(str, enum.Enum):
    VOICE = "voice"
    TERMINOLOGY = "terminology"
    CLAIM = "claim"
    ACCESSIBILITY = "accessibility"
    TONE = "tone"


class FindingSeverity(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class GuidelineClause(Base):
    __tablename__ = "guideline_clauses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(32), unique=True, index=True, nullable=False)
    title = Column(String(256), nullable=False)
    text = Column(Text, nullable=False)
    version = Column(String(32), default="1.0")
    created_at = Column(DateTime, default=datetime.utcnow)


class ApprovedFact(Base):
    __tablename__ = "approved_facts"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(128), unique=True, nullable=False)
    value = Column(String(512), nullable=False)
    source = Column(String(256), default="Internal records")
    created_at = Column(DateTime, default=datetime.utcnow)


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(256), default="Untitled")
    content_text = Column(Text, nullable=False)
    intended_message = Column(String(512), nullable=False)
    status = Column(SAEnum(SubmissionStatus), default=SubmissionStatus.DRAFT)
    version = Column(Integer, default=1)
    created_by_role = Column(String(64), default="creator")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    findings = relationship("Finding", back_populates="submission", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="submission", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="submission", cascade="all, delete-orphan")
    versions = relationship("SubmissionVersion", back_populates="submission", cascade="all, delete-orphan")


class SubmissionVersion(Base):
    __tablename__ = "submission_versions"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    version = Column(Integer, nullable=False)
    content_text = Column(Text, nullable=False)
    created_by_role = Column(String(64), default="creator")
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("Submission", back_populates="versions")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    category = Column(SAEnum(FindingCategory), nullable=False)
    severity = Column(SAEnum(FindingSeverity), default=FindingSeverity.MEDIUM)
    confidence = Column(Float, default=1.0)
    reason = Column(Text, nullable=False)
    source_quote = Column(Text, nullable=False)
    clause_code = Column(String(32), nullable=False)
    span_start = Column(Integer, nullable=True)
    span_end = Column(Integer, nullable=True)
    suggestion = Column(Text, nullable=True)
    suggestion_drift_flag = Column(Boolean, default=False)
    status = Column(SAEnum(FindingStatus), default=FindingStatus.OPEN)
    dismissed_reason = Column(Text, nullable=True)
    is_ai_assisted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("Submission", back_populates="findings")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    author_role = Column(String(64), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("Submission", back_populates="comments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=True)
    actor_role = Column(String(64), nullable=False)
    action = Column(String(128), nullable=False)
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("Submission", back_populates="audit_logs")


class LLMCache(Base):
    __tablename__ = "llm_cache"

    id = Column(Integer, primary_key=True, index=True)
    cache_key = Column(String(64), unique=True, index=True, nullable=False)
    response_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
