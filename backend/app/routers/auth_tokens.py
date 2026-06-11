"""API token CRUD — issue / list / revoke bearer tokens for the calling user.

Tokens inherit the role of the user that created them. We store only a
SHA-256 hash; the plaintext is shown to the user exactly once on creation.
"""
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import require_auth, TOKEN_PREFIX, _hash_token, _now
from ..database import get_db
from ..models import ApiToken
from ..schemas import ApiTokenCreate, ApiTokenSummary, ApiTokenWithSecret

router = APIRouter(prefix="/api/auth/tokens", tags=["auth-tokens"])


@router.get("/", response_model=list[ApiTokenSummary])
def list_tokens(user: dict = Depends(require_auth), db: Session = Depends(get_db)):
    rows = (
        db.query(ApiToken)
          .filter(ApiToken.user_email == user["email"])
          .order_by(ApiToken.created_at.desc())
          .all()
    )
    return rows


@router.post("/", response_model=ApiTokenWithSecret, status_code=201)
def create_token(payload: ApiTokenCreate,
                 user: dict = Depends(require_auth),
                 db: Session = Depends(get_db)):
    name = (payload.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="חובה לתת שם לטוקן")
    raw = TOKEN_PREFIX + secrets.token_urlsafe(32)
    expires_at = None
    if payload.expires_in_days and payload.expires_in_days > 0:
        expires_at = _now() + timedelta(days=payload.expires_in_days)
    row = ApiToken(
        user_email=user["email"],
        name=name,
        token_hash=_hash_token(raw),
        prefix=raw[: len(TOKEN_PREFIX) + 6],
        expires_at=expires_at,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return ApiTokenWithSecret(
        id=row.id, name=row.name, prefix=row.prefix, user_email=row.user_email,
        revoked=row.revoked, created_at=row.created_at,
        last_used_at=row.last_used_at, expires_at=row.expires_at,
        token=raw,
    )


@router.delete("/{token_id}", status_code=204)
def revoke_token(token_id: int,
                 user: dict = Depends(require_auth),
                 db: Session = Depends(get_db)):
    row = db.query(ApiToken).filter(ApiToken.id == token_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="הטוקן לא נמצא")
    if row.user_email != user["email"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="אין לך הרשאה")
    row.revoked = True
    db.commit()
