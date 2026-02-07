from flask import jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)

from app.auth import auth_bp
from app.auth.decorators import role_required
from app.auth.services import (
    create_user,
    find_user_by_email,
    find_user_by_id,
    get_all_users,
    sanitize_user,
    update_user,
    verify_password,
)
from app.common.constants import ALL_ROLES, Roles
from app.common.errors import APIError, ValidationError
from app.common.validators import validate_email, validate_required_fields


def _make_identity(user):
    return {"user_id": user["user_id"], "role": user["role"], "email": user["email"]}


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    validate_required_fields(data, ["email", "password", "full_name", "role"])
    email = validate_email(data["email"])
    data["role"] = data["role"].lower()

    if data["role"] not in ALL_ROLES:
        raise ValidationError(f"Invalid role. Must be one of: {', '.join(ALL_ROLES)}")

    if len(data["password"]) < 6:
        raise ValidationError("Password must be at least 6 characters")

    if find_user_by_email(email):
        raise APIError("Email already registered", 409)

    user = create_user(
        email=email,
        password=data["password"],
        full_name=data["full_name"],
        role=data["role"],
        department=data.get("department", ""),
    )

    # Use string ID for identity to avoid "Subject must be a string" error
    # We'll fetch user details in protected routes if needed, or stick to simple claims
    access_token = create_access_token(identity=str(user["user_id"]))
    refresh_token = create_refresh_token(identity=str(user["user_id"]))

    from app.audit.services import log_action
    log_action(
        action="user_registered",
        entity_type="user",
        entity_id=user["user_id"],
        user_id=user["user_id"],
        user_email=user["email"],
        user_role=user["role"],
        details=f"User {user['full_name']} registered as {user['role']}",
    )

    return jsonify({
        "user": user,
        "access_token": access_token,
        "refresh_token": refresh_token,
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    validate_required_fields(data, ["email", "password"])

    user = find_user_by_email(data["email"])
    if not user or not verify_password(data["password"], user["password_hash"]):
        raise APIError("Invalid email or password", 401)

    if not user.get("is_active", True):
        raise APIError("Account is deactivated", 403)

    # Use string ID for identity
    access_token = create_access_token(identity=str(user["user_id"]))
    refresh_token = create_refresh_token(identity=str(user["user_id"]))

    from app.audit.services import log_action
    log_action(
        action="user_login",
        entity_type="user",
        entity_id=user["user_id"],
        user_id=user["user_id"],
        user_email=user["email"],
        user_role=user["role"],
        details=f"User {user['full_name']} logged in",
    )

    return jsonify({
        "user": sanitize_user(user),
        "access_token": access_token,
        "refresh_token": refresh_token,
    })


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)
    return jsonify({"access_token": access_token})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    identity = get_jwt_identity()
    user_id = identity.get("user_id") if isinstance(identity, dict) else identity
    user = find_user_by_id(user_id)
    if not user:
        raise APIError("User not found", 404)
    return jsonify({"user": sanitize_user(user)})


@auth_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users():
    users = get_all_users()
    return jsonify({"users": users})


@auth_bp.route("/users/<user_id>", methods=["PATCH"])
@jwt_required()
def update_user_route(user_id):
    identity = get_jwt_identity()
    current_user_id = identity.get("user_id") if isinstance(identity, dict) else identity
    current_user = find_user_by_id(current_user_id)
    
    # Allow users to update their own profile, or admins to update any profile
    if str(current_user_id) != str(user_id) and current_user.get("role") != Roles.ADMIN:
        raise APIError("Unauthorized: You can only update your own profile", 403)
    
    data = request.get_json() or {}
    
    # Non-admin users can only update specific fields
    if current_user.get("role") != Roles.ADMIN:
        allowed_fields = {"full_name", "email", "department"}
        data = {k: v for k, v in data.items() if k in allowed_fields}
    
    user = update_user(user_id, data)
    if not user:
        raise APIError("User not found or no valid fields to update", 400)
    
    from app.audit.services import log_action
    log_action(
        action="user_profile_updated",
        entity_type="user",
        entity_id=user["user_id"],
        user_id=current_user_id,
        user_email=current_user.get("email"),
        user_role=current_user.get("role"),
        details=f"User {user['full_name']} profile updated",
    )
    
    return jsonify({"user": sanitize_user(user)})
