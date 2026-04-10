from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Enum as SAEnum
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
