import uuid
from datetime import datetime, timezone

from app.extensions import mongo


def _next_case_number():
    """Generate next case number like CASE-2026-00001."""
    year = datetime.now(timezone.utc).year
    last = mongo.db.cases.find_one(
        {"case_number": {"$regex": f"^CASE-{year}-"}},
        sort=[("case_number", -1)],
    )
    if last:
        num = int(last["case_number"].split("-")[-1]) + 1
    else:
        num = 1
    return f"CASE-{year}-{num:05d}"


def create_case(title, description, created_by_id, created_by_name):
    case_id = str(uuid.uuid4())
    case = {
        "case_id": case_id,
        "case_number": _next_case_number(),
        "title": title,
        "description": description or "",
        "status": "open",
        "created_by": created_by_id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    mongo.db.cases.insert_one(case)
    return _serialize(case)


def get_cases(page=1, per_page=10, status=None, search=None):
    query = {}
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"case_number": {"$regex": search, "$options": "i"}},
        ]

    total = mongo.db.cases.count_documents(query)
    cases = list(
        mongo.db.cases.find(query, {"_id": 0})
        .sort("created_at", -1)
        .skip((page - 1) * per_page)
        .limit(per_page)
    )
    return {
        "cases": [_serialize(c) for c in cases],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
    }


def get_case(case_id):
    case = mongo.db.cases.find_one({"case_id": case_id}, {"_id": 0})
    return _serialize(case) if case else None


def update_case(case_id, updates):
    allowed = {"title", "description", "status"}
    filtered = {k: v for k, v in updates.items() if k in allowed}
    if not filtered:
        return None
    filtered["updated_at"] = datetime.now(timezone.utc)
    mongo.db.cases.update_one({"case_id": case_id}, {"$set": filtered})
    return get_case(case_id)


def _serialize(case):
    if not case:
        return None
    for field in ["created_at", "updated_at"]:
        if isinstance(case.get(field), datetime):
            case[field] = case[field].isoformat()
    case.pop("_id", None)
    return case
