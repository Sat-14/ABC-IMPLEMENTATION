from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.auth.decorators import permission_required
from app.cases import cases_bp
from app.cases.services import create_case, get_case, get_cases, update_case
from app.common.constants import Permissions
from app.common.errors import APIError, NotFoundError
from app.common.validators import validate_required_fields
from app.extensions import mongo


@cases_bp.route("/", methods=["POST"])
@permission_required(Permissions.UPLOAD)
def create_case_route():
    identity = get_jwt_identity()
    data = request.get_json() or {}
    validate_required_fields(data, ["title"])

    case = create_case(
        title=data["title"],
        description=data.get("description", ""),
        created_by_id=identity["user_id"],
        created_by_name=identity.get("email", ""),
    )

    from app.audit.services import log_action
    log_action(
        action="case_created",
        entity_type="case",
        entity_id=case["case_id"],
        user_id=identity["user_id"],
        user_email=identity["email"],
        user_role=identity["role"],
        details=f"Created case {case['case_number']}: {case['title']}",
    )

    return jsonify({"case": case}), 201


@cases_bp.route("/", methods=["GET"])
@jwt_required()
def list_cases():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    status = request.args.get("status")
    search = request.args.get("search")

    result = get_cases(page=page, per_page=per_page, status=status, search=search)
    return jsonify(result)


@cases_bp.route("/<case_id>", methods=["GET"])
@jwt_required()
def get_case_route(case_id):
    case = get_case(case_id)
    if not case:
        raise NotFoundError("Case not found")
    return jsonify({"case": case})


@cases_bp.route("/<case_id>", methods=["PATCH"])
@permission_required(Permissions.UPLOAD)
def update_case_route(case_id):
    identity = get_jwt_identity()
    data = request.get_json() or {}

    case = update_case(case_id, data)
    if not case:
        raise APIError("Case not found or no valid fields to update", 400)

    from app.audit.services import log_action
    log_action(
        action="case_updated",
        entity_type="case",
        entity_id=case_id,
        user_id=identity["user_id"],
        user_email=identity["email"],
        user_role=identity["role"],
        details=f"Updated case {case['case_number']}",
    )

    return jsonify({"case": case})


@cases_bp.route("/<case_id>/evidence", methods=["GET"])
@jwt_required()
def get_case_evidence(case_id):
    case = get_case(case_id)
    if not case:
        raise NotFoundError("Case not found")

    evidence_list = list(
        mongo.db.evidence.find({"case_id": case_id}, {"_id": 0})
        .sort("created_at", -1)
    )

    from datetime import datetime
    for e in evidence_list:
        for field in ["created_at", "updated_at", "last_verified_at"]:
            if isinstance(e.get(field), datetime):
                e[field] = e[field].isoformat()

    return jsonify({"evidence": evidence_list})
