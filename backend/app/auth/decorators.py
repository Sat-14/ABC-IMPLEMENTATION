from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.common.constants import ROLE_PERMISSIONS


def role_required(*allowed_roles):
    """Decorator that checks if the current user has one of the allowed roles."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            from app.auth.services import find_user_by_id
            user = find_user_by_id(user_id)
            if not user or user["role"] not in allowed_roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def permission_required(permission):
    """Decorator that checks if user's role grants a specific permission."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            from app.auth.services import find_user_by_id
            user = find_user_by_id(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Helper to get permissions for a role
            # We need to import this here to avoid circular imports if possible, 
            # or ensure ROLE_PERMISSIONS is available. 
            # It is imported at top level, so it's fine.
            from app.common.constants import ROLE_PERMISSIONS
            
            user_permissions = ROLE_PERMISSIONS.get(user["role"], set())
            if permission not in user_permissions:
                return jsonify({"error": "Permission denied"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
