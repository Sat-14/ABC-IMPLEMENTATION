class Roles:
    ADMIN = "admin"
    INVESTIGATOR = "investigator"
    FORENSIC_ANALYST = "forensic_analyst"
    PROSECUTOR = "prosecutor"
    JUDGE = "judge"
    AUDITOR = "auditor"


class Permissions:
    UPLOAD = "upload"
    VIEW = "view"
    TRANSFER = "transfer"
    VERIFY = "verify"
    DELETE = "delete"
    ADMIN = "admin"


ROLE_PERMISSIONS = {
    Roles.ADMIN: {Permissions.UPLOAD, Permissions.VIEW, Permissions.TRANSFER, Permissions.VERIFY, Permissions.DELETE, Permissions.ADMIN},
    Roles.INVESTIGATOR: {Permissions.UPLOAD, Permissions.VIEW, Permissions.TRANSFER, Permissions.VERIFY},
    Roles.FORENSIC_ANALYST: {Permissions.VIEW, Permissions.VERIFY},
    Roles.PROSECUTOR: {Permissions.VIEW, Permissions.VERIFY},
    Roles.JUDGE: {Permissions.VIEW, Permissions.VERIFY},
    Roles.AUDITOR: {Permissions.VIEW, Permissions.VERIFY},
}

ALL_ROLES = list(ROLE_PERMISSIONS.keys())

EVIDENCE_CATEGORIES = [
    "disk_image", "document", "image", "video", "audio",
    "log", "email", "network_capture", "other"
]

EVIDENCE_CLASSIFICATIONS = ["public", "internal", "confidential", "restricted"]

EVIDENCE_STATUSES = ["active", "archived", "disposed"]

CASE_STATUSES = ["open", "closed", "archived"]

TRANSFER_STATUSES = ["pending", "approved", "rejected", "completed", "cancelled"]

AUDIT_ACTIONS = [
    "user_registered", "user_login",
    "case_created", "case_updated",
    "evidence_uploaded", "evidence_viewed", "evidence_updated",
    "evidence_deleted", "evidence_downloaded",
    "evidence_verified", "evidence_verification_failed",
    "transfer_requested", "transfer_approved", "transfer_rejected",
    "transfer_completed", "transfer_cancelled",
    "audit_chain_verified",
]
