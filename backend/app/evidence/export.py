"""
CSV Export engine for evidence and audit data.

Generates CSV files for evidence lists, audit logs, and case data
for external compliance reporting.
"""

import csv
import io
from datetime import datetime

from app.extensions import mongo


def export_evidence_csv(case_id=None):
    """Export evidence list to CSV."""
    query = {}
    if case_id:
        query["case_id"] = case_id

    evidence = list(mongo.db.evidence.find(query, {"_id": 0, "file_path": 0}).sort("created_at", -1))

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Evidence ID", "File Name", "Category", "Classification",
        "Status", "Integrity Status", "Original Hash",
        "File Size (bytes)", "Case ID",
        "Uploaded By", "Current Custodian",
        "Latitude", "Longitude", "Collection Location",
        "Tags", "Description",
        "Created At", "Last Verified At",
    ])

    for e in evidence:
        # Resolve user names
        uploader = mongo.db.users.find_one({"user_id": e.get("uploaded_by")})
        custodian = mongo.db.users.find_one({"user_id": e.get("current_custodian_id")})

        writer.writerow([
            e.get("evidence_id", ""),
            e.get("file_name", ""),
            e.get("category", ""),
            e.get("classification", ""),
            e.get("status", ""),
            e.get("integrity_status", ""),
            e.get("original_hash", ""),
            e.get("file_size", 0),
            e.get("case_id", ""),
            uploader["full_name"] if uploader else "",
            custodian["full_name"] if custodian else "",
            e.get("latitude", ""),
            e.get("longitude", ""),
            e.get("collection_location", ""),
            ", ".join(e.get("tags", [])) if isinstance(e.get("tags"), list) else "",
            e.get("description", ""),
            _fmt_date(e.get("created_at")),
            _fmt_date(e.get("last_verified_at")),
        ])

    return output.getvalue()


def export_audit_csv():
    """Export audit logs to CSV."""
    logs = list(mongo.db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(5000))

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Log ID", "Action", "Entity Type", "Entity ID",
        "User Email", "User Role", "Details",
        "Hash", "Previous Hash", "Sequence",
        "Timestamp",
    ])

    for log in logs:
        writer.writerow([
            log.get("log_id", ""),
            log.get("action", ""),
            log.get("entity_type", ""),
            log.get("entity_id", ""),
            log.get("user_email", ""),
            log.get("user_role", ""),
            log.get("details", ""),
            log.get("hash", ""),
            log.get("previous_hash", ""),
            log.get("chain_sequence", ""),
            _fmt_date(log.get("timestamp")),
        ])

    return output.getvalue()


def export_cases_csv():
    """Export cases list to CSV."""
    cases = list(mongo.db.cases.find({}, {"_id": 0}).sort("created_at", -1))

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Case ID", "Case Number", "Title", "Description",
        "Status", "Created By", "Retention Days",
        "Closing Reason", "Closed By", "Closed At",
        "Created At", "Updated At",
    ])

    for c in cases:
        creator = mongo.db.users.find_one({"user_id": c.get("created_by")})
        writer.writerow([
            c.get("case_id", ""),
            c.get("case_number", ""),
            c.get("title", ""),
            c.get("description", ""),
            c.get("status", ""),
            creator["full_name"] if creator else c.get("created_by_name", ""),
            c.get("retention_days", ""),
            c.get("closing_reason", ""),
            c.get("closed_by_name", ""),
            _fmt_date(c.get("closed_at")),
            _fmt_date(c.get("created_at")),
            _fmt_date(c.get("updated_at")),
        ])

    return output.getvalue()


def _fmt_date(val):
    if isinstance(val, datetime):
        return val.isoformat()
    return val or ""
