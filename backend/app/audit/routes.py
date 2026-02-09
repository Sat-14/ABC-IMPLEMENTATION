from flask import jsonify, request
from flask_jwt_extended import jwt_required

from app.audit import audit_bp
from app.audit.services import get_audit_logs, verify_chain_integrity
from app.auth.decorators import permission_required
from app.common.constants import Permissions
from app.common.errors import NotFoundError


@audit_bp.route("/", methods=["GET"])
@jwt_required()
def list_audit_logs():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    entity_type = request.args.get("entity_type")
    action = request.args.get("action")
    user_id = request.args.get("user_id")

    result = get_audit_logs(
        page=page,
        per_page=per_page,
        entity_type=entity_type,
        action=action,
        user_id=user_id,
    )
    return jsonify(result)


@audit_bp.route("/evidence/<evidence_id>", methods=["GET"])
@jwt_required()
def evidence_audit_logs(evidence_id):
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)

    result = get_audit_logs(
        page=page,
        per_page=per_page,
        entity_type="evidence",
        entity_id=evidence_id,
    )
    return jsonify(result)


@audit_bp.route("/verify-chain", methods=["GET"])
@permission_required(Permissions.ADMIN)
def verify_chain():
    result = verify_chain_integrity()
    return jsonify(result)


@audit_bp.route("/summary/evidence/<evidence_id>", methods=["GET"])
@jwt_required()
def evidence_summary(evidence_id):
    """Generate an AI-powered natural language summary for an evidence item."""
    from app.audit.summary import generate_evidence_summary

    result = generate_evidence_summary(evidence_id)
    if not result:
        raise NotFoundError("Evidence not found")

    return jsonify(result)
