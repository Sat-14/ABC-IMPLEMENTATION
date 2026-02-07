from flask import Blueprint

audit_bp = Blueprint("audit", __name__)

from app.audit import routes  # noqa: E402, F401
