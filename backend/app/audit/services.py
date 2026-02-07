import hashlib
import uuid
from datetime import datetime, timezone

from flask import has_request_context, request

from app.extensions import mongo

GENESIS_HASH = "GENESIS_0000000000000000000000000000000000000000000000000000000000000000"


def log_action(action, entity_type, entity_id, user_id, user_email, user_role, details, metadata=None):
    """
    Append a new entry to the audit log with hash chaining.
    This is the ONLY function that writes to audit_logs.
    """
    db = mongo.db

    # Get the last log entry for chaining
    last_entry = db.audit_logs.find_one(sort=[("chain_sequence", -1)])

    if last_entry:
        previous_hash = last_entry["hash_of_entry"]
        sequence = last_entry["chain_sequence"] + 1
    else:
        previous_hash = GENESIS_HASH
        sequence = 1

    timestamp = datetime.now(timezone.utc)
    timestamp_iso = timestamp.isoformat()

    # Deterministic hash input
    hash_input = f"{action}|{entity_id}|{user_id}|{details}|{timestamp_iso}|{previous_hash}"
    hash_of_entry = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()

    # Get request context info if available
    ip_address = "system"
    user_agent = "system"
    if has_request_context():
        ip_address = request.remote_addr or "unknown"
        user_agent = request.headers.get("User-Agent", "unknown")

    log_entry = {
        "log_id": str(uuid.uuid4()),
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "user_id": user_id,
        "user_email": user_email,
        "user_role": user_role,
        "details": details,
        "metadata": metadata or {},
        "ip_address": ip_address,
        "user_agent": user_agent,
        "hash_of_entry": hash_of_entry,
        "previous_log_hash": previous_hash,
        "chain_sequence": sequence,
        "timestamp": timestamp,
    }

    db.audit_logs.insert_one(log_entry)
    return log_entry


def get_audit_logs(page=1, per_page=20, entity_type=None, entity_id=None, action=None, user_id=None):
    """Fetch audit logs with optional filters and pagination."""
    db = mongo.db
    query = {}

    if entity_type:
        query["entity_type"] = entity_type
    if entity_id:
        query["entity_id"] = entity_id
    if action:
        query["action"] = action
    if user_id:
        query["user_id"] = user_id

    total = db.audit_logs.count_documents(query)
    logs = list(
        db.audit_logs.find(query, {"_id": 0})
        .sort("timestamp", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )

    # Convert datetime objects to ISO strings
    for log in logs:
        if isinstance(log.get("timestamp"), datetime):
            log["timestamp"] = log["timestamp"].isoformat()

    return {
        "logs": logs,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
    }


def verify_chain_integrity():
    """Walk the entire audit chain and verify all hashes."""
    db = mongo.db
    entries = list(db.audit_logs.find().sort("chain_sequence", 1))

    if not entries:
        return {"intact": True, "total_entries": 0}

    expected_previous = GENESIS_HASH

    for entry in entries:
        # Recompute hash
        timestamp_iso = entry["timestamp"].isoformat() if isinstance(entry["timestamp"], datetime) else entry["timestamp"]
        hash_input = f"{entry['action']}|{entry['entity_id']}|{entry['user_id']}|{entry['details']}|{timestamp_iso}|{entry['previous_log_hash']}"
        computed_hash = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()

        # Check previous hash link
        if entry["previous_log_hash"] != expected_previous:
            return {
                "intact": False,
                "broken_at": entry["chain_sequence"],
                "error": "Previous hash mismatch",
                "total_entries": len(entries),
            }

        # Check self hash
        if entry["hash_of_entry"] != computed_hash:
            return {
                "intact": False,
                "broken_at": entry["chain_sequence"],
                "error": "Entry hash mismatch (data tampered)",
                "total_entries": len(entries),
            }

        expected_previous = entry["hash_of_entry"]

    return {"intact": True, "total_entries": len(entries)}
