import uuid
from datetime import datetime, timezone

import bcrypt
from app.extensions import mongo


def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password, password_hash):
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_user(email, password, full_name, role, department=""):
    user_id = str(uuid.uuid4())
    user = {
        "user_id": user_id,
        "email": email.lower().strip(),
        "password_hash": hash_password(password),
        "full_name": full_name,
        "role": role,
        "department": department,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    mongo.db.users.insert_one(user)
    return sanitize_user(user)


def find_user_by_email(email):
    return mongo.db.users.find_one({"email": email.lower().strip()})


def find_user_by_id(user_id):
    return mongo.db.users.find_one({"user_id": user_id})


def get_all_users():
    users = mongo.db.users.find({"is_active": True})
    return [sanitize_user(u) for u in users]


def update_user(user_id, updates):
    allowed = {"role", "is_active", "department", "full_name"}
    filtered = {k: v for k, v in updates.items() if k in allowed}
    if not filtered:
        return None
    filtered["updated_at"] = datetime.now(timezone.utc)
    mongo.db.users.update_one({"user_id": user_id}, {"$set": filtered})
    return find_user_by_id(user_id)


def sanitize_user(user):
    """Remove sensitive fields from user dict."""
    if not user:
        return None
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "department": user.get("department", ""),
        "is_active": user.get("is_active", True),
        "created_at": user["created_at"].isoformat() if isinstance(user["created_at"], datetime) else user["created_at"],
    }
