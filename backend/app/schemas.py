from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from .models import UrgencyLevel, TaskStatus


class SubSubjectBase(BaseModel):
    name: str


class SubSubjectCreate(SubSubjectBase):
    pass


class SubSubjectUpdate(BaseModel):
    name: Optional[str] = None


class SubSubjectResponse(SubSubjectBase):
    id: int
    subject_id: int
    task_count: int = 0
    created_at: datetime
    model_config = {"from_attributes": True}


class SubjectBase(BaseModel):
    name: str


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: Optional[str] = None


class SubjectResponse(SubjectBase):
    id: int
    sub_subjects: List[SubSubjectResponse] = []
    task_count: int = 0
    created_at: datetime
    model_config = {"from_attributes": True}


class ApiTokenCreate(BaseModel):
    name: str
    expires_in_days: Optional[int] = None


class ApiTokenSummary(BaseModel):
    id: int
    name: str
    prefix: str
    user_email: str
    revoked: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class ApiTokenWithSecret(ApiTokenSummary):
    token: str


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
