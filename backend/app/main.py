from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, SessionLocal
from .models import Task, Subject, SubSubject
from .routers import tasks, subjects

Base.metadata.create_all(bind=engine)


def _seed_subjects_from_existing_tasks():
    """Backfill the subjects/sub_subjects tables from existing task strings.
    Runs every startup but is idempotent — only inserts what doesn't already exist."""
    db = SessionLocal()
    try:
        existing_subjects = {s.name: s for s in db.query(Subject).all()}
        pairs = (
            db.query(Task.subject, Task.sub_subject)
              .filter(Task.subject.isnot(None))
              .filter(Task.subject != "")
              .distinct()
              .all()
        )
        added = False
        for subj_name, sub_name in pairs:
            subj = existing_subjects.get(subj_name)
            if not subj:
                subj = Subject(name=subj_name)
                db.add(subj)
                db.flush()
                existing_subjects[subj_name] = subj
                added = True
            if sub_name:
                already = db.query(SubSubject).filter(
                    SubSubject.subject_id == subj.id,
                    SubSubject.name == sub_name,
                ).first()
                if not already:
                    db.add(SubSubject(subject_id=subj.id, name=sub_name))
                    added = True
        if added:
            db.commit()
    finally:
        db.close()


_seed_subjects_from_existing_tasks()

app = FastAPI(title="BoazTask API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(subjects.router)


@app.get("/")
def root():
    return {"message": "BoazTask API is running"}
