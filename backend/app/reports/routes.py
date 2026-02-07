from flask import send_file
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.common.errors import NotFoundError
from app.reports import reports_bp
from app.reports.services import generate_case_report, generate_evidence_report


@reports_bp.route("/evidence/<evidence_id>", methods=["GET"])
@jwt_required()
def evidence_report(evidence_id):
    identity = get_jwt_identity()

    pdf_buffer = generate_evidence_report(evidence_id)
    if not pdf_buffer:
        raise NotFoundError("Evidence not found")

    from app.audit.services import log_action
    log_action(
        action="report_generated",
        entity_type="evidence",
        entity_id=evidence_id,
        user_id=identity["user_id"],
        user_email=identity["email"],
        user_role=identity["role"],
        details=f"Generated Chain of Custody PDF report for evidence {evidence_id}",
    )

    return send_file(
        pdf_buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"chain_of_custody_{evidence_id[:8]}.pdf",
    )


@reports_bp.route("/case/<case_id>", methods=["GET"])
@jwt_required()
def case_report(case_id):
    identity = get_jwt_identity()

    pdf_buffer = generate_case_report(case_id)
    if not pdf_buffer:
        raise NotFoundError("Case not found")

    from app.audit.services import log_action
    log_action(
        action="report_generated",
        entity_type="case",
        entity_id=case_id,
        user_id=identity["user_id"],
        user_email=identity["email"],
        user_role=identity["role"],
        details=f"Generated case report PDF for case {case_id}",
    )

    return send_file(
        pdf_buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"case_report_{case_id[:8]}.pdf",
    )
