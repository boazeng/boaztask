from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import Task, UrgencyLevel, TaskStatus
from ..schemas import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("/", response_model=list[TaskResponse])
def list_tasks(
    status: Optional[TaskStatus] = None,
    urgency: Optional[UrgencyLevel] = None,
    category1: Optional[str] = None,
    category2: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    if urgency:
        query = query.filter(Task.urgency == urgency)
    if category1:
        query = query.filter(Task.category1 == category1)
    if category2:
        query = query.filter(Task.category2 == category2)
    if search:
        query = query.filter(
            Task.subject.contains(search)
            | Task.sub_subject.contains(search)
            | Task.description.contains(search)
        )
    return query.order_by(Task.created_at.desc()).all()


@router.post("/", response_model=TaskResponse, status_code=201)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("/stats/summary")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Task).count()
    by_status = {}
    for s in TaskStatus:
        by_status[s.value] = db.query(Task).filter(Task.status == s).count()
    by_urgency = {}
    for u in UrgencyLevel:
        by_urgency[u.value] = db.query(Task).filter(Task.urgency == u).count()
    return {"total": total, "by_status": by_status, "by_urgency": by_urgency}


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in task_update.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
