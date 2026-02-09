"""
Evidence sharing via secure token-based links.

Allows creating time-limited share links for external
access to evidence without requiring authentication.
"""

import secrets
import uuid
from datetime import datetime, timezone, timedelta

from app.extensions import mongo


def generate_secure_token():
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(32)


def create_share_token(evidence_id, created_by_id, created_by_email,
                       expires_in_hours=24, recipient_email=None):
    """Create a new share token for evidence."""
    token_id = str(uuid.uuid4())
    token = generate_secure_token()

    share_token = {
        "token_id": token_id,
        "evidence_id": evidence_id,
        "token": token,
        "created_by": created_by_id,
        "created_by_email": created_by_email,
        "recipient_email": recipient_email,
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=expires_in_hours),
        "revoked": False,
        "access_count": 0,
        "created_at": datetime.now(timezone.utc),
        "last_accessed_at": None,
    }

    mongo.db.share_tokens.insert_one(share_token)

    from app.audit.services import log_action
    log_action(
        action="evidence_shared",
        entity_type="evidence",
        entity_id=evidence_id,
        user_id=created_by_id,
        user_email=created_by_email,
        user_role="unknown",
        details=f"Created share link for evidence (expires in {expires_in_hours} hours)",
    )

    return _serialize_token(share_token)


def validate_share_token(token):
    """Validate a share token and check if it's still valid."""
    share_token = mongo.db.share_tokens.find_one({"token": token})
    if not share_token:
        return None

    if share_token.get("revoked", False):
        return None

    expires_at = share_token.get("expires_at")
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            return None

    mongo.db.share_tokens.update_one(
        {"token_id": share_token["token_id"]},
        {
            "$inc": {"access_count": 1},
            "$set": {"last_accessed_at": datetime.now(timezone.utc)},
        },
    )

    return _serialize_token(share_token)


def revoke_share_token(token_id, user_id):
    """Revoke a share token."""
    result = mongo.db.share_tokens.update_one(
        {"token_id": token_id},
        {"$set": {"revoked": True, "revoked_at": datetime.now(timezone.utc), "revoked_by": user_id}},
    )

    if result.modified_count > 0:
        share_token = mongo.db.share_tokens.find_one({"token_id": token_id})
        if share_token:
            from app.audit.services import log_action
            log_action(
                action="share_revoked",
                entity_type="evidence",
                entity_id=share_token["evidence_id"],
                user_id=user_id,
                user_email="",
                user_role="",
                details="Revoked share link for evidence",
            )
        return True

    return False


def get_share_tokens_for_evidence(evidence_id):
    """Get all active share tokens for a specific evidence."""
    tokens = mongo.db.share_tokens.find({
        "evidence_id": evidence_id,
        "revoked": False,
        "expires_at": {"$gt": datetime.now(timezone.utc)},
    }).sort("created_at", -1)

    return [_serialize_token(t) for t in tokens]


def _serialize_token(token):
    """Convert MongoDB document to JSON-serializable dict."""
    if not token:
        return None
    return {
        "token_id": token["token_id"],
        "evidence_id": token["evidence_id"],
        "token": token.get("token"),
        "created_by": token["created_by"],
        "created_by_email": token["created_by_email"],
        "recipient_email": token.get("recipient_email"),
        "expires_at": token["expires_at"].isoformat() if token.get("expires_at") else None,
        "revoked": token.get("revoked", False),
        "access_count": token.get("access_count", 0),
        "created_at": token["created_at"].isoformat() if token.get("created_at") else None,
        "last_accessed_at": token["last_accessed_at"].isoformat() if token.get("last_accessed_at") else None,
    }
