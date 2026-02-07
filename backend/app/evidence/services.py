import hashlib
import os
import uuid
from datetime import datetime, timezone

from werkzeug.utils import secure_filename

from app.extensions import mongo


def compute_sha256(file_path):
    """Compute SHA-256 hash of a file by reading in chunks."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def store_evidence_file(file_obj, upload_folder):
    """Save uploaded file with UUID name. Returns (stored_path, original_name, file_size)."""
    original_name = secure_filename(file_obj.filename) or "unnamed"
    ext = os.path.splitext(original_name)[1]
    stored_name = f"{uuid.uuid4().hex}{ext}"

    # Organize by date
    date_folder = datetime.now(timezone.utc).strftime("%Y/%m/%d")
    target_dir = os.path.join(upload_folder, date_folder)
    os.makedirs(target_dir, exist_ok=True)

    file_path = os.path.join(target_dir, stored_name)
    file_obj.save(file_path)

    file_size = os.path.getsize(file_path)
    return file_path, original_name, file_size


def create_evidence(file_path, original_name, file_size, file_type, case_id,
                    category, classification, description, tags, uploaded_by_id):
    """Create evidence record with SHA-256 hash."""
    evidence_id = str(uuid.uuid4())
    original_hash = compute_sha256(file_path)

    evidence = {
        "evidence_id": evidence_id,
        "case_id": case_id,
        "file_name": original_name,
        "file_path": file_path,
        "file_size": file_size,
        "file_type": file_type or "application/octet-stream",
        "original_hash": original_hash,
        "current_hash": original_hash,
        "last_verified_at": datetime.now(timezone.utc),
        "integrity_status": "intact",
        "category": category or "other",
        "classification": classification or "internal",
        "description": description or "",
        "tags": [t.strip() for t in tags.split(",") if t.strip()] if isinstance(tags, str) else (tags or []),
        "current_custodian_id": uploaded_by_id,
        "uploaded_by": uploaded_by_id,
        "status": "active",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    mongo.db.evidence.insert_one(evidence)

    # Record initial hash
    record_hash(evidence_id, original_hash, "upload", uploaded_by_id)

    return _serialize(evidence)


def get_evidence_list(page=1, per_page=10, case_id=None, category=None,
                      status=None, search=None, custodian_id=None):
    query = {}
    if case_id:
        query["case_id"] = case_id
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    if custodian_id:
        query["current_custodian_id"] = custodian_id
    if search:
        query["$or"] = [
            {"file_name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    total = mongo.db.evidence.count_documents(query)
    evidence = list(
        mongo.db.evidence.find(query, {"_id": 0})
        .sort("created_at", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )

    # Enrich with custodian and uploader names
    for e in evidence:
        e = _enrich_evidence(e)

    return {
        "evidence": [_serialize(e) for e in evidence],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
    }


def get_evidence(evidence_id):
    ev = mongo.db.evidence.find_one({"evidence_id": evidence_id}, {"_id": 0})
    if ev:
        ev = _enrich_evidence(ev)
        return _serialize(ev)
    return None


def update_evidence(evidence_id, updates):
    allowed = {"description", "tags", "category", "classification", "status"}
    filtered = {k: v for k, v in updates.items() if k in allowed}
    if not filtered:
        return None
    if "tags" in filtered and isinstance(filtered["tags"], str):
        filtered["tags"] = [t.strip() for t in filtered["tags"].split(",") if t.strip()]
    filtered["updated_at"] = datetime.now(timezone.utc)
    mongo.db.evidence.update_one({"evidence_id": evidence_id}, {"$set": filtered})
    return get_evidence(evidence_id)


def verify_evidence_integrity(evidence_id, verified_by_id):
    """Re-hash the file and compare against original."""
    ev = mongo.db.evidence.find_one({"evidence_id": evidence_id})
    if not ev:
        return None

    current_hash = compute_sha256(ev["file_path"])
    matches = current_hash == ev["original_hash"]

    # Update evidence record
    mongo.db.evidence.update_one(
        {"evidence_id": evidence_id},
        {"$set": {
            "current_hash": current_hash,
            "integrity_status": "intact" if matches else "tampered",
            "last_verified_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }}
    )

    # Record hash
    record_hash(evidence_id, current_hash, "verification", verified_by_id, matches)

    return {
        "evidence_id": evidence_id,
        "current_hash": current_hash,
        "original_hash": ev["original_hash"],
        "matches": matches,
        "integrity_status": "intact" if matches else "tampered",
    }


def get_hash_history(evidence_id):
    records = list(
        mongo.db.hash_records.find({"evidence_id": evidence_id}, {"_id": 0})
        .sort("computed_at", -1)
    )
    for r in records:
        if isinstance(r.get("computed_at"), datetime):
            r["computed_at"] = r["computed_at"].isoformat()
    return records


def record_hash(evidence_id, hash_value, event_type, computed_by, matches_original=True):
    record = {
        "record_id": str(uuid.uuid4()),
        "evidence_id": evidence_id,
        "hash_value": hash_value,
        "algorithm": "sha256",
        "event_type": event_type,
        "computed_at": datetime.now(timezone.utc),
        "computed_by": computed_by,
        "matches_original": matches_original,
    }
    mongo.db.hash_records.insert_one(record)
    return record


def _enrich_evidence(ev):
    """Add custodian and uploader names."""
    if ev.get("current_custodian_id"):
        custodian = mongo.db.users.find_one({"user_id": ev["current_custodian_id"]})
        ev["custodian_name"] = custodian["full_name"] if custodian else "Unknown"
    if ev.get("uploaded_by"):
        uploader = mongo.db.users.find_one({"user_id": ev["uploaded_by"]})
        ev["uploaded_by_name"] = uploader["full_name"] if uploader else "Unknown"
    if ev.get("case_id"):
        case = mongo.db.cases.find_one({"case_id": ev["case_id"]})
        ev["case_number"] = case["case_number"] if case else None
    return ev


def _serialize(ev):
    if not ev:
        return None
    for field in ["created_at", "updated_at", "last_verified_at"]:
        if isinstance(ev.get(field), datetime):
            ev[field] = ev[field].isoformat()
    ev.pop("_id", None)
    # Don't expose file_path to the client
    ev.pop("file_path", None)
    return ev
