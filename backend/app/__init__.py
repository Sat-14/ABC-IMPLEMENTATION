import os
from flask import Flask
from app.config import config
from app.extensions import mongo, jwt, cors
from app.common.errors import register_error_handlers


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    mongo.init_app(app)
    jwt.init_app(app)
    register_jwt_debug_handlers(jwt)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", "*")}})

    # Register blueprints
    from app.auth import auth_bp
    from app.evidence import evidence_bp
    from app.cases import cases_bp
    from app.transfers import transfers_bp
    from app.audit import audit_bp
    from app.search import search_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(evidence_bp, url_prefix="/api/evidence")
    app.register_blueprint(cases_bp, url_prefix="/api/cases")
    app.register_blueprint(transfers_bp, url_prefix="/api/transfers")
    app.register_blueprint(audit_bp, url_prefix="/api/audit")
    app.register_blueprint(search_bp, url_prefix="/api/search")

    # Register error handlers
    register_error_handlers(app)

    # Ensure upload directory exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Create MongoDB indexes on first request
    with app.app_context():
        _create_indexes(mongo.db)

    return app


def _create_indexes(db):
    """Create MongoDB indexes for all collections."""
    db.users.create_index("email", unique=True)
    db.users.create_index("user_id", unique=True)

    db.cases.create_index("case_id", unique=True)
    db.cases.create_index("case_number", unique=True)

    db.evidence.create_index("evidence_id", unique=True)
    db.evidence.create_index("case_id")
    db.evidence.create_index("current_custodian_id")
    db.evidence.create_index("status")

    db.audit_logs.create_index("chain_sequence", unique=True)
    db.audit_logs.create_index([("entity_type", 1), ("entity_id", 1)])
    db.audit_logs.create_index("user_id")
    db.audit_logs.create_index("timestamp")

    db.custody_transfers.create_index("transfer_id", unique=True)
    db.custody_transfers.create_index("evidence_id")
    db.custody_transfers.create_index("from_user_id")
    db.custody_transfers.create_index("to_user_id")
    db.custody_transfers.create_index("status")

    db.hash_records.create_index("evidence_id")
    db.hash_records.create_index("computed_at")


def register_jwt_debug_handlers(jwt):
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        print(f"DEBUG: Invalid token error: {error}")
        return {"msg": f"Invalid token: {error}"}, 422

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        print(f"DEBUG: Missing token error: {error}")
        return {"msg": f"Missing token: {error}"}, 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print(f"DEBUG: Expired token: {jwt_payload}")
        return {"msg": "Token has expired"}, 401
