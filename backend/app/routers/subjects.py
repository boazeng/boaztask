from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..models import Subject, SubSubject, Task
from ..schemas import (
    SubjectCreate, SubjectUpdate, SubjectResponse,
    SubSubjectCreate, SubSubjectUpdate, SubSubjectResponse,
)


class ReorderPayload(BaseModel):
    ids: list[int]

router = APIRouter(prefix="/api/subjects", tags=["subjects"])


def _subject_to_response(subj: Subject, db: Session) -> SubjectResponse:
    task_count = db.query(Task).filter(Task.subject == subj.name).count()
    sub_resp = [
        SubSubjectResponse(
            id=ss.id,
            subject_id=ss.subject_id,
            name=ss.name,
            created_at=ss.created_at,
            task_count=db.query(Task).filter(
                Task.subject == subj.name,
                Task.sub_subject == ss.name,
            ).count(),
        )
        for ss in subj.sub_subjects
    ]
    return SubjectResponse(
        id=subj.id,
        name=subj.name,
        sub_subjects=sub_resp,
        task_count=task_count,
        created_at=subj.created_at,
    )


@router.get("/", response_model=list[SubjectResponse])
def list_subjects(db: Session = Depends(get_db)):
    subjects = db.query(Subject).order_by(Subject.position, Subject.name).all()
    return [_subject_to_response(s, db) for s in subjects]


@router.post("/reorder", status_code=204)
def reorder_subjects(payload: ReorderPayload, db: Session = Depends(get_db)):
    rows = {s.id: s for s in db.query(Subject).filter(Subject.id.in_(payload.ids)).all()}
    if len(rows) != len(payload.ids):
        raise HTTPException(status_code=400, detail="חלק מהנושאים לא נמצאו")
    for index, subject_id in enumerate(payload.ids):
        rows[subject_id].position = index
    db.commit()


@router.post("/{subject_id}/sub-subjects/reorder", status_code=204)
def reorder_sub_subjects(subject_id: int, payload: ReorderPayload, db: Session = Depends(get_db)):
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="הנושא לא נמצא")
    rows = {
        ss.id: ss
        for ss in db.query(SubSubject)
            .filter(SubSubject.subject_id == subject_id, SubSubject.id.in_(payload.ids))
            .all()
    }
    if len(rows) != len(payload.ids):
        raise HTTPException(status_code=400, detail="חלק מתת-הנושאים לא נמצאו")
    for index, ss_id in enumerate(payload.ids):
        rows[ss_id].position = index
    db.commit()


@router.post("/", response_model=SubjectResponse, status_code=201)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="שם הנושא לא יכול להיות ריק")
    if db.query(Subject).filter(Subject.name == name).first():
        raise HTTPException(status_code=409, detail="כבר קיים נושא בשם הזה")
    max_pos = db.query(Subject).count()
    subj = Subject(name=name, position=max_pos)
    db.add(subj)
    db.commit()
    db.refresh(subj)
    return _subject_to_response(subj, db)


@router.patch("/{subject_id}", response_model=SubjectResponse)
def update_subject(subject_id: int, payload: SubjectUpdate, db: Session = Depends(get_db)):
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="הנושא לא נמצא")
    if payload.name is not None:
        new_name = payload.name.strip()
        if not new_name:
            raise HTTPException(status_code=400, detail="שם הנושא לא יכול להיות ריק")
        if new_name != subj.name:
            if db.query(Subject).filter(Subject.name == new_name).first():
                raise HTTPException(status_code=409, detail="כבר קיים נושא בשם הזה")
            old_name = subj.name
            subj.name = new_name
            db.query(Task).filter(Task.subject == old_name).update({Task.subject: new_name})
    db.commit()
    db.refresh(subj)
    return _subject_to_response(subj, db)


@router.delete("/{subject_id}", status_code=204)
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="הנושא לא נמצא")
    in_use = db.query(Task).filter(Task.subject == subj.name).count()
    if in_use:
        raise HTTPException(
            status_code=409,
            detail=f"לא ניתן למחוק — {in_use} מטלות עדיין משויכות לנושא הזה",
        )
    db.delete(subj)
    db.commit()


@router.post("/{subject_id}/sub-subjects", response_model=SubSubjectResponse, status_code=201)
def create_sub_subject(subject_id: int, payload: SubSubjectCreate, db: Session = Depends(get_db)):
    subj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="הנושא לא נמצא")
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="שם תת-הנושא לא יכול להיות ריק")
    if db.query(SubSubject).filter(SubSubject.subject_id == subject_id, SubSubject.name == name).first():
        raise HTTPException(status_code=409, detail="כבר קיים תת-נושא בשם הזה תחת הנושא")
    max_pos = db.query(SubSubject).filter(SubSubject.subject_id == subject_id).count()
    ss = SubSubject(subject_id=subject_id, name=name, position=max_pos)
    db.add(ss)
    db.commit()
    db.refresh(ss)
    return SubSubjectResponse(
        id=ss.id, subject_id=ss.subject_id, name=ss.name,
        created_at=ss.created_at, task_count=0,
    )


@router.patch("/sub-subjects/{ss_id}", response_model=SubSubjectResponse)
def update_sub_subject(ss_id: int, payload: SubSubjectUpdate, db: Session = Depends(get_db)):
    ss = db.query(SubSubject).filter(SubSubject.id == ss_id).first()
    if not ss:
        raise HTTPException(status_code=404, detail="תת-הנושא לא נמצא")
    if payload.name is not None:
        new_name = payload.name.strip()
        if not new_name:
            raise HTTPException(status_code=400, detail="שם תת-הנושא לא יכול להיות ריק")
        if new_name != ss.name:
            if db.query(SubSubject).filter(
                SubSubject.subject_id == ss.subject_id,
                SubSubject.name == new_name,
            ).first():
                raise HTTPException(status_code=409, detail="כבר קיים תת-נושא בשם הזה תחת הנושא")
            old_name = ss.name
            parent_name = ss.subject.name
            ss.name = new_name
            db.query(Task).filter(
                Task.subject == parent_name,
                Task.sub_subject == old_name,
            ).update({Task.sub_subject: new_name})
    db.commit()
    db.refresh(ss)
    parent_name = ss.subject.name
    task_count = db.query(Task).filter(
        Task.subject == parent_name,
        Task.sub_subject == ss.name,
    ).count()
    return SubSubjectResponse(
        id=ss.id, subject_id=ss.subject_id, name=ss.name,
        created_at=ss.created_at, task_count=task_count,
    )


@router.delete("/sub-subjects/{ss_id}", status_code=204)
def delete_sub_subject(ss_id: int, db: Session = Depends(get_db)):
    ss = db.query(SubSubject).filter(SubSubject.id == ss_id).first()
    if not ss:
        raise HTTPException(status_code=404, detail="תת-הנושא לא נמצא")
    parent_name = ss.subject.name
    in_use = db.query(Task).filter(
        Task.subject == parent_name,
        Task.sub_subject == ss.name,
    ).count()
    if in_use:
        raise HTTPException(
            status_code=409,
            detail=f"לא ניתן למחוק — {in_use} מטלות עדיין משויכות לתת-הנושא הזה",
        )
    db.delete(ss)
    db.commit()
