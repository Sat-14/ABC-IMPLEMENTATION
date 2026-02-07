from datetime import datetime, timezone

from flask import current_app, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.auth.decorators import permission_required
from app.common.constants import EVIDENCE_CATEGORIES, EVIDENCE_CLASSIFICATIONS, Permissions
from app.common.errors import APIError, NotFoundError
from app.evidence import evidence_bp
from app.evidence.services import (
    create_evidence,
    get_evidence,
    get_evidence_list,
    get_hash_history,
    store_evidence_file,
    update_evidence,
    verify_evidence_integrity,
)
from app.extensions import mongo


@evidence_bp.route("/", methods=["POST"])
@permission_required(Permissions.UPLOAD)
def upload_evidence():
    identity = get_jwt_identity()

    if "file" not in request.files:
        raise APIError("No file provided")

    file = request.files["file"]
    if not file.filename:
        raise APIError("Empty filename")

    case_id = request.form.get("case_id")
    if not case_id:
        raise APIError("case_id is required")

    # Verify case exists
    case = mongo.db.cases.find_one({"case_id": case_id})
    if not case:
        raise NotFoundError("Case not found")

    # Store file
    file_path, original_name, file_size = store_evidence_file(
        file, current_app.config["UPLOAD_FOLDER"]
    )

    # Create evidence record
    evidence = create_evidence(
        file_path=file_path,
        original_name=original_name,
        file_size=file_size,
        file_type=file.content_type,
        case_id=case_id,
        category=request.form.get("category", "other"),
        classification=request.form.get("classification", "internal"),
        description=request.form.get("description", ""),
        tags=request.form.get("tags", ""),
        uploaded_by_id=identity["user_id"],
    )

    from app.audit.services import log_action
    log_action(
        action="evidence_uploaded",
        entity_type="evidence",
        entity_id=evidence["evidence_id"],
        user_id=identity["user_id"],
        user_email=identity["email"],
        user_role=identity["role"],
        details=f"Uploaded {original_name} to case {case['case_number']}",
        metadata={
            "file_name": original_name,
            "file_size": file_size,
            "hash_value": evidence["original_hash"],
            "case_number": case["case_number"],
        },
    )

    return jsonify({"evidence": evidence}), 201


@evidence_bp.route("/", methods=["GET"])
@jwt_required()
def list_evidence():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    case_id = request.args.get("case_id")
    category = request.args.get("category")
    status = request.args.get("status")
    search = request.args.get("search")

    result = get_evidence_list(
        page=page, per_page=per_page,
        case_id=case_id, category=category,
        status=status, search=search,
    )
    return jsonify(result)


@evidence_bp.route("/<evidence_id>", methods=["GET"])
@jwt_required()
def get_evidence_route(evidence_id):
    identity = get_jwt_identity()
    ev = get_evidence(evidence_id)
    if not ev:
        raise NotFoundError("Evidence not found")

    from app.audit.services import log_action
    log_action(
        action="evidence_viewed",
        entity_type="evidence",
        entity_id=evidence_id,
        user_id=identity["user_id"],
        user_email=identity["email"],
        user_role=identity["role"],
        details=f"Viewed evidence {ev['file_name']}",
    )

    return jsonify({"evidence": ev})


@evidence_bp.route("/<evidence_id>", methods=["PATCH"])
@permission_required(Permissions.UPLOAD)
def update_evidence_route(evidence_id):
    identity = get_jwt_identity()
    data = request.get_json() or {}

    ev = update_evidence(evidence_id, data)
    if not ev:
        raise APIError("Evidence not found or no valid fields", 400)

    from app.audit.services import log_action
    log_action(
        action="evidence_updated",
        entity_type="evidence",
        entity_id=evidence_id,
        user_id=identity["user_id"],
        user_email=identity["email"],
        user_role=identity["role"],
        details=f"Updated evidence metadata for {ev['file_name']}",
    )

    return jsonify({"evidence": ev})


@evidence_bp.route("/<evidence_id>", methods=["DELETE"])
@permission_required(Permissions.DELETE)
def delete_evidence_route(evidence_id):
    identity = get_jwt_identity()
    ev = get_evidence(evidence_id)
    if not ev:
        raise NotFoundError("Evidence not found")

    # Soft delete
    mongo.db.evidence.update_one(
        {"evidence_id": evidence_id},
        {"$set": {"status": "disposed", "updated_at": datetime.now(timezone.utc)}}
    )

    from app.audit.services import log_action
    log_action(
        action="evidence_deleted",
        entity_type="evidence",
        entity_id=evidence_id,
        user_id=identity["user_id"],
        user_email=identity["email"],
        user_role=identity["role"],
        details=f"Soft-deleted evidence {ev['file_name']}",
    )

    return jsonify({"message": "Evidence marked as disposed"})


@evidence_bp.route("/<evidence_id>/verify", methods=["POST"])
@permission_required(Permissions.VERIFY)
def verify_evidence_route(evidence_id):
    identity = get_jwt_identity()

    result = verify_evidence_integrity(evidence_id, identity["user_id"])
    if not result:
        raise NotFoundError("Evidence not found")

    action = "evidence_verified" if result["matches"] else "evidence_verification_failed"
    from app.audit.services import log_action
    log_action(
        action=action,
        entity_type="evidence",
        entity_id=evidence_id,
        user_id=identity["user_id"],
        user_email=identity["email"],
        user_role=identity["role"],
        details=f"Integrity verification: {'INTACT' if result['matches'] else 'TAMPERED'}",
        metadata={"current_hash": result["current_hash"], "matches": result["matches"]},
    )

    return jsonify(result)


@evidence_bp.route("/<evidence_id>/history", methods=["GET"])
@jwt_required()
def evidence_hash_history(evidence_id):
    records = get_hash_history(evidence_id)
    return jsonify({"records": records})


@evidence_bp.route("/<evidence_id>/download", methods=["GET"])
@jwt_required()
def download_evidence(evidence_id):
    identity = get_jwt_identity()

    ev = mongo.db.evidence.find_one({"evidence_id": evidence_id})
    if not ev:
        raise NotFoundError("Evidence not found")

    from app.audit.services import log_action
    log_action(
        action="evidence_downloaded",
        entity_type="evidence",
        entity_id=evidence_id,
        user_id=identity["user_id"],
        user_email=identity["email"],
        user_role=identity["role"],
        details=f"Downloaded evidence {ev['file_name']}",
    )

    return send_file(
        ev["file_path"],
        as_attachment=True,
        download_name=ev["file_name"],
    )
