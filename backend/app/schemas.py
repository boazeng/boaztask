from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .models import UrgencyLevel, TaskStatus


class TaskCreate(BaseModel):
    subject: str
    sub_subject: str = ""
    description: str = ""
    urgency: UrgencyLevel = UrgencyLevel.MEDIUM
    category1: str = ""
    category2: str = ""
    status: TaskStatus = TaskStatus.NEW
    immediate: bool = False


class TaskUpdate(BaseModel):
    subject: Optional[str] = None
    sub_subject: Optional[str] = None
    description: Optional[str] = None
    urgency: Optional[UrgencyLevel] = None
    category1: Optional[str] = None
    category2: Optional[str] = None
    status: Optional[TaskStatus] = None
    immediate: Optional[bool] = None


class TaskResponse(BaseModel):
    id: int
    subject: str
    sub_subject: str
    description: str
    urgency: UrgencyLevel
    category1: str
    category2: str
    status: TaskStatus
    immediate: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
