"""
Explainable Trust Score Engine for Digital Evidence.

Computes a 0-100 trust score based on 6 weighted factors,
with SHAP-like feature attribution explaining each factor's contribution.
"""

import math
from datetime import datetime, timezone

from app.extensions import mongo


def compute_trust_score(evidence_id):
    """Compute an explainable trust score for a piece of evidence."""
    ev = mongo.db.evidence.find_one({"evidence_id": evidence_id}, {"_id": 0})
    if not ev:
        return None

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

    components = [
        _score_integrity(ev, hash_records),
        _score_verification_frequency(hash_records),
        _score_custody_chain(transfers),
        _score_audit_trail(audit_logs),
        _score_verification_recency(ev),
        _score_custodian_count(transfers),
    ]

    total_score = round(sum(c["score"] for c in components), 1)
    grade, grade_label = _compute_grade(total_score)
    risk_flags = _identify_risk_flags(ev, hash_records, transfers, audit_logs)
    summary = _generate_summary(total_score, grade, grade_label, components, risk_flags)

    return {
        "evidence_id": evidence_id,
        "score": total_score,
        "grade": grade,
        "grade_label": grade_label,
        "components": components,
        "summary": summary,
        "risk_flags": risk_flags,
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# Scoring Components
# ---------------------------------------------------------------------------

def _score_integrity(ev, hash_records):
    """Component 1: Integrity Status (30 pts max)."""
    status = ev.get("integrity_status", "unverified")
    verifications = [r for r in hash_records if r.get("event_type") == "verification"]

    if status == "tampered":
        score = 0.0
        explanation = "Evidence integrity is COMPROMISED - hash mismatch detected during verification."
        comp_status = "critical"
    elif status == "intact" and len(verifications) > 0:
        score = 30.0
        explanation = f"Evidence integrity is verified intact with {len(verifications)} successful verification(s)."
        comp_status = "good"
    elif status == "intact" and len(verifications) == 0:
        score = 20.0
        explanation = "Hash was recorded at upload but no independent verification has been performed."
        comp_status = "warning"
    else:
        score = 10.0
        explanation = "Evidence has not been verified since upload. Integrity status is unknown."
        comp_status = "warning"

    return {
        "name": "Integrity Status",
        "score": score,
        "max_score": 30,
        "percentage": round((score / 30) * 100, 1),
        "explanation": explanation,
        "status": comp_status,
    }


def _score_verification_frequency(hash_records):
    """Component 2: Verification Frequency (15 pts max)."""
    verifications = [r for r in hash_records if r.get("event_type") == "verification"]
    count = len(verifications)
    score = min(15.0, count * 3.75)

    if count == 0:
        explanation = "No verifications performed. Regular integrity checks are recommended."
        comp_status = "critical"
    elif count <= 1:
        explanation = f"Verified {count} time. More frequent checks would strengthen the trust score."
        comp_status = "warning"
    elif count <= 3:
        explanation = f"Verified {count} times. Good verification frequency."
        comp_status = "good"
    else:
        explanation = f"Verified {count} times. Excellent verification discipline."
        comp_status = "good"

    return {
        "name": "Verification Frequency",
        "score": round(score, 1),
        "max_score": 15,
        "percentage": round((score / 15) * 100, 1),
        "explanation": explanation,
        "status": comp_status,
    }


def _score_custody_chain(transfers):
    """Component 3: Custody Chain Completeness (20 pts max)."""
    if not transfers:
        return {
            "name": "Custody Chain",
            "score": 15.0,
            "max_score": 20,
            "percentage": 75.0,
            "explanation": "Evidence has remained with a single custodian since upload. No transfer issues.",
            "status": "good",
        }

    score = 20.0
    rejected = sum(1 for t in transfers if t.get("status") == "rejected")
    cancelled = sum(1 for t in transfers if t.get("status") == "cancelled")
    pending = sum(1 for t in transfers if t.get("status") == "pending")
    completed = sum(1 for t in transfers if t.get("status") == "completed")

    score -= rejected * 5
    score -= cancelled * 3
    score -= pending * 2
    score = max(0.0, score)

    issues = []
    if rejected:
        issues.append(f"{rejected} rejected")
    if cancelled:
        issues.append(f"{cancelled} cancelled")
    if pending:
        issues.append(f"{pending} still pending")

    if not issues:
        explanation = f"All {completed} custody transfer(s) completed successfully. Clean chain."
        comp_status = "good"
    else:
        explanation = f"{completed} completed transfer(s), but {', '.join(issues)}."
        comp_status = "critical" if rejected else "warning"

    return {
        "name": "Custody Chain",
        "score": round(score, 1),
        "max_score": 20,
        "percentage": round((score / 20) * 100, 1),
        "explanation": explanation,
        "status": comp_status,
    }


def _score_audit_trail(audit_logs):
    """Component 4: Audit Trail Coverage (15 pts max)."""
    count = len(audit_logs)
    score = min(15.0, count * 1.5)

    if count <= 1:
        explanation = f"Only {count} audit log entry. Minimal trail coverage."
        comp_status = "critical"
    elif count <= 5:
        explanation = f"{count} audit log entries. Moderate trail coverage."
        comp_status = "warning"
    elif count <= 10:
        explanation = f"{count} audit log entries. Good documentation of evidence lifecycle."
        comp_status = "good"
    else:
        explanation = f"{count} audit log entries. Comprehensive trail providing strong accountability."
        comp_status = "good"

    return {
        "name": "Audit Trail Coverage",
        "score": round(score, 1),
        "max_score": 15,
        "percentage": round((score / 15) * 100, 1),
        "explanation": explanation,
        "status": comp_status,
    }


def _score_verification_recency(ev):
    """Component 5: Time Since Last Verification (10 pts max)."""
    last_verified = ev.get("last_verified_at")
    if not last_verified:
        return {
            "name": "Verification Recency",
            "score": 0.0,
            "max_score": 10,
            "percentage": 0.0,
            "explanation": "Evidence has never been verified. Run an integrity check to improve this score.",
            "status": "critical",
        }

    if isinstance(last_verified, str):
        try:
            last_verified = datetime.fromisoformat(last_verified.replace("Z", "+00:00"))
        except ValueError:
            last_verified = None
    if not last_verified:
        return {
            "name": "Verification Recency",
            "score": 0.0,
            "max_score": 10,
            "percentage": 0.0,
            "explanation": "Unable to determine last verification time.",
            "status": "warning",
        }

    now = datetime.now(timezone.utc)
    if last_verified.tzinfo is None:
        last_verified = last_verified.replace(tzinfo=timezone.utc)
    days_since = (now - last_verified).total_seconds() / 86400
    score = round(10.0 * math.exp(-days_since / 30), 1)

    if days_since < 1:
        explanation = "Verified within the last 24 hours. Excellent recency."
        comp_status = "good"
    elif days_since < 7:
        explanation = f"Last verified {int(days_since)} day(s) ago. Recent verification."
        comp_status = "good"
    elif days_since < 30:
        explanation = f"Last verified {int(days_since)} days ago. Consider re-verifying."
        comp_status = "warning"
    else:
        explanation = f"Last verified {int(days_since)} days ago. Verification is overdue."
        comp_status = "critical"

    return {
        "name": "Verification Recency",
        "score": score,
        "max_score": 10,
        "percentage": round((score / 10) * 100, 1),
        "explanation": explanation,
        "status": comp_status,
    }


def _score_custodian_count(transfers):
    """Component 6: Custodian Count (10 pts max)."""
    if not transfers:
        return {
            "name": "Custodian Count",
            "score": 8.0,
            "max_score": 10,
            "percentage": 80.0,
            "explanation": "Single custodian - well-controlled chain with no handoff risks.",
            "status": "good",
        }

    completed = [t for t in transfers if t.get("status") == "completed"]
    custodians = set()
    for t in completed:
        custodians.add(t.get("from_user_id"))
        custodians.add(t.get("to_user_id"))
    count = len(custodians) if custodians else 1

    score_map = {1: 8, 2: 10, 3: 8}
    if count <= 3:
        score = float(score_map.get(count, 8))
    elif count <= 5:
        score = 5.0
    else:
        score = 3.0

    if count == 2:
        explanation = f"{count} custodians in the chain. Ideal - proper transfer with minimal handoffs."
        comp_status = "good"
    elif count <= 3:
        explanation = f"{count} custodians in the chain. Well-controlled transfer history."
        comp_status = "good"
    elif count <= 5:
        explanation = f"{count} custodians. Moderate handoff count - ensure each transfer was necessary."
        comp_status = "warning"
    else:
        explanation = f"{count} custodians. High turnover may raise questions about evidence handling."
        comp_status = "critical"

    return {
        "name": "Custodian Count",
        "score": score,
        "max_score": 10,
        "percentage": round((score / 10) * 100, 1),
        "explanation": explanation,
        "status": comp_status,
    }


# ---------------------------------------------------------------------------
# Grade, Risk Flags & Summary
# ---------------------------------------------------------------------------

def _compute_grade(score):
    if score >= 90:
        return "A", "Excellent"
    if score >= 75:
        return "B", "Good"
    if score >= 55:
        return "C", "Fair"
    if score >= 35:
        return "D", "Poor"
    return "F", "Failing"


def _identify_risk_flags(ev, hash_records, transfers, audit_logs):
    flags = []
    verifications = [r for r in hash_records if r.get("event_type") == "verification"]

    if ev.get("integrity_status") == "tampered":
        flags.append("CRITICAL: Evidence integrity has been compromised. Hash mismatch detected.")

    if len(verifications) == 0:
        flags.append("Evidence has never been independently verified since upload.")

    if verifications:
        last = verifications[-1]
        ts = last.get("computed_at")
        if isinstance(ts, str):
            try:
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except ValueError:
                ts = None
        if isinstance(ts, datetime):
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            days = (datetime.now(timezone.utc) - ts).total_seconds() / 86400
            if days > 90:
                flags.append(f"Last verification was {int(days)} days ago. Re-verification is overdue.")

    rejected = sum(1 for t in transfers if t.get("status") == "rejected")
    if rejected:
        flags.append(f"{rejected} custody transfer(s) were rejected, indicating potential disputes.")

    if len(audit_logs) < 3:
        flags.append("Sparse audit trail may indicate insufficient oversight or logging gaps.")

    return flags


def _generate_summary(score, grade, grade_label, components, risk_flags):
    best = max(components, key=lambda c: c["percentage"])
    worst = min(components, key=lambda c: c["percentage"])

    summary = (
        f"This evidence has a {grade_label.lower()} trust score of {score}/100 (Grade {grade}). "
        f"The strongest factor is \"{best['name']}\" ({best['score']}/{best['max_score']}), "
        f"while \"{worst['name']}\" ({worst['score']}/{worst['max_score']}) needs the most attention."
    )

    if risk_flags:
        summary += f" {len(risk_flags)} risk flag(s) were identified that may require action."

    if score >= 75:
        summary += " Overall, this evidence demonstrates strong chain-of-custody practices."
    elif score >= 55:
        summary += " The evidence meets basic trust requirements but has areas for improvement."
    else:
        summary += " Significant concerns exist. Address the flagged issues before court submission."

    return summary
