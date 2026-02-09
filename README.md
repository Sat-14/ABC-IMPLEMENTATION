# Digital Chain of Custody (DCoC) with Explainable AI

**Secure integrity of digital evidence for legal and forensic proceedings using Blockchain-inspired Hash Chaining and Explainable AI (XAI).**

This system provides a tamper-proof, cryptographically verifiable trail for digital evidence, enhanced with XAI to provide transparent trust scoring and human-readable audit intelligence for investigators, prosecutors, and judges.

---

## 🚀 Key Features

### 🛡️ Evidence Integrity & Security
*   **Immutable Audit Log**: Uses **SHA-256 Hash Chaining** (similar to Blockchain) to link every action. Any tampering with a log entry invalidates the entire subsequent chain.
*   **Automatic Hashing**: Evidence is hashed (SHA-256) immediately upon upload.
*   **Integrity Verification**: On-demand re-hashing to compare current file state against the original upload hash.
*   **Zero-Trust Architecture**: The `verify_chain_integrity()` algorithm walks the entire database to cryptographically validate the audit trail.

### 🧠 Explainable AI (XAI) Intelligence
*   **XAI Trust Score Engine**: An algorithmic "Credit Score" (0-100) for evidence.
    *   **Transparent Scoring**: Breaks down the score into 6 weighted factors (e.g., integrity, custody health).
    *   **Explainable**: Tells users *exactly* why a score is low (e.g., "Verification overdue by 45 days").
*   **AI Audit Summaries (NLG)**:
    *   Converts raw technical JSON logs into **Court-Friendly Narratives**.
    *   Generates "Integrity Analysis" and "Custody Timeline" in plain English.
    *   **Risk Analysis**: Proactively flags issues like sparse logging or disputed transfers.

### 📋 Chain of Custody Management
*   **Formal Transfer Workflow**: Finite State Machine (`Pending` -> `Approved` -> `Completed`) for handing over evidence.
*   **Role-Based Access Control (RBAC)**: 6 distinct roles with granular permissions:
    *   *Admin, Investigator, Forensic Analyst, Prosecutor, Judge, Auditor*.
*   **Digital Signatures**: Transfers require cryptographic signing by both sender and recipient.

---

## 🧠 Algorithms & Technical Details

This project implements several advanced algorithms to ensure security and transparency.

### 1. XAI Trust Score Algorithm
A heuristic engine that computes a credibility score based on weighted factors.
*   **Formula**: `Score = Σ (Factor_Score * Weight)`
*   **Factors**:
    1.  **Integrity Status (30 pts)**: `30` if intact, `0` if tampered, `10` if unverified.
    2.  **Custody Chain Health (20 pts)**: Penalizes rejected (`-5`) or cancelled (`-3`) transfers.
    3.  **Verification Frequency (15 pts)**: Rewards regular checks (`min(15, count * 3.75)`).
    4.  **Audit Trail Coverage (15 pts)**: Rewards comprehensive logging (`min(15, log_count * 1.5)`).
    5.  **Verification Recency (10 pts)**: Exponential decay function: `10 * e^(-days_since_check / 30)`.
    6.  **Custodian Count (10 pts)**: Optimals (~2 custodians) score highest; rapid handoffs are penalized.

### 2. Natural Language Generation (NLG) for Audits
Rule-based text generation engine (`backend/app/audit/summary.py`) that interprets metadata:
*   **Context-Aware Templates**: Selects different narrative tones based on evidence health (e.g., "WARNING" tone if tampered).
*   **Significance Ranking**: Filters hundreds of logs to highlight "High Significance" events (Uploads, Transfers, Verifications) while summarizing "Low Significance" events (Views).

### 3. Cryptographic Hash Chaining
Ensures the database acts as an immutable ledger without the overhead of a decentralized blockchain.
*   **Structure**: `Current_Hash = SHA256( Action + UserID + Timestamp + Previous_Entry_Hash )`
*   **Genesis Block**: The chain starts with a hardcoded mechanism (`GENESIS_00...`).
*   **Validation**: The system can reconstruct the hash compatibility of the entire history to prove no rows were deleted or modified by a database admin.

---

## 🛠️ Tech Stack

### Backend
*   **Framework**: Python Flask (Modular "Blueprints" architecture)
*   **Database**: MongoDB (Flexible schema for complex audit logs & metadata)
*   **Security**:
    *   `hashlib` (SHA-256 for evidence & chain hashing)
    *   `Flask-JWT-Extended` (Stateless Authentication)
    *   `bcrypt` (Password hashing)
*   **Utilities**: `ReportLab` (PDF Report Generation), `Pillow` (Watermarking)

### Frontend
*   **Framework**: React 19 + Vite (Modern, fast build tool)
*   **Styling**: Tailwind CSS v4 (Utility-first, responsive design)
*   **HTTP Client**: Axios (with Interceptors for JWT handling)
*   **Icons**: Lucide React

---

## 📦 Prerequisites

*   **Python**: 3.10+
*   **Node.js**: 18+
*   **MongoDB**: Local instance running on `localhost:27017`

---

## 🔧 Setup & Installation

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Activate Virtual Environment:
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env  # Configure your MongoDB URI and Secret Keys
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

---

## 🔑 Default Roles & Permissions

| Role | Upload | Transfer | Verify | View Reports | Delete |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Investigator** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Forensic Analyst** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Prosecutor** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Judge** | ❌ | ❌ | ✅ | ✅ | ❌ |
