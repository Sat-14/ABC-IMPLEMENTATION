import io
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.extensions import mongo


def generate_evidence_report(evidence_id):
    """Generate a Chain of Custody PDF report for a single piece of evidence."""
    ev = mongo.db.evidence.find_one({"evidence_id": evidence_id}, {"_id": 0})
    if not ev:
        return None

    # Gather related data
    case = mongo.db.cases.find_one({"case_id": ev.get("case_id")}, {"_id": 0})
    hash_records = list(
        mongo.db.hash_records.find({"evidence_id": evidence_id}, {"_id": 0})
        .sort("computed_at", 1)
    )
    transfers = list(
        mongo.db.custody_transfers.find({"evidence_id": evidence_id}, {"_id": 0})
        .sort("requested_at", 1)
    )
    audit_logs = list(
        mongo.db.audit_logs.find(
            {"entity_type": "evidence", "entity_id": evidence_id}, {"_id": 0}
        ).sort("timestamp", 1)
    )

    # Enrich names
    custodian = mongo.db.users.find_one({"user_id": ev.get("current_custodian_id")})
    uploader = mongo.db.users.find_one({"user_id": ev.get("uploaded_by")})

    # Build PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=20 * mm, bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("CustomTitle", parent=styles["Title"], fontSize=18, spaceAfter=6)
    subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"], fontSize=10, textColor=colors.gray)
    heading_style = ParagraphStyle("Heading", parent=styles["Heading2"], fontSize=13, spaceBefore=14, spaceAfter=6)
    normal_style = styles["Normal"]
    small_style = ParagraphStyle("Small", parent=styles["Normal"], fontSize=8, textColor=colors.gray)
    mono_style = ParagraphStyle("Mono", parent=styles["Normal"], fontName="Courier", fontSize=8)

    elements = []

    # Header
    elements.append(Paragraph("CHAIN OF CUSTODY REPORT", title_style))
    elements.append(Paragraph("Digital Chain of Custody System - Official Record", subtitle_style))
    elements.append(Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", subtitle_style))
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#2563eb")))
    elements.append(Spacer(1, 10))

    # Evidence Details
    elements.append(Paragraph("Evidence Details", heading_style))
    ev_data = [
        ["Evidence ID", ev.get("evidence_id", "N/A")],
        ["File Name", ev.get("file_name", "N/A")],
        ["File Size", _format_size(ev.get("file_size", 0))],
        ["File Type", ev.get("file_type", "N/A")],
        ["Category", (ev.get("category", "N/A") or "N/A").replace("_", " ").title()],
        ["Classification", (ev.get("classification", "N/A") or "N/A").title()],
        ["Status", (ev.get("status", "N/A") or "N/A").title()],
        ["Description", ev.get("description", "N/A") or "N/A"],
        ["Tags", ", ".join(ev.get("tags", [])) or "None"],
        ["Uploaded By", uploader["full_name"] if uploader else "Unknown"],
        ["Current Custodian", custodian["full_name"] if custodian else "Unknown"],
        ["Upload Date", _fmt_date(ev.get("created_at"))],
    ]
    elements.append(_make_detail_table(ev_data))
    elements.append(Spacer(1, 6))

    # Case Information
    if case:
        elements.append(Paragraph("Case Information", heading_style))
        case_data = [
            ["Case Number", case.get("case_number", "N/A")],
            ["Title", case.get("title", "N/A")],
            ["Status", (case.get("status", "N/A") or "N/A").title()],
            ["Description", case.get("description", "N/A") or "N/A"],
        ]
        elements.append(_make_detail_table(case_data))
        elements.append(Spacer(1, 6))

    # Hash Information
    elements.append(Paragraph("Integrity Verification", heading_style))
    integrity = ev.get("integrity_status", "unverified")
    integrity_color = {"intact": "GREEN - INTACT", "tampered": "RED - TAMPERED", "unverified": "UNVERIFIED"}
    elements.append(Paragraph(
        f"<b>Current Integrity Status:</b> {integrity_color.get(integrity, integrity.upper())}",
        normal_style
    ))
    elements.append(Spacer(1, 4))

    hash_data = [
        ["Original Hash (SHA-256)", ev.get("original_hash", "N/A")],
        ["Current Hash", ev.get("current_hash", "N/A")],
        ["Last Verified", _fmt_date(ev.get("last_verified_at"))],
    ]
    elements.append(_make_detail_table(hash_data))
    elements.append(Spacer(1, 6))

    # Hash History
    if hash_records:
        elements.append(Paragraph("Hash History", heading_style))
        hash_table_data = [["#", "Hash Value", "Event", "Date", "Match"]]
        for i, r in enumerate(hash_records, 1):
            hash_table_data.append([
                str(i),
                r.get("hash_value", "")[:32] + "...",
                r.get("event_type", "N/A"),
                _fmt_date(r.get("computed_at")),
                "Yes" if r.get("matches_original") else "NO",
            ])
        elements.append(_make_data_table(hash_table_data))
        elements.append(Spacer(1, 6))

    # Custody Transfer Timeline
    if transfers:
        elements.append(Paragraph("Custody Transfer Timeline", heading_style))
        transfer_table_data = [["#", "From", "To", "Status", "Reason", "Date"]]
        for i, t in enumerate(transfers, 1):
            from_user = mongo.db.users.find_one({"user_id": t.get("from_user_id")})
            to_user = mongo.db.users.find_one({"user_id": t.get("to_user_id")})
            transfer_table_data.append([
                str(i),
                from_user["full_name"] if from_user else "Unknown",
                to_user["full_name"] if to_user else "Unknown",
                (t.get("status", "N/A") or "N/A").title(),
                (t.get("reason", "N/A") or "N/A")[:40],
                _fmt_date(t.get("requested_at")),
            ])
        elements.append(_make_data_table(transfer_table_data))
        elements.append(Spacer(1, 6))

    # Full Audit Trail
    if audit_logs:
        elements.append(Paragraph("Complete Audit Trail", heading_style))
        audit_table_data = [["#", "Action", "User", "Details", "Timestamp"]]
        for i, log in enumerate(audit_logs, 1):
            audit_table_data.append([
                str(i),
                log.get("action", "N/A").replace("_", " "),
                log.get("user_email", "N/A"),
                (log.get("details", "N/A") or "N/A")[:50],
                _fmt_date(log.get("timestamp")),
            ])
        elements.append(_make_data_table(audit_table_data))
        elements.append(Spacer(1, 6))

    # Footer
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.gray))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        "This report was automatically generated by the Digital Chain of Custody System. "
        "All timestamps are in UTC. Hash values are SHA-256.",
        small_style
    ))
    elements.append(Paragraph(
        f"Report generated at {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} | Evidence ID: {evidence_id}",
        small_style
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer


def generate_case_report(case_id):
    """Generate a full case report PDF with all evidence and transfers."""
    case = mongo.db.cases.find_one({"case_id": case_id}, {"_id": 0})
    if not case:
        return None

    evidence_list = list(
        mongo.db.evidence.find({"case_id": case_id}, {"_id": 0}).sort("created_at", 1)
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=20 * mm, bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("CustomTitle", parent=styles["Title"], fontSize=18, spaceAfter=6)
    subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"], fontSize=10, textColor=colors.gray)
    heading_style = ParagraphStyle("Heading", parent=styles["Heading2"], fontSize=13, spaceBefore=14, spaceAfter=6)
    small_style = ParagraphStyle("Small", parent=styles["Normal"], fontSize=8, textColor=colors.gray)

    elements = []

    # Header
    elements.append(Paragraph("CASE REPORT", title_style))
    elements.append(Paragraph(f"{case.get('case_number', '')} - {case.get('title', '')}", subtitle_style))
    elements.append(Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", subtitle_style))
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#2563eb")))
    elements.append(Spacer(1, 10))

    # Case Details
    elements.append(Paragraph("Case Information", heading_style))
    case_data = [
        ["Case Number", case.get("case_number", "N/A")],
        ["Title", case.get("title", "N/A")],
        ["Status", (case.get("status", "N/A") or "N/A").title()],
        ["Description", case.get("description", "N/A") or "N/A"],
        ["Created", _fmt_date(case.get("created_at"))],
        ["Total Evidence", str(len(evidence_list))],
    ]
    elements.append(_make_detail_table(case_data))
    elements.append(Spacer(1, 6))

    # Evidence Summary
    if evidence_list:
        elements.append(Paragraph("Evidence Summary", heading_style))
        ev_table = [["#", "File Name", "Category", "Hash (truncated)", "Integrity", "Custodian"]]
        for i, ev in enumerate(evidence_list, 1):
            custodian = mongo.db.users.find_one({"user_id": ev.get("current_custodian_id")})
            ev_table.append([
                str(i),
                ev.get("file_name", "N/A"),
                (ev.get("category", "N/A") or "N/A").replace("_", " ").title(),
                (ev.get("original_hash", "N/A") or "N/A")[:24] + "...",
                (ev.get("integrity_status", "unverified") or "unverified").upper(),
                custodian["full_name"] if custodian else "Unknown",
            ])
        elements.append(_make_data_table(ev_table))

    # Footer
    elements.append(Spacer(1, 12))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.gray))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        f"Report generated at {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} | Case: {case.get('case_number', '')}",
        small_style
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer


def _make_detail_table(data):
    """Create a 2-column key-value table."""
    table = Table(data, colWidths=[120, 380])
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#374151")),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#111827")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ]))
    return table


def _make_data_table(data):
    """Create a multi-column data table with header row."""
    num_cols = len(data[0])
    table = Table(data, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    table.setStyle(TableStyle(style))
    return table


def _fmt_date(val):
    if not val:
        return "N/A"
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%d %H:%M:%S UTC")
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val).strftime("%Y-%m-%d %H:%M:%S UTC")
        except (ValueError, TypeError):
            return val
    return str(val)


def _format_size(size):
    if not size:
        return "0 B"
    units = ["B", "KB", "MB", "GB"]
    i = 0
    s = float(size)
    while s >= 1024 and i < len(units) - 1:
        s /= 1024
        i += 1
    return f"{s:.1f} {units[i]}"
