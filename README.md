# Digital Chain of Custody (DCoC) with Explainable AI

**Secure integrity of digital evidence for legal and forensic proceedings using Blockchain-inspired Hash Chaining and Explainable AI (XAI).**

This system provides a tamper-proof, cryptographically verifiable trail for digital evidence, enhanced with XAI to provide transparent trust scoring and human-readable audit intelligence for investigators, prosecutors, and judges.

---

## Table of Contents

1.  [Key Features](#key-features)
2.  [System Architecture](#system-architecture)
3.  [Backend Deep Dive](#backend-deep-dive)
4.  [Frontend Deep Dive](#frontend-deep-dive)
5.  [Database Schema](#database-schema)
6.  [API Reference](#api-reference)
7.  [Core Algorithms](#core-algorithms)
8.  [Tech Stack](#tech-stack)
9.  [Setup & Installation](#setup--installation)
10. [Roles & Permissions](#roles--permissions)

---

## Key Features

### 1. Verifiable Evidence Integrity
*   **Cryptographic Fingerprinting**: Files are hashed with SHA-256 on upload.
*   **Tamper Detection**: Compares current file hash against stored `original_hash`.
*   **Immutable Records**: Once locked, the hash can't change without detection.
*   **Zero-Trust Validation**: The `verify_chain_integrity()` function validates the entire audit log chain.

### 2. Digital Chain of Custody
*   **End-to-End Tracking**: Logs every view, download, and modification.
*   **Formal Transfer Workflow**: States: `Pending` → `Approved` → `Completed` (or `Rejected`/`Cancelled`).
*   **Custodian Accountability**: A single user is always the designated "Current Custodian."

### 3. Secure External Sharing
*   **Time-Limited Access**: Secure public links with configurable expiration (1hr to 7 days).
*   **Token-Based**: No authentication required for recipient, controlled by token.
*   **Access Logging**: Every access is logged with IP and timestamp.
*   **Instant Revocation**: Owners can revoke links before they expire.

### 4. AI-Enhanced Forensics
*   **XAI Trust Score Engine**: A 0-100 score based on 6 weighted factors (see [Algorithms](#core-algorithms)).
*   **Automated Transcription**: Audio/video to searchable text via Whisper API integration.
*   **Smart Summarization / NLG**: Generates human-readable narratives from raw logs.
*   **Risk Assessment**: Flags anomalies like "Gap in Custody" or "Verification Overdue."

### 5. Comprehensive Audit Trail
*   **Granular Logging**: Logs passive actions (views) as well as active ones (edits).
*   **Forensic Watermarking**: Previews are overlaid with viewer identity/timestamp.
*   **Exportable PDF Reports**: Legal-grade reports for court submission via `ReportLab`.

### 6. Advanced Case Management
*   **Cross-Case Linking**: Evidence can be linked to multiple cases.
*   **Geo-Tagging**: Supports latitude/longitude for collection location.
*   **Role-Based Access Control**: 6 distinct roles with granular permissions.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT (React)                              │
│   Port 5173 (Vite)                                                          │
│   ├── Pages: Dashboard, Cases, Evidence, Uploads, Transfers, Audit Logs    │
│   └── API Client: Axios with JWT Interceptors                               │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │ HTTP (REST API)
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               SERVER (Flask)                                │
│   Port 5000                                                                 │
│   ├── Blueprints: auth, evidence, cases, transfers, audit, search,         │
│   │               reports, notifications                                    │
│   ├── Extensions: Flask-PyMongo, Flask-JWT-Extended, Flask-CORS            │
│   └── File Storage: /backend/uploads/                                       │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATABASE (MongoDB)                              │
│   ├── Collections: users, cases, evidence, custody_transfers,              │
│   │                audit_logs, hash_records, notifications, share_tokens   │
│   └── Indexes: On user_id, case_id, evidence_id, chain_sequence, etc.      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Backend Deep Dive

The backend is a modular Flask application using the "Application Factory" pattern (`create_app`).

### Directory Structure

```
backend/
├── app/
│   ├── __init__.py         # App factory, blueprint registration, index creation
│   ├── config.py           # Dev/Prod configs (MONGO_URI, JWT_SECRET_KEY)
│   ├── extensions.py       # Flask extension instances (mongo, jwt, cors)
│   ├── common/             # Shared utilities (errors, validators, constants)
│   │   ├── constants.py    # Role definitions (Roles enum)
│   │   ├── errors.py       # Custom exception classes (APIError, NotFoundError)
│   │   └── validators.py   # Input validation helpers
│   ├── auth/               # Authentication module
│   │   ├── routes.py       # /api/auth/* (register, login, refresh, me, users)
│   │   ├── services.py     # User CRUD, password hashing (bcrypt)
│   │   └── decorators.py   # @role_required, @permission_required
│   ├── evidence/           # Evidence management (core domain)
│   │   ├── routes.py       # /api/evidence/* (CRUD, verify, download, share)
│   │   ├── services.py     # File hashing, storage, verification logic
│   │   ├── sharing.py      # Token-based sharing logic
│   │   ├── trust_score.py  # XAI Trust Score computation
│   │   ├── transcription.py# Audio/Video to text (Whisper integration)
│   │   ├── preview.py      # Watermarked preview generation (Pillow)
│   │   ├── retention.py    # Evidence lifecycle & disposal policies
│   │   ├── analytics.py    # Dashboard aggregation
│   │   └── export.py       # CSV export utilities
│   ├── cases/              # Case management
│   │   └── routes.py       # /api/cases/* (CRUD)
│   ├── transfers/          # Chain-of-Custody transfers
│   │   ├── routes.py       # /api/transfers/* (request, approve, reject, complete)
│   │   └── services.py     # Transfer state machine logic
│   ├── audit/              # Hash-chained audit logs
│   │   ├── routes.py       # /api/audit/* (logs, verify-chain, summary)
│   │   ├── services.py     # log_action(), verify_chain_integrity()
│   │   └── summary.py      # NLG summary generation
│   ├── reports/            # PDF report generation
│   │   └── routes.py       # /api/reports/* (evidence report download)
│   ├── search/             # Global search
│   │   └── routes.py       # /api/search/*
│   └── notifications/      # In-app notifications
│       ├── routes.py       # /api/notifications/*
│       └── services.py     # notify_transfer_requested(), etc.
├── uploads/                # Evidence file storage
├── requirements.txt        # Python dependencies
└── run.py                  # Flask development server entry point
```

### Key Services

| Service File | Function | Description |
|---|---|---|
| `audit/services.py` | `log_action()` | **Single write point** for the audit log. Implements SHA-256 hash chaining. |
| `audit/services.py` | `verify_chain_integrity()` | Walks the audit log and re-computes hashes to detect tampering. |
| `evidence/services.py` | `compute_hash()` | SHA-256 hash of an evidence file. |
| `evidence/services.py` | `verify_evidence_integrity()` | Compares current file hash to `original_hash`. |
| `evidence/trust_score.py` | `compute_trust_score()` | Returns 0-100 score with explanations. |
| `evidence/sharing.py` | `create_share_token()` | Creates a time-limited, revocable share token. |
| `transfers/services.py` | `create_transfer()` | Initiates a custody transfer request. |
| `transfers/services.py` | `complete_transfer()` | Finalizes transfer, updates `current_custodian_id`. |

---

## Frontend Deep Dive

The frontend is a React 19 + Vite application.

### Directory Structure

```
frontend/
├── public/                   # Static assets
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # Router configuration
│   ├── index.css             # Global styles (Tailwind base)
│   ├── api/                  # API client modules
│   │   ├── client.js         # Axios instance with JWT interceptors
│   │   ├── auth.js           # login(), register(), getUsers()
│   │   ├── evidence.js       # Full evidence API (upload, verify, share, transcribe)
│   │   ├── cases.js          # getCases(), createCase(), etc.
│   │   ├── transfers.js      # requestTransfer(), approveTransfer(), etc.
│   │   ├── audit.js          # getAuditLogs(), getAuditSummary()
│   │   ├── reports.js        # downloadEvidenceReport()
│   │   ├── notifications.js  # getNotifications(), markAsRead()
│   │   └── search.js         # globalSearch()
│   ├── pages/                # Route-level components (13 pages)
│   │   ├── DashboardPage.jsx       # Main dashboard with analytics charts
│   │   ├── CasesPage.jsx           # Case list with CRUD
│   │   ├── CaseDetailPage.jsx      # Single case view with linked evidence
│   │   ├── EvidenceListPage.jsx    # Evidence list with filters/search
│   │   ├── EvidenceDetailPage.jsx  # Single evidence view (verify, share, transfer)
│   │   ├── UploadEvidencePage.jsx  # Evidence upload form
│   │   ├── TransfersPage.jsx       # Custody transfer queue
│   │   ├── AuditLogPage.jsx        # Searchable audit trail
│   │   ├── RetentionPage.jsx       # Evidence lifecycle/disposal management
│   │   ├── SharedEvidencePage.jsx  # **Public** page for shared evidence view
│   │   ├── LoginPage.jsx           # Authentication
│   │   ├── RegisterPage.jsx        # User registration
│   │   └── NotFoundPage.jsx        # 404
│   ├── components/           # Reusable UI components
│   │   ├── common/           # Buttons, Cards, Modals, Spinners
│   │   ├── layout/           # Sidebar, Header, ProtectedRoute
│   │   ├── evidence/         # AuditSummaryCard, ShareModal, TransferModal
│   │   └── cases/            # Case-specific components
│   ├── context/              # React Context providers
│   │   └── AuthContext.jsx   # User session management
│   └── utils/                # Helper functions
│       └── formatters.js     # formatDate(), formatFileSize()
├── package.json              # NPM dependencies
└── vite.config.js            # Vite configuration (proxy to backend)
```

### Key Components

| Component | File | Description |
|---|---|---|
| `EvidenceDetailPage` | `pages/EvidenceDetailPage.jsx` | Core page for viewing a single evidence item. Supports verification, download, preview, sharing, transfer initiation, audit log view, and AI insights. |
| `ShareModal` | `components/evidence/ShareModal.jsx` | Modal to generate time-limited share links, list active links, copy to clipboard, and revoke. |
| `TransferModal` | `components/evidence/TransferModal.jsx` | Modal to initiate a custody transfer to another user. |
| `AuditSummaryCard` | `components/evidence/AuditSummaryCard.jsx` | Displays AI-generated insights, risk flags, and key events timeline, powered by the XAI Trust Score engine. |
| `SharedEvidencePage` | `pages/SharedEvidencePage.jsx` | **Public (unauthenticated)** page for external recipients to view/download shared evidence. |

---

## Database Schema

MongoDB is used for its flexible document model. Key collections and their fields:

### `users`
| Field | Type | Description |
|---|---|---|
| `user_id` | string (UUID) | Primary identifier |
| `email` | string | Unique email |
| `password_hash` | string | Bcrypt hash |
| `full_name` | string | Display name |
| `role` | string | One of: `admin`, `investigator`, `analyst`, `prosecutor`, `judge`, `auditor` |
| `department` | string | Optional |
| `is_active` | boolean | Soft-delete flag |
| `created_at` | datetime | |

### `cases`
| Field | Type | Description |
|---|---|---|
| `case_id` | string (UUID) | Primary identifier |
| `case_number` | string | Auto-generated, e.g., `CASE-2026-00001` |
| `title` | string | |
| `description` | string | |
| `status` | string | `open`, `closed`, `archived` |
| `created_by` | string (user_id) | |
| `created_at` | datetime | |

### `evidence`
| Field | Type | Description |
|---|---|---|
| `evidence_id` | string (UUID) | Primary identifier |
| `case_id` | string (case_id) | Parent case |
| `linked_case_ids` | array of strings | For cross-case linking |
| `file_name` | string | Original filename |
| `file_path` | string | Server path to stored file |
| `file_type` | string | MIME type |
| `file_size` | int | Bytes |
| `original_hash` | string | SHA-256 hash at upload |
| `current_custodian_id` | string (user_id) | |
| `uploaded_by` | string (user_id) | |
| `upload_date` | datetime | |
| `status` | string | `active`, `archived`, `disposed` |
| `integrity_status` | string | `intact`, `tampered`, `unverified` |
| `last_verified_at` | datetime | |
| `verification_count` | int | |
| `description` | string | |
| `latitude`, `longitude` | float | Geo-tag |
| `transcription` | string | AI-generated text (for audio/video) |

### `custody_transfers`
| Field | Type | Description |
|---|---|---|
| `transfer_id` | string (UUID) | |
| `evidence_id` | string | |
| `from_user_id` | string | |
| `to_user_id` | string | |
| `reason` | string | |
| `status` | string | `pending`, `approved`, `completed`, `rejected`, `cancelled` |
| `requested_at` | datetime | |
| `approved_at` | datetime | |
| `completed_at` | datetime | |

### `audit_logs` (Hash-Chained)
| Field | Type | Description |
|---|---|---|
| `log_id` | string (UUID) | |
| `action` | string | E.g., `evidence_uploaded`, `integrity_verified`, `transfer_completed` |
| `entity_type` | string | `evidence`, `case`, `user`, `transfer` |
| `entity_id` | string | |
| `user_id` | string | |
| `user_email` | string | |
| `user_role` | string | |
| `details` | string | Human-readable description |
| `metadata` | object | Additional data |
| `ip_address` | string | |
| `user_agent` | string | |
| `hash_of_entry` | string | SHA-256 hash of this record's data + previous hash |
| `previous_log_hash` | string | Link to previous record |
| `chain_sequence` | int | Sequential order (globally unique) |
| `timestamp` | datetime | |

### `hash_records`
| Field | Type | Description |
|---|---|---|
| `evidence_id` | string | |
| `hash` | string | SHA-256 |
| `computed_at` | datetime | |
| `computed_by` | string (user_id) | |
| `is_match` | boolean | Matched `original_hash`? |

### `share_tokens`
| Field | Type | Description |
|---|---|---|
| `token_id` | string (UUID) | |
| `evidence_id` | string | |
| `token` | string | Secure random token (urlsafe) |
| `created_by` | string (user_id) | |
| `created_by_email` | string | |
| `recipient_email` | string | Optional, for tracking |
| `expires_at` | datetime | |
| `revoked` | boolean | |
| `access_count` | int | |
| `created_at` | datetime | |
| `last_accessed_at` | datetime | |

### `notifications`
| Field | Type | Description |
|---|---|---|
| `notification_id` | string (UUID) | |
| `user_id` | string | Recipient |
| `type` | string | `transfer_request`, `transfer_approved`, `integrity_alert`, etc. |
| `title` | string | |
| `message` | string | |
| `link` | string | Optional deep link |
| `is_read` | boolean | |
| `created_at` | datetime | |

---

## API Reference

Base URL: `/api`

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/register` | Create new user | ❌ |
| POST | `/login` | Login, returns JWT tokens | ❌ |
| POST | `/refresh` | Refresh access token | ✅ (Refresh) |
| GET | `/me` | Get current user info | ✅ |
| GET | `/users` | List all users | ✅ |
| PATCH | `/users/<user_id>` | Update user profile | ✅ |

### Evidence (`/api/evidence`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Upload new evidence (multipart) | ✅ |
| GET | `/` | List evidence (with filters) | ✅ |
| GET | `/<id>` | Get single evidence | ✅ |
| PATCH | `/<id>` | Update evidence metadata | ✅ |
| DELETE | `/<id>` | Delete evidence | ✅ (Admin) |
| POST | `/<id>/verify` | Verify integrity | ✅ |
| GET | `/<id>/download` | Download file | ✅ |
| GET | `/<id>/preview` | Watermarked preview | ✅ |
| GET | `/<id>/hash-history` | Get all hash records | ✅ |
| GET | `/<id>/trust-score` | Get XAI trust score | ✅ |
| POST | `/<id>/share` | Create share link | ✅ |
| GET | `/<id>/shares` | List active share tokens | ✅ |
| DELETE | `/shares/<token_id>` | Revoke share token | ✅ |
| POST | `/<id>/transcribe` | Start transcription job | ✅ |
| PUT | `/<id>/link-case/<case_id>` | Link to another case | ✅ |
| DELETE | `/<id>/link-case/<case_id>` | Unlink from case | ✅ |

### Public Sharing (`/api/evidence/public`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/shared/<token>` | Get shared evidence info | ❌ |
| GET | `/shared/<token>/download` | Download shared file | ❌ |

### Cases (`/api/cases`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Create case | ✅ |
| GET | `/` | List cases | ✅ |
| GET | `/<id>` | Get case details | ✅ |
| PATCH | `/<id>` | Update case | ✅ |
| DELETE | `/<id>` | Archive case | ✅ (Admin) |

### Transfers (`/api/transfers`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Request custody transfer | ✅ |
| GET | `/` | List transfers (filtered) | ✅ |
| GET | `/<id>` | Get transfer details | ✅ |
| PATCH | `/<id>/approve` | Approve transfer | ✅ |
| PATCH | `/<id>/reject` | Reject transfer | ✅ |
| PATCH | `/<id>/complete` | Complete transfer | ✅ |
| PATCH | `/<id>/cancel` | Cancel transfer | ✅ |

### Audit (`/api/audit`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/logs` | Paginated audit logs | ✅ |
| GET | `/verify-chain` | Full chain integrity check | ✅ (Admin) |
| GET | `/evidence/<id>/summary` | AI-generated summary | ✅ |

### Reports (`/api/reports`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/evidence/<id>` | Download PDF report | ✅ |

### Notifications (`/api/notifications`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | Get user's notifications | ✅ |
| PATCH | `/<id>/read` | Mark as read | ✅ |
| DELETE | `/<id>` | Delete notification | ✅ |

### Search (`/api/search`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | Global search (cases, evidence, users) | ✅ |

---

## Core Algorithms

### 1. XAI Trust Score Engine (`trust_score.py`)
Computes a 0-100 "credibility score" with explanations for each factor.

| Component | Weight | Description |
|---|---|---|
| Integrity Status | 30 pts | `30` if intact, `0` if tampered, `10` if unverified. |
| Custody Chain Health | 20 pts | Penalizes rejected (`-5`) or cancelled (`-3`) transfers. |
| Verification Frequency | 15 pts | `min(15, count * 3.75)` |
| Audit Trail Coverage | 15 pts | `min(15, log_count * 1.5)` |
| Verification Recency | 10 pts | Exponential decay: `10 * e^(-days_since / 30)` |
| Custodian Count | 10 pts | Optimal is ~2. Too many rapid handoffs are penalized. |

**Output:**
```json
{
  "score": 87,
  "grade": "A",
  "grade_label": "Excellent",
  "components": [
    { "name": "Integrity Status", "points": 30, "max_points": 30, "explanation": "Evidence has passed all integrity checks." }
  ],
  "risk_flags": ["Verification overdue by 15 days"],
  "summary": "This evidence has a strong chain of custody..."
}
```

### 2. Hash Chaining (`audit/services.py`)
Creates a blockchain-inspired, immutable audit log.

```
Hash_n = SHA256( action | entity_id | user_id | details | timestamp | Hash_(n-1) )
```

*   **Genesis**: The chain starts with `GENESIS_00...`.
*   **Validation**: `verify_chain_integrity()` reconstructs every hash to prove no entries were modified or deleted.

### 3. Natural Language Generation (NLG) (`audit/summary.py`)
Converts JSON audit logs into human-readable summaries.

*   **Context-Aware**: Adjusts tone based on evidence health (e.g., `WARNING` for tampered).
*   **Significance Ranking**: Highlights critical events (Uploads, Verifications) while summarizing mundane events (Views).

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Flask** | Web framework (Blueprints architecture) |
| **Flask-PyMongo** | MongoDB ODM |
| **Flask-JWT-Extended** | JWT-based authentication (Access + Refresh tokens) |
| **Flask-CORS** | Cross-Origin Resource Sharing |
| **bcrypt** | Password hashing |
| **hashlib** | SHA-256 hashing for evidence and audit chain |
| **ReportLab** | PDF generation |
| **Pillow** | Image watermarking |
| **OpenAI Whisper** | Audio/video transcription (optional) |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **Vite** | Build tool and dev server |
| **Tailwind CSS v4** | Utility-first styling |
| **Axios** | HTTP client with interceptors |
| **Lucide React** | Icon library |
| **Framer Motion** | Animations |
| **React Router DOM** | Client-side routing |

### Database
| Technology | Purpose |
|---|---|
| **MongoDB** | NoSQL database for flexible schemas |
| **MongoDB Atlas** | Cloud-hosted option (TLS support) |

---

## Setup & Installation

### Prerequisites
*   **Python**: 3.10+
*   **Node.js**: 18+
*   **MongoDB**: Local instance on `localhost:27017` or MongoDB Atlas URI

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Activate:
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET_KEY

python run.py
```
*Server runs on: `http://localhost:5000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Client runs on: `http://localhost:5173`*

### Environment Variables (`.env`)
| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string (e.g., `mongodb://localhost:27017/dcoc`) |
| `JWT_SECRET_KEY` | Secret key for signing JWTs |
| `UPLOAD_FOLDER` | Path for evidence file storage (default: `./uploads`) |
| `FLASK_ENV` | `development` or `production` |
| `OPENAI_API_KEY` | (Optional) For Whisper transcription |

---

## Roles & Permissions

| Role | Upload | Transfer | Verify | View Reports | Delete | Share | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Investigator** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Forensic Analyst** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Prosecutor** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Judge** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Auditor** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## License

This project is proprietary software developed for secure digital evidence management.
