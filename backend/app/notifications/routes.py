from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.notifications import notifications_bp
from app.notifications.services import get_notifications, get_unread_count, mark_all_as_read, mark_as_read


@notifications_bp.route("/", methods=["GET"])
@jwt_required()
def list_notifications():
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    unread_only = request.args.get("unread_only", "false").lower() == "true"

    result = get_notifications(user_id, page=page, per_page=per_page, unread_only=unread_only)
    return jsonify(result)


@notifications_bp.route("/unread-count", methods=["GET"])
@jwt_required()
def unread_count():
    user_id = get_jwt_identity()
    count = get_unread_count(user_id)
    return jsonify({"unread_count": count})


@notifications_bp.route("/<notification_id>/read", methods=["PATCH"])
@jwt_required()
def mark_read(notification_id):
    user_id = get_jwt_identity()
    success = mark_as_read(notification_id, user_id)
    return jsonify({"success": success})


@notifications_bp.route("/read-all", methods=["PATCH"])
@jwt_required()
def mark_all_read():
    user_id = get_jwt_identity()
    count = mark_all_as_read(user_id)
    return jsonify({"marked_count": count})
