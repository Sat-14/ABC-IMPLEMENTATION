"""
Share token API endpoints for external evidence sharing.
"""
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.evidence import evidence_bp
from app.evidence.sharing import (
    create_share_token,
    get_share_tokens_for_evidence,
    revoke_share_token,
    validate_share_token
)
from app.evidence.services import get_evidence, resolve_file_path
from app.common.errors import NotFoundError, APIError
from flask import send_file
import os


@evidence_bp.route("/<evidence_id>/share", methods=["POST"])
@jwt_required()
def create_share_link(evidence_id):
    """Create a new share link for evidence."""
    user_id = get_jwt_identity()
    from app.auth.services import find_user_by_id
    user = find_user_by_id(user_id)
    
    if not user:
        raise APIError("User not found", 404)
    
    # Check if evidence exists
    ev = get_evidence(evidence_id)
    if not ev:
        raise NotFoundError("Evidence not found")
    
    # Get expiration hours from request (default 24 hours)
    data = request.get_json() or {}
    expires_in_hours = data.get("expires_in_hours", 24)
    recipient_email = data.get("recipient_email")
    
    # Validate expiration (1 hour to 30 days)
    if expires_in_hours < 1 or expires_in_hours > 720:  # 720 hours = 30 days
        raise APIError("Expiration must be between 1 and 720 hours", 400)
    
    # Create share token
    share_token = create_share_token(
        evidence_id=evidence_id,
        created_by_id=user["user_id"],
        created_by_email=user["email"],
        expires_in_hours=expires_in_hours,
        recipient_email=recipient_email
    )
    
    # Generate full share URL
    from flask import request as flask_request
    base_url = flask_request.host_url.rstrip('/')
    share_url = f"{base_url}/shared/{share_token['token']}"
    
    return jsonify({
        "message": "Share link created successfully",
        "share_token": share_token,
        "share_url": share_url
    }), 201


@evidence_bp.route("/<evidence_id>/shares", methods=["GET"])
@jwt_required()
def list_share_tokens(evidence_id):
    """List all active share tokens for an evidence."""
    user_id = get_jwt_identity()
    
    # Check if evidence exists
    ev = get_evidence(evidence_id)
    if not ev:
        raise NotFoundError("Evidence not found")
    
    tokens = get_share_tokens_for_evidence(evidence_id)
    
    # Don't return the actual token string in list view
    for token in tokens:
        token.pop("token", None)
    
    return jsonify({"share_tokens": tokens}), 200


@evidence_bp.route("/shares/<token_id>", methods=["DELETE"])
@jwt_required()
def revoke_share_link(token_id):
    """Revoke a share token."""
    user_id = get_jwt_identity()
    
    success = revoke_share_token(token_id, user_id)
    
    if not success:
        raise NotFoundError("Share token not found")
    
    return jsonify({"message": "Share link revoked successfully"}), 200
