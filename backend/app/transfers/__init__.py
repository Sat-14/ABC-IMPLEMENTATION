from flask import Blueprint

transfers_bp = Blueprint("transfers", __name__)

from app.transfers import routes  # noqa: E402, F401
