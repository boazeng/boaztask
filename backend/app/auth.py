"""Unified authentication for /api/* endpoints.

Accepts either:
  - the shared-auth cookie session (for browser users)
  - an `Authorization: Bearer <token>` header backed by an ApiToken row

Both resolve to the same dict shape `{email, role, name}` so downstream
code does not care which mechanism the caller used.
"""
import hashlib
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Optional

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .database import get_db
from .models import ApiToken

logger = logging.getLogger("boaztask-auth")

TOKEN_PREFIX = "boaztask_pat_"


def _hash_token(plaintext: str) -> str:
    return hashlib.sha256(plaintext.encode("utf-8")).hexdigest()


def _now() -> datetime:
    return datetime.now(timezone.utc)


_AUTH_USER_DB = None


def _user_db():
    """Lazily build a handle to the shared-auth users SQLite, if available.
    Returns None when shared-auth is not installed (dev mode without OAuth)."""
    global _AUTH_USER_DB
    if _AUTH_USER_DB is not None:
        return _AUTH_USER_DB
    try:
        from shared_auth import UserDB  # type: ignore
        path = os.getenv("AUTH_DB_PATH", "/data/auth.db")
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        _AUTH_USER_DB = UserDB(path)
        return _AUTH_USER_DB
    except Exception as exc:  # noqa: BLE001
        logger.info("shared_auth unavailable, running in unauthenticated dev mode: %s", exc)
        _AUTH_USER_DB = False
        return None


def _resolve_token_user(db: Session, raw_token: str) -> Optional[dict]:
    """Look up the bearer token, verify it is active and not expired,
    update last_used_at, and return the owning user's profile."""
    h = _hash_token(raw_token)
    row = db.query(ApiToken).filter(ApiToken.token_hash == h, ApiToken.revoked == False).first()  # noqa: E712
    if not row:
        return None
    now = _now()
    if row.expires_at and row.expires_at < now:
        return None
    row.last_used_at = now
    db.commit()
    udb = _user_db()
    super_admin = (os.getenv("AUTH_SUPER_ADMIN_EMAIL", "") or "").strip().lower()
    if super_admin and row.user_email == super_admin:
        return {"email": super_admin, "role": "admin", "name": "super-admin"}
    if udb:
        rec = udb.get(row.user_email)
        if rec and rec["active"]:
            return {"email": rec["email"], "role": rec["role"], "name": rec["name"]}
        return None
    # auth disabled / not installed: trust the row as a user-role identity
    return {"email": row.user_email, "role": "user", "name": ""}


def _auth_configured() -> bool:
    """True iff Google OAuth env vars are present — meaning auth is meant to
    be active. When unset (first deploy / dev), API endpoints stay open so
    the app keeps working until the operator finishes the OAuth setup."""
    return bool(
        os.getenv("GOOGLE_OAUTH_CLIENT_ID", "").strip()
        and os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "").strip()
        and os.getenv("AUTH_SESSION_SECRET", "").strip()
    )


def require_auth(request: Request, db: Session = Depends(get_db)) -> dict:
    """Dependency that returns the authenticated user, by cookie OR bearer."""
    # Emergency bypass: AUTH_DISABLED=true short-circuits everything.
    if os.getenv("AUTH_DISABLED", "").strip().lower() in ("1", "true", "yes"):
        return {"email": "auth-disabled", "role": "admin", "name": ""}
    # First-deploy / dev mode: auth not configured yet, keep API open.
    if not _auth_configured():
        return {"email": "guest", "role": "admin", "name": ""}
    cookie_user = getattr(request.state, "user", None)
    if cookie_user:
        return cookie_user
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        if token:
            user = _resolve_token_user(db, token)
            if user:
                return user
    raise HTTPException(status_code=401, detail="לא מחובר")


def require_auth_role(*roles: str) -> Callable:
    """Like require_auth but additionally requires the user's role to be
    `admin` or one of the given roles."""
    def _dep(user: dict = Depends(require_auth)) -> dict:
        if user["role"] != "admin" and user["role"] not in roles:
            raise HTTPException(status_code=403, detail="אין לך הרשאה")
        return user
    return _dep
