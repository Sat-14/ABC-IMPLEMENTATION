"""
AI-Generated Audit Summary Engine.

Template-based natural language generation that converts raw audit logs
into human-readable, court-friendly narratives with risk analysis.
"""

from collections import Counter
from datetime import datetime, timezone

from app.extensions import mongo


def generate_evidence_summary(evidence_id):
    """Generate a template-based NLG summary for an evidence item."""
    ev = mongo.db.evidence.find_one({"evidence_id": evidence_id}, {"_id": 0})
    if not ev:
        return None

    audit_logs = list(
        mongo.db.audit_logs.find(
            {"entity_type": "evidence", "entity_id": evidence_id}, {"_id": 0}
        ).sort("timestamp", 1)
    )
    hash_records = list(
        mongo.db.hash_records.find({"evidence_id": evidence_id}, {"_id": 0})
        .sort("computed_at", 1)
    )
    transfers = list(
        mongo.db.custody_transfers.find({"evidence_id": evidence_id}, {"_id": 0})
        .sort("requested_at", 1)
    )

    # Enrich names
    uploader = mongo.db.users.find_one({"user_id": ev.get("uploaded_by")})
    custodian = mongo.db.users.find_one({"user_id": ev.get("current_custodian_id")})

    uploader_name = (uploader.get("full_name") or uploader.get("email")) if uploader else "Unknown"
    custodian_name = (custodian.get("full_name") or custodian.get("email")) if custodian else "Unknown"

    statistics = _compute_statistics(audit_logs, hash_records, transfers)
    key_events = _identify_key_events(ev, audit_logs, hash_records, transfers)
    risk_flags = _identify_risk_flags(ev, audit_logs, hash_records, transfers)

    summary_text = _build_summary_text(ev, statistics, uploader_name, custodian_name)
    custody_narrative = _build_custody_narrative(ev, transfers, custodian_name)
    integrity_narrative = _build_integrity_narrative(ev, hash_records)

    return {
        "evidence_id": evidence_id,
        "evidence_name": ev.get("file_name", "Unknown"),
        "summary_text": summary_text,
        "key_events": key_events,
        "statistics": statistics,
        "risk_flags": risk_flags,
        "custody_narrative": custody_narrative,
        "integrity_narrative": integrity_narrative,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# Statistics
# ---------------------------------------------------------------------------

def _compute_statistics(audit_logs, hash_records, transfers):
    verifications = [r for r in hash_records if r.get("event_type") == "verification"]
    action_counts = Counter(log.get("action", "unknown") for log in audit_logs)
    unique_users = len(set(log.get("user_id") for log in audit_logs if log.get("user_id")))

    timestamps = []
    for log in audit_logs:
        ts = log.get("timestamp")
        if isinstance(ts, datetime):
            timestamps.append(ts)
        elif isinstance(ts, str):
            try:
                timestamps.append(datetime.fromisoformat(ts.replace("Z", "+00:00")))
            except ValueError:
                pass

    first_action = min(timestamps).isoformat() if timestamps else None
    last_action = max(timestamps).isoformat() if timestamps else None
    time_span_days = int((max(timestamps) - min(timestamps)).total_seconds() / 86400) if len(timestamps) >= 2 else 0

    return {
        "total_actions": len(audit_logs),
        "total_verifications": len(verifications),
        "total_transfers": len(transfers),
        "unique_users": unique_users,
        "first_action": first_action,
        "last_action": last_action,
        "time_span_days": time_span_days,
        "actions_by_type": dict(action_counts),
    }


# ---------------------------------------------------------------------------
# Key Events
# ---------------------------------------------------------------------------

def _identify_key_events(ev, audit_logs, hash_records, transfers):
    events = []

    # Upload event
    created_at = ev.get("created_at")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()
    events.append({
        "type": "upload",
        "description": f"Evidence \"{ev.get('file_name')}\" was uploaded and registered in the system.",
        "timestamp": created_at,
        "significance": "high",
    })

    # Verifications
    verifications = [r for r in hash_records if r.get("event_type") == "verification"]
    for v in verifications:
        ts = v.get("computed_at")
        if isinstance(ts, datetime):
            ts = ts.isoformat()
        matched = v.get("matches_original", True)
        events.append({
            "type": "verification",
            "description": f"Integrity verification {'PASSED - hash matches original' if matched else 'FAILED - HASH MISMATCH DETECTED'}.",
            "timestamp": ts,
            "significance": "high" if not matched else "medium",
        })

    # Transfers
    for t in transfers:
        ts = t.get("requested_at")
        if isinstance(ts, datetime):
            ts = ts.isoformat()
        status = t.get("status", "unknown")
        from_user = mongo.db.users.find_one({"user_id": t.get("from_user_id")})
        to_user = mongo.db.users.find_one({"user_id": t.get("to_user_id")})
        from_name = (from_user.get("full_name") if from_user else "Unknown")
        to_name = (to_user.get("full_name") if to_user else "Unknown")

        significance = "high" if status in ("rejected", "completed") else "medium"
        events.append({
            "type": "transfer",
            "description": f"Custody transfer {status}: {from_name} to {to_name}. Reason: {t.get('reason', 'N/A')}",
            "timestamp": ts,
            "significance": significance,
        })

    # Sort by significance (high first), then timestamp
    sig_order = {"high": 0, "medium": 1, "low": 2}
    events.sort(key=lambda e: (sig_order.get(e["significance"], 2), e.get("timestamp") or ""))

    return events


# ---------------------------------------------------------------------------
# Risk Flags
# ---------------------------------------------------------------------------

def _identify_risk_flags(ev, audit_logs, hash_records, transfers):
    flags = []
    verifications = [r for r in hash_records if r.get("event_type") == "verification"]

    if ev.get("integrity_status") == "tampered":
        flags.append({
            "level": "high",
            "message": "Evidence integrity is COMPROMISED - hash mismatch detected.",
            "recommendation": "Investigate immediately. Compare with backup copies if available and document findings.",
        })

    if len(verifications) == 0:
        flags.append({
            "level": "high",
            "message": "Evidence has never been independently verified since upload.",
            "recommendation": "Run an integrity verification to confirm the evidence has not been tampered with.",
        })

    if verifications:
        last_ts = verifications[-1].get("computed_at")
        if isinstance(last_ts, str):
            try:
                last_ts = datetime.fromisoformat(last_ts.replace("Z", "+00:00"))
            except ValueError:
                last_ts = None
        if isinstance(last_ts, datetime):
            if last_ts.tzinfo is None:
                last_ts = last_ts.replace(tzinfo=timezone.utc)
            days = (datetime.now(timezone.utc) - last_ts).total_seconds() / 86400
            if days > 30:
                flags.append({
                    "level": "medium",
                    "message": f"Last verification was {int(days)} days ago.",
                    "recommendation": "Re-verify evidence integrity to ensure it remains unaltered.",
                })

    rejected = [t for t in transfers if t.get("status") == "rejected"]
    if rejected:
        flags.append({
            "level": "medium",
            "message": f"{len(rejected)} custody transfer(s) were rejected.",
            "recommendation": "Review transfer rejection reasons to ensure no procedural concerns.",
        })

    if len(audit_logs) < 3 and len(audit_logs) > 0:
        first_ts = audit_logs[0].get("timestamp")
        if isinstance(first_ts, str):
            try:
                first_ts = datetime.fromisoformat(first_ts.replace("Z", "+00:00"))
            except ValueError:
                first_ts = None
        if isinstance(first_ts, datetime):
            if first_ts.tzinfo is None:
                first_ts = first_ts.replace(tzinfo=timezone.utc)
            days = (datetime.now(timezone.utc) - first_ts).total_seconds() / 86400
            if days > 7:
                flags.append({
                    "level": "low",
                    "message": "Sparse audit trail relative to evidence age.",
                    "recommendation": "Ensure all interactions with this evidence are being logged properly.",
                })

    return flags


# ---------------------------------------------------------------------------
# Narrative Builders
# ---------------------------------------------------------------------------

def _build_summary_text(ev, statistics, uploader_name, custodian_name):
    name = ev.get("file_name", "Unknown")
    short_id = ev.get("evidence_id", "")[:8]
    status = ev.get("integrity_status", "unverified")

    created_at = ev.get("created_at")
    if isinstance(created_at, datetime):
        upload_date = created_at.strftime("%B %d, %Y at %I:%M %p UTC")
    elif isinstance(created_at, str):
        try:
            dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            upload_date = dt.strftime("%B %d, %Y at %I:%M %p UTC")
        except ValueError:
            upload_date = created_at
    else:
        upload_date = "an unknown date"

    # Opening
    if status == "tampered":
        opening = (
            f"WARNING: Evidence \"{name}\" (ID: {short_id}...) was uploaded on {upload_date} "
            f"by {uploader_name}, but its integrity has been COMPROMISED. "
            f"Immediate investigation is recommended."
        )
    elif status == "intact":
        opening = (
            f"Evidence \"{name}\" (ID: {short_id}...) was uploaded on {upload_date} "
            f"by {uploader_name} and has maintained its integrity throughout its lifecycle."
        )
    else:
        opening = (
            f"Evidence \"{name}\" (ID: {short_id}...) was uploaded on {upload_date} "
            f"by {uploader_name}. Its integrity has not yet been independently verified."
        )

    # Activity
    total = statistics["total_actions"]
    users = statistics["unique_users"]
    days = statistics["time_span_days"]
    if total > 0:
        activity = (
            f" Over {days} day(s), {total} actions have been recorded involving "
            f"{users} unique user(s)."
        )
    else:
        activity = " No audit trail activity has been recorded."

    # Custodian
    custodian_text = f" The evidence is currently in the custody of {custodian_name}."

    return opening + activity + custodian_text


def _build_custody_narrative(ev, transfers, custodian_name):
    if not transfers:
        return (
            f"The evidence has remained with a single custodian ({custodian_name}) "
            f"since upload, indicating a simple and well-controlled chain of custody."
        )

    completed = sum(1 for t in transfers if t.get("status") == "completed")
    rejected = sum(1 for t in transfers if t.get("status") == "rejected")
    cancelled = sum(1 for t in transfers if t.get("status") == "cancelled")
    pending = sum(1 for t in transfers if t.get("status") == "pending")
    total = len(transfers)

    if rejected == 0 and cancelled == 0 and pending == 0:
        return (
            f"The evidence has been transferred {completed} time(s) between custodians, "
            f"with all transfers properly completed through the formal approval workflow. "
            f"The current custodian is {custodian_name}. The custody chain is unbroken."
        )

    issues = []
    if rejected:
        issues.append(f"{rejected} rejected")
    if cancelled:
        issues.append(f"{cancelled} cancelled")
    if pending:
        issues.append(f"{pending} still pending")

    return (
        f"The evidence has been involved in {total} transfer(s). "
        f"Of these, {completed} were completed successfully, while {', '.join(issues)}. "
        f"Transfer irregularities may warrant additional scrutiny. "
        f"The current custodian is {custodian_name}."
    )


def _build_integrity_narrative(ev, hash_records):
    verifications = [r for r in hash_records if r.get("event_type") == "verification"]
    count = len(verifications)
    status = ev.get("integrity_status", "unverified")

    original_hash = ev.get("original_hash", "")
    short_hash = original_hash[:16] + "..." if original_hash else "N/A"

    if count == 0:
        return (
            f"The original SHA-256 hash ({short_hash}) was computed at the time of upload. "
            f"However, no independent verification has been performed since. "
            f"It is strongly recommended to verify integrity before any legal proceedings."
        )

    # Check if any verification failed
    failures = [r for r in verifications if not r.get("matches_original", True)]

    if failures:
        last_fail = failures[-1]
        ts = last_fail.get("computed_at")
        if isinstance(ts, datetime):
            ts = ts.strftime("%B %d, %Y")
        return (
            f"CRITICAL: The evidence has been verified {count} time(s), and at least one "
            f"verification (on {ts}) detected a hash mismatch. This indicates the file may have "
            f"been altered after its initial upload. The original hash was {short_hash}. "
            f"This evidence should be treated with extreme caution in legal proceedings."
        )

    last_ts = verifications[-1].get("computed_at")
    if isinstance(last_ts, datetime):
        last_date = last_ts.strftime("%B %d, %Y")
    elif isinstance(last_ts, str):
        try:
            last_date = datetime.fromisoformat(last_ts.replace("Z", "+00:00")).strftime("%B %d, %Y")
        except ValueError:
            last_date = last_ts
    else:
        last_date = "an unknown date"

    return (
        f"The evidence has been verified {count} time(s), most recently on {last_date}. "
        f"All verifications confirmed that the current hash matches the original ({short_hash}), "
        f"demonstrating that the file has not been altered since its initial upload. "
        f"The integrity chain is intact and suitable for court submission."
    )
