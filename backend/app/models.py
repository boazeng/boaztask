from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, UniqueConstraint, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from .database import Base


class UrgencyLevel(str, enum.Enum):
    URGENT = "דחוף"
    HIGH = "גבוה"
    MEDIUM = "בינוני"
    LOW = "נמוך"


class TaskStatus(str, enum.Enum):
    NEW = "חדש"
    IN_PROGRESS = "בטיפול"
    COMPLETED = "הושלם"
    CANCELLED = "בוטל"


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True)
    position = Column(Integer, nullable=False, default=0, server_default="0")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sub_subjects = relationship(
        "SubSubject",
        back_populates="subject",
        cascade="all, delete-orphan",
        order_by="(SubSubject.position, SubSubject.name)",
    )


class SubSubject(Base):
    __tablename__ = "sub_subjects"
    __table_args__ = (UniqueConstraint("subject_id", "name", name="uq_subsubject_name_per_subject"),)

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    position = Column(Integer, nullable=False, default=0, server_default="0")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    subject = relationship("Subject", back_populates="sub_subjects")


class ApiToken(Base):
    """A bearer token tied to a single user email. The token value itself is
    never stored — only its SHA-256 hash. The plaintext is shown to the user
    exactly once on creation."""
    __tablename__ = "api_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(200), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    prefix = Column(String(24), nullable=False)
    revoked = Column(Boolean, nullable=False, default=False, server_default="false")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_used_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(200), nullable=False)
    sub_subject = Column(String(200), default="")
    description = Column(Text, default="")
    urgency = Column(SAEnum(UrgencyLevel), default=UrgencyLevel.MEDIUM)
    category1 = Column(String(100), default="")
    category2 = Column(String(100), default="")
    status = Column(SAEnum(TaskStatus), default=TaskStatus.NEW)
    immediate = Column(Boolean, default=False, nullable=False)
    is_agent_task = Column(Boolean, default=False, nullable=False, server_default="false")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
