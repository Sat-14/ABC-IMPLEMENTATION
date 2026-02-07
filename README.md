# Digital Chain of Custody (DCoC)

Secure integrity of digital evidence for legal and forensic proceedings.

## Tech Stack

- **Backend**: Python Flask + MongoDB
- **Frontend**: React + Vite + Tailwind CSS
- **Auth**: JWT (Flask-JWT-Extended)
- **Hashing**: SHA-256

## Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB running on `localhost:27017`

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
python run.py
```

Backend runs on http://localhost:5000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173 (proxies /api to Flask)

## Features (Phase 1 MVP)

- User authentication with JWT & role-based access control (6 roles)
- Evidence upload with automatic SHA-256 hashing
- Integrity verification (re-hash & compare)
- Immutable audit log with hash chaining
- Custody transfer workflow (request, approve, complete)
- Case management with linked evidence
- Evidence search, filtering, and pagination

## API Endpoints

| Module     | Base Path        | Key Endpoints                              |
|------------|------------------|--------------------------------------------|
| Auth       | `/api/auth`      | POST /register, /login, /refresh, GET /me  |
| Evidence   | `/api/evidence`  | POST /, GET /, POST /:id/verify, GET /:id/download |
| Cases      | `/api/cases`     | POST /, GET /, GET /:id, GET /:id/evidence |
| Transfers  | `/api/transfers` | POST /, PATCH /:id/approve, /reject, /complete |
| Audit      | `/api/audit`     | GET /, GET /evidence/:id, GET /verify-chain |

## Roles & Permissions

| Role             | Upload | View | Transfer | Verify | Delete | Admin |
|------------------|--------|------|----------|--------|--------|-------|
| Admin            | Yes    | Yes  | Yes      | Yes    | Yes    | Yes   |
| Investigator     | Yes    | Yes  | Yes      | Yes    | No     | No    |
| Forensic Analyst | No     | Yes  | No       | Yes    | No     | No    |
| Prosecutor       | No     | Yes  | No       | Yes    | No     | No    |
| Judge/Court      | No     | Yes  | No       | Yes    | No     | No    |
| Auditor          | No     | Yes  | No       | Yes    | No     | No    |
