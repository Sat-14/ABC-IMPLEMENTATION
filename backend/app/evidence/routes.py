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
    user_id = get_jwt_identity()
    from app.auth.services import find_user_by_id
    user = find_user_by_id(user_id)
    if not user:
        raise APIError("User not found", 404)

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
        uploaded_by_id=user["user_id"],
        latitude=request.form.get("latitude"),
        longitude=request.form.get("longitude"),
        collection_location=request.form.get("collection_location", ""),
    )

    from app.audit.services import log_action
    log_action(
        action="evidence_uploaded",
        entity_type="evidence",
        entity_id=evidence["evidence_id"],
        user_id=user["user_id"],
        user_email=user["email"],
        user_role=user["role"],
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
    user_id = get_jwt_identity()
    from app.auth.services import find_user_by_id
    user = find_user_by_id(user_id)
    if not user:
        raise APIError("User not found", 404)

    ev = get_evidence(evidence_id)
    if not ev:
        raise NotFoundError("Evidence not found")

    from app.audit.services import log_action
    log_action(
        action="evidence_viewed",
        entity_type="evidence",
        entity_id=evidence_id,
        user_id=user["user_id"],
        user_email=user["email"],
        user_role=user["role"],
        details=f"Viewed evidence {ev['file_name']}",
    )

    return jsonify({"evidence": ev})


@evidence_bp.route("/<evidence_id>", methods=["PATCH"])
@permission_required(Permissions.UPLOAD)
def update_evidence_route(evidence_id):
    user_id = get_jwt_identity()
    from app.auth.services import find_user_by_id
    user = find_user_by_id(user_id)
    if not user:
        raise APIError("User not found", 404)

    data = request.get_json() or {}

    ev = update_evidence(evidence_id, data)
    if not ev:
        raise APIError("Evidence not found or no valid fields", 400)

    from app.audit.services import log_action
    log_action(
        action="evidence_updated",
        entity_type="evidence",
        entity_id=evidence_id,
        user_id=user["user_id"],
        user_email=user["email"],
        user_role=user["role"],
        details=f"Updated evidence metadata for {ev['file_name']}",
    )

    return jsonify({"evidence": ev})


@evidence_bp.route("/<evidence_id>", methods=["DELETE"])
@permission_required(Permissions.DELETE)
def delete_evidence_route(evidence_id):
    user_id = get_jwt_identity()
    from app.auth.services import find_user_by_id
    user = find_user_by_id(user_id)
    if not user:
        raise APIError("User not found", 404)

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
        user_id=user["user_id"],
        user_email=user["email"],
        user_role=user["role"],
        details=f"Soft-deleted evidence {ev['file_name']}",
    )

    return jsonify({"message": "Evidence marked as disposed"})


@evidence_bp.route("/<evidence_id>/verify", methods=["POST"])
@permission_required(Permissions.VERIFY)
def verify_evidence_route(evidence_id):
    user_id = get_jwt_identity()
    from app.auth.services import find_user_by_id
    user = find_user_by_id(user_id)
    if not user:
        raise APIError("User not found", 404)

    result = verify_evidence_integrity(evidence_id, user["user_id"])
    if not result:
        raise NotFoundError("Evidence not found")

    action = "evidence_verified" if result["matches"] else "evidence_verification_failed"
    from app.audit.services import log_action
    log_action(
        action=action,
        entity_type="evidence",
        entity_id=evidence_id,
        user_id=user["user_id"],
        user_email=user["email"],
        user_role=user["role"],
        details=f"Integrity verification: {'INTACT' if result['matches'] else 'TAMPERED'}",
        metadata={"current_hash": result["current_hash"], "matches": result["matches"]},
    )

    if not result["matches"]:
        ev = mongo.db.evidence.find_one({"evidence_id": evidence_id})
        if ev:
            from app.notifications.services import notify_integrity_failure
            notify_integrity_failure(ev.get("current_custodian_id"), ev.get("file_name", "Unknown"), evidence_id)

    return jsonify(result)


@evidence_bp.route("/<evidence_id>/history", methods=["GET"])
@jwt_required()
def evidence_hash_history(evidence_id):
    records = get_hash_history(evidence_id)
    return jsonify({"records": records})


@evidence_bp.route("/<evidence_id>/download", methods=["GET"])
@jwt_required()
def download_evidence(evidence_id):
    user_id = get_jwt_identity()
    from app.auth.services import find_user_by_id
    user = find_user_by_id(user_id)
    if not user:
        raise APIError("User not found", 404)

    ev = mongo.db.evidence.find_one({"evidence_id": evidence_id})
    if not ev:
        raise NotFoundError("Evidence not found")

    from app.audit.services import log_action
    log_action(
        action="evidence_downloaded",
        entity_type="evidence",
        entity_id=evidence_id,
        user_id=user["user_id"],
        user_email=user["email"],
        user_role=user["role"],
        details=f"Downloaded evidence {ev['file_name']}",
    )

    return send_file(
        ev["file_path"],
        as_attachment=True,
        download_name=ev["file_name"],
    )


@evidence_bp.route("/<evidence_id>/preview", methods=["GET"])
@jwt_required()
def preview_evidence(evidence_id):
    """Serve evidence file for in-browser preview with watermark metadata."""
    user_id = get_jwt_identity()
    from app.auth.services import find_user_by_id
    user = find_user_by_id(user_id)
    if not user:
        raise APIError("User not found", 404)

    ev = mongo.db.evidence.find_one({"evidence_id": evidence_id})
    if not ev:
        raise NotFoundError("Evidence not found")

    import mimetypes
    mime = ev.get("file_type") or mimetypes.guess_type(ev["file_name"])[0] or "application/octet-stream"

    # For images, apply watermark
    previewable_images = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if mime in previewable_images:
        from app.evidence.preview import create_watermarked_image
        watermarked = create_watermarked_image(
            ev["file_path"],
            user["full_name"],
            user["email"],
        )
        if watermarked:
            from app.audit.services import log_action
            log_action(
                action="evidence_viewed",
                entity_type="evidence",
                entity_id=evidence_id,
                user_id=user["user_id"],
                user_email=user["email"],
                user_role=user["role"],
                details=f"Previewed evidence {ev['file_name']} (watermarked)",
            )
            return send_file(watermarked, mimetype=mime)

    # For PDFs and text, serve directly (watermark handled client-side)
    previewable = {"application/pdf", "text/plain", "text/csv", "application/json", "text/html"}
    if mime in previewable:
        from app.audit.services import log_action
        log_action(
            action="evidence_viewed",
            entity_type="evidence",
            entity_id=evidence_id,
            user_id=user["user_id"],
            user_email=user["email"],
            user_role=user["role"],
            details=f"Previewed evidence {ev['file_name']}",
        )
        return send_file(ev["file_path"], mimetype=mime)

    return jsonify({"error": "Preview not available for this file type", "mime_type": mime}), 415


@evidence_bp.route("/retention/check", methods=["GET"])
@jwt_required()
def check_retention_policies():
    """Check all evidence against retention policies."""
    from app.evidence.retention import check_retention

    return jsonify(check_retention())


@evidence_bp.route("/<evidence_id>/dispose", methods=["POST"])
@permission_required(Permissions.DELETE)
def dispose_evidence_route(evidence_id):
    """Mark evidence as disposed per retention policy."""
    from app.evidence.retention import dispose_evidence

    user_id = get_jwt_identity()
    data = request.get_json() or {}
    reason = data.get("reason", "Retention policy expired")

    result = dispose_evidence(evidence_id, user_id, reason)
    if not result:
        raise NotFoundError("Evidence not found")
    if "error" in result:
        raise APIError(result["error"])

    return jsonify(result)


@evidence_bp.route("/bulk/verify", methods=["POST"])
@permission_required(Permissions.VERIFY)
def bulk_verify():
    """Verify integrity of multiple evidence items at once."""
    user_id = get_jwt_identity()
    from app.auth.services import find_user_by_id
    user = find_user_by_id(user_id)
    if not user:
        raise APIError("User not found", 404)

    data = request.get_json() or {}
    evidence_ids = data.get("evidence_ids", [])
    if not evidence_ids:
        raise APIError("No evidence IDs provided")

    results = []
    for eid in evidence_ids[:50]:  # Limit to 50 at a time
        result = verify_evidence_integrity(eid, user["user_id"])
        if result:
            action = "evidence_verified" if result["matches"] else "evidence_verification_failed"
            from app.audit.services import log_action
            log_action(
                action=action,
                entity_type="evidence",
                entity_id=eid,
                user_id=user["user_id"],
                user_email=user["email"],
                user_role=user["role"],
                details=f"Bulk verification: {'INTACT' if result['matches'] else 'TAMPERED'}",
            )
            results.append(result)

    intact = sum(1 for r in results if r["matches"])
    tampered = sum(1 for r in results if not r["matches"])

    return jsonify({
        "results": results,
        "summary": {"total": len(results), "intact": intact, "tampered": tampered},
    })


@evidence_bp.route("/export/evidence", methods=["GET"])
@jwt_required()
def export_evidence():
    """Export evidence list as CSV."""
    from flask import Response
    from app.evidence.export import export_evidence_csv

    case_id = request.args.get("case_id")
    csv_data = export_evidence_csv(case_id)

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=evidence-export.csv"},
    )


@evidence_bp.route("/export/audit", methods=["GET"])
@jwt_required()
def export_audit():
    """Export audit logs as CSV."""
    from flask import Response
    from app.evidence.export import export_audit_csv

    csv_data = export_audit_csv()

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=audit-logs-export.csv"},
    )


@evidence_bp.route("/export/cases", methods=["GET"])
@jwt_required()
def export_cases():
    """Export cases list as CSV."""
    from flask import Response
    from app.evidence.export import export_cases_csv

    csv_data = export_cases_csv()

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=cases-export.csv"},
    )


@evidence_bp.route("/analytics", methods=["GET"])
@jwt_required()
def get_analytics():
    """Return aggregated analytics for dashboard charts."""
    from app.evidence.analytics import get_dashboard_analytics

    return jsonify(get_dashboard_analytics())


@evidence_bp.route("/<evidence_id>/trust-score", methods=["GET"])
@jwt_required()
def get_trust_score(evidence_id):
    """Compute and return an explainable trust score for the evidence."""
    from app.evidence.trust_score import compute_trust_score

    result = compute_trust_score(evidence_id)
    if not result:
        raise NotFoundError("Evidence not found")

    return jsonify(result)
