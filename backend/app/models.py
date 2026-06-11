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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    sub_subjects = relationship(
        "SubSubject",
        back_populates="subject",
        cascade="all, delete-orphan",
        order_by="SubSubject.name",
    )


class SubSubject(Base):
    __tablename__ = "sub_subjects"
    __table_args__ = (UniqueConstraint("subject_id", "name", name="uq_subsubject_name_per_subject"),)

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    subject = relationship("Subject", back_populates="sub_subjects")


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
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
