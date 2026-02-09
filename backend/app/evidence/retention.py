"""
Evidence Retention & Disposal Policy Engine.

Checks evidence against case retention policies and flags items
that have exceeded their retention period for disposal review.
"""

from datetime import datetime, timezone, timedelta

from app.extensions import mongo


# Default retention periods by case status (days)
DEFAULT_RETENTION = {
    "open": None,       # No auto-disposal while case is open
    "closed": 365,      # 1 year after case closure
    "archived": 180,    # 6 months after archival
}


def check_retention():
    """Scan all evidence and flag items that exceed retention policies."""
    now = datetime.now(timezone.utc)
    flagged = []
    stats = {"total_checked": 0, "flagged_for_review": 0, "already_disposed": 0}

    all_evidence = list(mongo.db.evidence.find(
        {"status": {"$ne": "disposed"}}, {"_id": 0}
    ))
    stats["total_checked"] = len(all_evidence)

    # Build case lookup
    case_ids = list(set(e.get("case_id") for e in all_evidence if e.get("case_id")))
    cases = {c["case_id"]: c for c in mongo.db.cases.find(
        {"case_id": {"$in": case_ids}}, {"_id": 0}
    )}

    for ev in all_evidence:
        case = cases.get(ev.get("case_id"), {})
        case_status = case.get("status", "open")

        # Use case-level override or default
        retention_days = case.get("retention_days")
        if retention_days is None:
            retention_days = DEFAULT_RETENTION.get(case_status)

        if retention_days is None:
            continue  # No retention policy (open case)

        # Determine reference date
        if case_status == "closed":
            ref_date = case.get("closed_at")
            if isinstance(ref_date, str):
                try:
                    ref_date = datetime.fromisoformat(ref_date.replace("Z", "+00:00"))
                except ValueError:
                    ref_date = None
        else:
            ref_date = ev.get("created_at")

        if not isinstance(ref_date, datetime):
            continue

        if ref_date.tzinfo is None:
            ref_date = ref_date.replace(tzinfo=timezone.utc)

        expiry_date = ref_date + timedelta(days=retention_days)
        days_until = (expiry_date - now).days

        if days_until <= 30:  # Flag if within 30 days of expiry or past
            expired = days_until <= 0
            flagged.append({
                "evidence_id": ev.get("evidence_id"),
                "file_name": ev.get("file_name"),
                "case_id": ev.get("case_id"),
                "case_number": case.get("case_number", "Unknown"),
                "case_status": case_status,
                "retention_days": retention_days,
                "expiry_date": expiry_date.isoformat(),
                "days_remaining": max(0, days_until),
                "expired": expired,
                "status": "expired" if expired else "expiring_soon",
                "evidence_status": ev.get("status"),
                "integrity_status": ev.get("integrity_status"),
            })
            stats["flagged_for_review"] += 1

    disposed = mongo.db.evidence.count_documents({"status": "disposed"})
    stats["already_disposed"] = disposed

    # Sort: expired first, then by days remaining
    flagged.sort(key=lambda x: (not x["expired"], x["days_remaining"]))

    return {
        "flagged_evidence": flagged,
        "statistics": stats,
        "retention_policies": DEFAULT_RETENTION,
        "checked_at": now.isoformat(),
    }


def dispose_evidence(evidence_id, disposed_by_id, reason):
    """Mark evidence as disposed with audit trail."""
    now = datetime.now(timezone.utc)

    ev = mongo.db.evidence.find_one({"evidence_id": evidence_id})
    if not ev:
        return None

    if ev.get("status") == "disposed":
        return {"error": "Evidence is already disposed"}

    mongo.db.evidence.update_one(
        {"evidence_id": evidence_id},
        {"$set": {
            "status": "disposed",
            "disposed_at": now,
            "disposed_by": disposed_by_id,
            "disposal_reason": reason,
            "updated_at": now,
        }}
    )

    from app.auth.services import find_user_by_id
    user = find_user_by_id(disposed_by_id)

    from app.audit.services import log_action
    log_action(
        action="evidence_disposed",
        entity_type="evidence",
        entity_id=evidence_id,
        user_id=disposed_by_id,
        user_email=user["email"] if user else "unknown",
        user_role=user["role"] if user else "unknown",
        details=f"Disposed evidence {ev.get('file_name')} - Reason: {reason}",
        metadata={"reason": reason},
    )

    return {"evidence_id": evidence_id, "status": "disposed", "disposed_at": now.isoformat()}
