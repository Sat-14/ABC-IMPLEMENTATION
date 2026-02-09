"""
Analytics engine for dashboard charts.

Aggregates data from evidence, cases, transfers, and audit_logs
to provide chart-ready statistics.
"""

from datetime import datetime, timezone, timedelta
from collections import Counter

from app.extensions import mongo


def get_dashboard_analytics():
    """Return aggregated analytics for the dashboard."""
    now = datetime.now(timezone.utc)

    # --- Evidence by Category (Pie Chart) ---
    all_evidence = list(mongo.db.evidence.find(
        {}, {"category": 1, "integrity_status": 1, "status": 1,
             "created_at": 1, "file_size": 1, "_id": 0}
    ))
    category_counts = Counter(e.get("category", "other") for e in all_evidence)
    evidence_by_category = [
        {"name": cat, "value": count}
        for cat, count in category_counts.most_common()
    ]

    # --- Evidence by Integrity Status (Donut Chart) ---
    integrity_counts = Counter(e.get("integrity_status", "unverified") for e in all_evidence)
    evidence_by_integrity = [
        {"name": status, "value": count}
        for status, count in integrity_counts.most_common()
    ]

    # --- Uploads Over Time - Last 30 days (Area Chart) ---
    thirty_days_ago = now - timedelta(days=30)
    uploads_over_time = []
    for i in range(30):
        day = thirty_days_ago + timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = sum(
            1 for e in all_evidence
            if isinstance(e.get("created_at"), datetime)
            and day_start <= e["created_at"] < day_end
        )
        uploads_over_time.append({
            "date": day_start.strftime("%b %d"),
            "uploads": count,
        })

    # --- Transfers by Status (Bar Chart) ---
    all_transfers = list(mongo.db.custody_transfers.find(
        {}, {"status": 1, "_id": 0}
    ))
    transfer_counts = Counter(t.get("status", "unknown") for t in all_transfers)
    transfers_by_status = [
        {"name": status, "value": count}
        for status, count in transfer_counts.most_common()
    ]

    # --- Cases by Status ---
    all_cases = list(mongo.db.cases.find({}, {"status": 1, "_id": 0}))
    case_counts = Counter(c.get("status", "unknown") for c in all_cases)
    cases_by_status = [
        {"name": status, "value": count}
        for status, count in case_counts.most_common()
    ]

    # --- Activity over last 7 days (Bar chart) ---
    seven_days_ago = now - timedelta(days=7)
    recent_logs = list(mongo.db.audit_logs.find(
        {"timestamp": {"$gte": seven_days_ago}},
        {"action": 1, "timestamp": 1, "_id": 0}
    ))
    activity_by_day = []
    for i in range(7):
        day = seven_days_ago + timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = sum(
            1 for log in recent_logs
            if isinstance(log.get("timestamp"), datetime)
            and day_start <= log["timestamp"] < day_end
        )
        activity_by_day.append({
            "date": day_start.strftime("%a"),
            "actions": count,
        })

    # --- Summary stats ---
    total_evidence = len(all_evidence)
    total_cases = len(all_cases)
    total_transfers = len(all_transfers)
    total_storage = sum(e.get("file_size", 0) for e in all_evidence)
    active_evidence = sum(1 for e in all_evidence if e.get("status") == "active")
    tampered_count = integrity_counts.get("tampered", 0)

    return {
        "evidence_by_category": evidence_by_category,
        "evidence_by_integrity": evidence_by_integrity,
        "uploads_over_time": uploads_over_time,
        "transfers_by_status": transfers_by_status,
        "cases_by_status": cases_by_status,
        "activity_by_day": activity_by_day,
        "summary": {
            "total_evidence": total_evidence,
            "total_cases": total_cases,
            "total_transfers": total_transfers,
            "total_storage_bytes": total_storage,
            "active_evidence": active_evidence,
            "tampered_count": tampered_count,
        },
    }
