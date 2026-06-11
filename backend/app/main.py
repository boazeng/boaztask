import logging
import os
from pathlib import Path

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .database import engine, Base, SessionLocal
from .models import Task, Subject, SubSubject, ApiToken  # noqa: F401
from .routers import tasks, subjects, auth_tokens
from .auth import require_auth, require_auth_role

logger = logging.getLogger("boaztask")

Base.metadata.create_all(bind=engine)


def _ensure_position_columns():
    """Idempotent: add the position columns when bringing a pre-existing DB
    up to the current schema. ADD COLUMN IF NOT EXISTS is a PostgreSQL
    no-op on fresh tables too."""
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0"))
        conn.execute(text("ALTER TABLE sub_subjects ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0"))
        conn.commit()


_ensure_position_columns()


def _seed_subjects_from_existing_tasks():
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


def _purge_revoked_tokens():
    """One-time housekeeping: drop any leftover soft-revoked tokens from
    the previous implementation, since deletion is now hard-delete."""
    db = SessionLocal()
    try:
        deleted = db.query(ApiToken).filter(ApiToken.revoked == True).delete()  # noqa: E712
        if deleted:
            db.commit()
            logger.info("Purged %d revoked tokens (soft → hard delete migration)", deleted)
    finally:
        db.close()


_purge_revoked_tokens()


app = FastAPI(title="BoazTask API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _try_install_auth():
    """Wire shared-auth Google OAuth if env vars are present.
    Falls back to running unauthenticated when not configured, so initial
    deploys and dev environments still work."""
    required = ("GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "AUTH_SESSION_SECRET")
    if not all(os.getenv(k, "").strip() for k in required):
        logger.warning(
            "shared-auth env vars missing — running WITHOUT authentication. "
            "Set %s to enable Google sign-in.", ", ".join(required)
        )
        return None
    try:
        from shared_auth import install_auth
    except Exception as exc:  # noqa: BLE001
        logger.error("shared_auth import failed: %s", exc)
        return None

    auth_db_path = os.getenv("AUTH_DB_PATH", "/data/auth.db")
    Path(auth_db_path).parent.mkdir(parents=True, exist_ok=True)
    redirect_uri = os.getenv(
        "AUTH_REDIRECT_URI",
        "https://task.newavera.co.il/auth/callback",
    )
    initial_users = [
        {"email": "boazen@gmail.com", "role": "admin"},
    ]
    install_auth(
        app,
        db_path=auth_db_path,
        redirect_uri=redirect_uri,
        initial_users=initial_users,
        public_prefixes=("/api/",),
    )
    logger.info("shared-auth installed (redirect_uri=%s)", redirect_uri)
    return True


_try_install_auth()


# All /api/* routes require auth; admin-only routes layer require_auth_role on top.
app.include_router(tasks.router, dependencies=[Depends(require_auth)])
app.include_router(subjects.router, dependencies=[Depends(require_auth)])
app.include_router(auth_tokens.router)


@app.get("/")
def root():
    return {"message": "BoazTask API is running"}
