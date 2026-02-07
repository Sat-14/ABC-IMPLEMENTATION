import uuid
from datetime import datetime, timezone

from app.extensions import mongo

NOTIFICATION_TYPES = [
    "transfer_requested",
    "transfer_approved",
    "transfer_rejected",
    "transfer_completed",
    "integrity_failure",
    "evidence_uploaded",
]


def create_notification(user_id, type, title, message, link=None, metadata=None):
    """Create an in-app notification for a user."""
    notification = {
        "notification_id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": type,
        "title": title,
        "message": message,
        "link": link or "",
        "metadata": metadata or {},
        "is_read": False,
        "created_at": datetime.now(timezone.utc),
    }
    mongo.db.notifications.insert_one(notification)
    return _serialize(notification)


def get_notifications(user_id, page=1, per_page=20, unread_only=False):
    """Get notifications for a user."""
    query = {"user_id": user_id}
    if unread_only:
        query["is_read"] = False

    total = mongo.db.notifications.count_documents(query)
    notifications = list(
        mongo.db.notifications.find(query, {"_id": 0})
        .sort("created_at", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )

    return {
        "notifications": [_serialize(n) for n in notifications],
        "total": total,
        "unread_count": mongo.db.notifications.count_documents({"user_id": user_id, "is_read": False}),
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
    }


def mark_as_read(notification_id, user_id):
    """Mark a single notification as read."""
    result = mongo.db.notifications.update_one(
        {"notification_id": notification_id, "user_id": user_id},
        {"$set": {"is_read": True}},
    )
    return result.modified_count > 0


def mark_all_as_read(user_id):
    """Mark all notifications as read for a user."""
    result = mongo.db.notifications.update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True}},
    )
    return result.modified_count


def get_unread_count(user_id):
    """Get count of unread notifications."""
    return mongo.db.notifications.count_documents({"user_id": user_id, "is_read": False})


# -- Notification triggers (called from other modules) --

def notify_transfer_requested(to_user_id, from_user_name, evidence_name, evidence_id):
    create_notification(
        user_id=to_user_id,
        type="transfer_requested",
        title="Custody Transfer Request",
        message=f"{from_user_name} wants to transfer '{evidence_name}' to you.",
        link=f"/transfers",
        metadata={"evidence_id": evidence_id},
    )


def notify_transfer_approved(from_user_id, to_user_name, evidence_name):
    create_notification(
        user_id=from_user_id,
        type="transfer_approved",
        title="Transfer Approved",
        message=f"{to_user_name} approved the transfer of '{evidence_name}'. Complete the handoff.",
        link=f"/transfers",
    )


def notify_transfer_rejected(from_user_id, to_user_name, evidence_name):
    create_notification(
        user_id=from_user_id,
        type="transfer_rejected",
        title="Transfer Rejected",
        message=f"{to_user_name} rejected the transfer of '{evidence_name}'.",
        link=f"/transfers",
    )


def notify_transfer_completed(to_user_id, from_user_name, evidence_name, evidence_id):
    create_notification(
        user_id=to_user_id,
        type="transfer_completed",
        title="Transfer Completed",
        message=f"Custody of '{evidence_name}' has been transferred to you by {from_user_name}.",
        link=f"/evidence/{evidence_id}",
        metadata={"evidence_id": evidence_id},
    )


def notify_integrity_failure(custodian_id, evidence_name, evidence_id):
    create_notification(
        user_id=custodian_id,
        type="integrity_failure",
        title="Integrity Check Failed",
        message=f"Evidence '{evidence_name}' FAILED integrity verification. Possible tampering detected.",
        link=f"/evidence/{evidence_id}",
        metadata={"evidence_id": evidence_id},
    )


def _serialize(notification):
    if not notification:
        return None
    if isinstance(notification.get("created_at"), datetime):
        notification["created_at"] = notification["created_at"].isoformat()
    notification.pop("_id", None)
    return notification
