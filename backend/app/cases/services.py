import uuid
from datetime import datetime, timezone

from app.extensions import mongo


def _next_case_number():
    """Generate next case number like CASE-2026-00001."""
    try:
        year = datetime.now(timezone.utc).year
        last = mongo.db.cases.find_one(
            {"case_number": {"$regex": f"^CASE-{year}-"}},
            sort=[("case_number", -1)],
        )
        print(f"DEBUG: _next_case_number last case: {last}")
        if last:
            num = int(last["case_number"].split("-")[-1]) + 1
        else:
            num = 1
        new_num = f"CASE-{year}-{num:05d}"
        print(f"DEBUG: Generated new case number: {new_num}")
        return new_num
    except Exception as e:
        print(f"ERROR in _next_case_number: {str(e)}")
        raise e


def create_case(title, description, created_by_id, created_by_name):
    print(f"DEBUG: create_case called with title={title}")
    try:
        case_id = str(uuid.uuid4())
        case_num = _next_case_number()
        case = {
            "case_id": case_id,
            "case_number": case_num,
            "title": title,
            "description": description or "",
            "status": "open",
            "created_by": created_by_id,
            "created_by_name": created_by_name,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        mongo.db.cases.insert_one(case)
        print(f"DEBUG: Case inserted successfully: {case_id}")
        return _serialize(case)
    except Exception as e:
        print(f"ERROR in create_case: {str(e)}")
        raise e


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
    allowed = {"title", "description", "status", "closing_reason", "closed_at", "closed_by", "closed_by_name"}
    filtered = {k: v for k, v in updates.items() if k in allowed}
    if not filtered:
        return None
    filtered["updated_at"] = datetime.now(timezone.utc)
    mongo.db.cases.update_one({"case_id": case_id}, {"$set": filtered})
    
    # Auto-archive evidence if case is closed
    if filtered.get("status") == "closed":
        try:
            res = mongo.db.evidence.update_many(
                {"case_id": case_id, "status": "active"},
                {"$set": {"status": "archived", "updated_at": datetime.now(timezone.utc)}}
            )
            print(f"DEBUG: Auto-archived {res.modified_count} evidence items for case {case_id}")
        except Exception as e:
            print(f"ERROR auto-archiving evidence: {str(e)}")

    return get_case(case_id)


def _serialize(case):
    if not case:
        return None
    for field in ["created_at", "updated_at", "closed_at"]:
        if isinstance(case.get(field), datetime):
            case[field] = case[field].isoformat()
    
    # Ensure created_by_name is available for old cases
    if "created_by" in case and "created_by_name" not in case:
        user = mongo.db.users.find_one({"user_id": case["created_by"]})
        if user:
            case["created_by_name"] = user.get("full_name") or user.get("email")
        else:
            case["created_by_name"] = "Unknown"

    case.pop("_id", None)
    return case
