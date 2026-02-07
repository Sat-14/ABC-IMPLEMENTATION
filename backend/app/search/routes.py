from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.search import search_bp
from app.extensions import mongo
from app.common.errors import ValidationError


@search_bp.route("", methods=["GET"])
@jwt_required()
def global_search():
    """
    Global search endpoint that searches across cases, evidence, and users.
    Query params:
        - q: search query (required)
        - limit: max results per category (default: 5)
    """
    query = request.args.get("q", "").strip()
    limit = int(request.args.get("limit", 5))
    
    if not query:
        raise ValidationError("Search query is required")
    
    if len(query) < 2:
        return jsonify({"results": {"cases": [], "evidence": [], "users": []}})
    
    # Search cases
    cases = list(mongo.db.cases.find(
        {
            "$or": [
                {"case_number": {"$regex": query, "$options": "i"}},
                {"title": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ]
        },
        {"_id": 0, "case_id": 1, "case_number": 1, "title": 1, "status": 1}
    ).limit(limit))
    
    # Search evidence
    evidence = list(mongo.db.evidence.find(
        {
            "$or": [
                {"file_name": {"$regex": query, "$options": "i"}},
                {"original_hash": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ]
        },
        {"_id": 0, "evidence_id": 1, "file_name": 1, "file_type": 1, "case_id": 1, "status": 1}
    ).limit(limit))
    
    # Search users
    users = list(mongo.db.users.find(
        {
            "$or": [
                {"full_name": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}},
                {"department": {"$regex": query, "$options": "i"}}
            ]
        },
        {"_id": 0, "user_id": 1, "full_name": 1, "email": 1, "role": 1}
    ).limit(limit))
    
    return jsonify({
        "query": query,
        "results": {
            "cases": cases,
            "evidence": evidence,
            "users": users
        }
    })
