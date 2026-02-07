from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.common.errors import NotFoundError
from app.common.validators import validate_required_fields
from app.transfers import transfers_bp
from app.transfers.services import (
    approve_transfer,
    cancel_transfer,
    complete_transfer,
    create_transfer,
    get_transfer,
    get_transfers,
    reject_transfer,
)


@transfers_bp.route("/", methods=["POST"])
@jwt_required()
def request_transfer():
    user_id = get_jwt_identity()
    from app.auth.services import find_user_by_id
    user = find_user_by_id(user_id)
    if not user:
        raise APIError("User not found", 404)

    data = request.get_json() or {}
    validate_required_fields(data, ["evidence_id", "to_user_id", "reason"])

    transfer = create_transfer(
        evidence_id=data["evidence_id"],
        from_user_id=user["user_id"],
        to_user_id=data["to_user_id"],
        reason=data["reason"],
    )

    from app.audit.services import log_action
    log_action(
        action="transfer_requested",
        entity_type="transfer",
        entity_id=transfer["transfer_id"],
        user_id=user["user_id"],
        user_email=user["email"],
        user_role=user["role"],
        details=f"Transfer requested: {transfer['evidence_name']} to {transfer['to_user_name']}",
        metadata={"evidence_id": data["evidence_id"], "to_user_id": data["to_user_id"]},
    )

    return jsonify({"transfer": transfer}), 201


@transfers_bp.route("/", methods=["GET"])
@jwt_required()
def list_transfers():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    from_user = request.args.get("from_user")
    to_user = request.args.get("to_user")
    status = request.args.get("status")

    result = get_transfers(
        page=page, per_page=per_page,
        from_user=from_user, to_user=to_user, status=status,
    )
    return jsonify(result)


@transfers_bp.route("/<transfer_id>", methods=["GET"])
@jwt_required()
def get_transfer_route(transfer_id):
    transfer = get_transfer(transfer_id)
    if not transfer:
        raise NotFoundError("Transfer not found")
    return jsonify({"transfer": transfer})


@transfers_bp.route("/<transfer_id>/approve", methods=["PATCH"])
@jwt_required()
def approve_transfer_route(transfer_id):
    user_id = get_jwt_identity()
    from app.auth.services import find_user_by_id
    user = find_user_by_id(user_id)
    if not user:
        raise APIError("User not found", 404)

    transfer = approve_transfer(transfer_id, user["user_id"])

    from app.audit.services import log_action
    log_action(
        action="transfer_approved",
        entity_type="transfer",
        entity_id=transfer_id,
        user_id=user["user_id"],
        user_email=user["email"],
        user_role=user["role"],
        details=f"Transfer approved: {transfer['evidence_name']}",
    )

    return jsonify({"transfer": transfer})


@transfers_bp.route("/<transfer_id>/reject", methods=["PATCH"])
@jwt_required()
def reject_transfer_route(transfer_id):
    user_id = get_jwt_identity()
    from app.auth.services import find_user_by_id
    user = find_user_by_id(user_id)
    if not user:
        raise APIError("User not found", 404)

    transfer = reject_transfer(transfer_id, user["user_id"])

    from app.audit.services import log_action
    log_action(
        action="transfer_rejected",
        entity_type="transfer",
        entity_id=transfer_id,
        user_id=user["user_id"],
        user_email=user["email"],
        user_role=user["role"],
        details=f"Transfer rejected: {transfer['evidence_name']}",
    )

    return jsonify({"transfer": transfer})


@transfers_bp.route("/<transfer_id>/complete", methods=["PATCH"])
@jwt_required()
def complete_transfer_route(transfer_id):
    user_id = get_jwt_identity()
    from app.auth.services import find_user_by_id
    user = find_user_by_id(user_id)
    if not user:
        raise APIError("User not found", 404)

    transfer = complete_transfer(transfer_id, user["user_id"])

    from app.audit.services import log_action
    log_action(
        action="transfer_completed",
        entity_type="transfer",
        entity_id=transfer_id,
        user_id=user["user_id"],
        user_email=user["email"],
        user_role=user["role"],
        details=f"Transfer completed: {transfer['evidence_name']} to {transfer['to_user_name']}",
    )

    return jsonify({"transfer": transfer})


@transfers_bp.route("/<transfer_id>/cancel", methods=["PATCH"])
@jwt_required()
def cancel_transfer_route(transfer_id):
    user_id = get_jwt_identity()
    from app.auth.services import find_user_by_id
    user = find_user_by_id(user_id)
    if not user:
        raise APIError("User not found", 404)

    transfer = cancel_transfer(transfer_id, user["user_id"])

    from app.audit.services import log_action
    log_action(
        action="transfer_cancelled",
        entity_type="transfer",
        entity_id=transfer_id,
        user_id=user["user_id"],
        user_email=user["email"],
        user_role=user["role"],
        details=f"Transfer cancelled: {transfer['evidence_name']}",
    )

    return jsonify({"transfer": transfer})
