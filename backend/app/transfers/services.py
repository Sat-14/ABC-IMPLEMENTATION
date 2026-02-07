import hashlib
import uuid
from datetime import datetime, timezone

from app.common.errors import APIError, ForbiddenError, NotFoundError
from app.extensions import mongo


def create_transfer(evidence_id, from_user_id, to_user_id, reason):
    """Create a custody transfer request."""
    # Verify evidence exists and requester is current custodian
    evidence = mongo.db.evidence.find_one({"evidence_id": evidence_id})
    if not evidence:
        raise NotFoundError("Evidence not found")

    if evidence["current_custodian_id"] != from_user_id:
        raise ForbiddenError("Only the current custodian can initiate a transfer")

    if evidence["status"] != "active":
        raise APIError("Cannot transfer evidence that is not active")

    # Verify target user exists
    to_user = mongo.db.users.find_one({"user_id": to_user_id})
    if not to_user:
        raise NotFoundError("Target user not found")

    if from_user_id == to_user_id:
        raise APIError("Cannot transfer to yourself")

    # Check for existing pending transfer for this evidence
    existing = mongo.db.custody_transfers.find_one({
        "evidence_id": evidence_id,
        "status": "pending",
    })
    if existing:
        raise APIError("A pending transfer already exists for this evidence")

    transfer_id = str(uuid.uuid4())
    transfer = {
        "transfer_id": transfer_id,
        "evidence_id": evidence_id,
        "from_user_id": from_user_id,
        "to_user_id": to_user_id,
        "reason": reason,
        "status": "pending",
        "requested_at": datetime.now(timezone.utc),
        "responded_at": None,
        "completed_at": None,
        "from_signature": None,
        "to_signature": None,
        "notes": "",
    }

    mongo.db.custody_transfers.insert_one(transfer)
    return _serialize(_enrich_transfer(transfer))


def approve_transfer(transfer_id, user_id):
    """Approve a pending transfer (by the recipient)."""
    transfer = mongo.db.custody_transfers.find_one({"transfer_id": transfer_id})
    if not transfer:
        raise NotFoundError("Transfer not found")

    if transfer["status"] != "pending":
        raise APIError(f"Transfer is {transfer['status']}, not pending")

    if transfer["to_user_id"] != user_id:
        raise ForbiddenError("Only the recipient can approve a transfer")

    now = datetime.now(timezone.utc)
    signature = _compute_signature(user_id, transfer_id, now)

    mongo.db.custody_transfers.update_one(
        {"transfer_id": transfer_id},
        {"$set": {
            "status": "approved",
            "responded_at": now,
            "to_signature": signature,
        }}
    )

    transfer["status"] = "approved"
    return _serialize(_enrich_transfer(transfer))


def reject_transfer(transfer_id, user_id):
    """Reject a pending transfer (by the recipient)."""
    transfer = mongo.db.custody_transfers.find_one({"transfer_id": transfer_id})
    if not transfer:
        raise NotFoundError("Transfer not found")

    if transfer["status"] != "pending":
        raise APIError(f"Transfer is {transfer['status']}, not pending")

    if transfer["to_user_id"] != user_id:
        raise ForbiddenError("Only the recipient can reject a transfer")

    mongo.db.custody_transfers.update_one(
        {"transfer_id": transfer_id},
        {"$set": {"status": "rejected", "responded_at": datetime.now(timezone.utc)}}
    )

    transfer["status"] = "rejected"
    return _serialize(_enrich_transfer(transfer))


def complete_transfer(transfer_id, user_id):
    """Complete an approved transfer (by the sender), updating custody."""
    transfer = mongo.db.custody_transfers.find_one({"transfer_id": transfer_id})
    if not transfer:
        raise NotFoundError("Transfer not found")

    if transfer["status"] != "approved":
        raise APIError(f"Transfer must be approved first (currently: {transfer['status']})")

    if transfer["from_user_id"] != user_id:
        raise ForbiddenError("Only the sender can complete a transfer")

    now = datetime.now(timezone.utc)
    signature = _compute_signature(user_id, transfer_id, now)

    # Update transfer
    mongo.db.custody_transfers.update_one(
        {"transfer_id": transfer_id},
        {"$set": {
            "status": "completed",
            "completed_at": now,
            "from_signature": signature,
        }}
    )

    # Update evidence custodian
    mongo.db.evidence.update_one(
        {"evidence_id": transfer["evidence_id"]},
        {"$set": {
            "current_custodian_id": transfer["to_user_id"],
            "updated_at": now,
        }}
    )

    # Record hash at transfer
    from app.evidence.services import compute_sha256, record_hash
    evidence = mongo.db.evidence.find_one({"evidence_id": transfer["evidence_id"]})
    if evidence:
        current_hash = compute_sha256(evidence["file_path"])
        matches = current_hash == evidence["original_hash"]
        record_hash(transfer["evidence_id"], current_hash, "transfer", user_id, matches)

    transfer["status"] = "completed"
    return _serialize(_enrich_transfer(transfer))


def cancel_transfer(transfer_id, user_id):
    """Cancel a pending transfer (by the sender)."""
    transfer = mongo.db.custody_transfers.find_one({"transfer_id": transfer_id})
    if not transfer:
        raise NotFoundError("Transfer not found")

    if transfer["status"] != "pending":
        raise APIError(f"Can only cancel pending transfers (currently: {transfer['status']})")

    if transfer["from_user_id"] != user_id:
        raise ForbiddenError("Only the sender can cancel a transfer")

    mongo.db.custody_transfers.update_one(
        {"transfer_id": transfer_id},
        {"$set": {"status": "cancelled", "responded_at": datetime.now(timezone.utc)}}
    )

    transfer["status"] = "cancelled"
    return _serialize(_enrich_transfer(transfer))


def get_transfers(page=1, per_page=10, from_user=None, to_user=None, status=None, evidence_id=None):
    query = {}
    if from_user:
        query["from_user_id"] = from_user
    if to_user:
        query["to_user_id"] = to_user
    if status:
        query["status"] = status
    if evidence_id:
        query["evidence_id"] = evidence_id

    total = mongo.db.custody_transfers.count_documents(query)
    transfers = list(
        mongo.db.custody_transfers.find(query, {"_id": 0})
        .sort("requested_at", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )

    return {
        "transfers": [_serialize(_enrich_transfer(t)) for t in transfers],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
    }


def get_transfer(transfer_id):
    transfer = mongo.db.custody_transfers.find_one({"transfer_id": transfer_id}, {"_id": 0})
    if not transfer:
        return None
    return _serialize(_enrich_transfer(transfer))


def _compute_signature(user_id, transfer_id, timestamp):
    """Simple HMAC-like signature for MVP."""
    data = f"{user_id}|{transfer_id}|{timestamp.isoformat()}"
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def _enrich_transfer(transfer):
    """Add user names and evidence name."""
    from_user = mongo.db.users.find_one({"user_id": transfer.get("from_user_id")})
    to_user = mongo.db.users.find_one({"user_id": transfer.get("to_user_id")})
    evidence = mongo.db.evidence.find_one({"evidence_id": transfer.get("evidence_id")})

    transfer["from_user_name"] = from_user["full_name"] if from_user else "Unknown"
    transfer["to_user_name"] = to_user["full_name"] if to_user else "Unknown"
    transfer["evidence_name"] = evidence["file_name"] if evidence else "Unknown"
    return transfer


def _serialize(transfer):
    if not transfer:
        return None
    for field in ["requested_at", "responded_at", "completed_at"]:
        val = transfer.get(field)
        if isinstance(val, datetime):
            transfer[field] = val.isoformat()
    transfer.pop("_id", None)
    return transfer
