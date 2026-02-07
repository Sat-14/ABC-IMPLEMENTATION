from flask import jsonify


class APIError(Exception):
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv["error"] = self.message
        return rv


class NotFoundError(APIError):
    def __init__(self, message="Resource not found"):
        super().__init__(message, 404)


class ForbiddenError(APIError):
    def __init__(self, message="Forbidden"):
        super().__init__(message, 403)


class ConflictError(APIError):
    def __init__(self, message="Conflict"):
        super().__init__(message, 409)


class ValidationError(APIError):
    def __init__(self, message="Validation error"):
        super().__init__(message, 422)


def register_error_handlers(app):
    @app.errorhandler(APIError)
    def handle_api_error(error):
        return jsonify(error.to_dict()), error.status_code

    @app.errorhandler(404)
    def handle_not_found(error):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def handle_server_error(error):
        return jsonify({"error": "Internal server error"}), 500
