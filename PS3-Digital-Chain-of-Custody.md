# P.S. 3 | Digital Chain of Custody

> Secure integrity of digital evidence for legal and forensic proceedings.

---

## Problem Overview

Digital evidence (disk images, logs, photos, videos, documents) passes through multiple hands — from collection at a crime scene to presentation in court. Any gap or tampering in this chain makes evidence inadmissible. A **Digital Chain of Custody (DCoC)** system provides a tamper-proof, auditable trail that proves evidence was never altered.

---

## Core Features

### 1. Evidence Ingestion & Registration
- Upload digital evidence files (images, videos, documents, disk images, logs)
- Auto-generate cryptographic hash (SHA-256 / SHA-3) at the moment of upload
- Capture metadata: file name, size, type, timestamps, GPS/location (if available)
- Assign a unique **Evidence ID** (UUID) to every item
- Tag evidence with case number, category, and classification level

### 2. Tamper-Proof Hashing & Integrity Verification
- Compute and store SHA-256 / SHA-3 hash at every custody event
- On-demand **integrity check** — re-hash the file and compare against the stored hash
- Visual indicator: green (intact) / red (tampered / mismatch)
- Support for hash chaining — each new hash includes the previous hash (blockchain-like)

### 3. Immutable Audit Trail / Activity Log
- Every action logged with: who, what, when, where, why
  - Access, view, download, transfer, modify metadata, verify
- Logs stored in an **append-only** data structure (no edits, no deletes)
- Timestamped with server time + optional NTP-verified time
- Export audit trail as a PDF report for court submission

### 4. Role-Based Access Control (RBAC)
- **Roles:** Admin, Investigator, Forensic Analyst, Prosecutor, Judge/Court, Auditor
- Granular permissions per role:
  | Role             | Upload | View | Transfer | Verify | Delete | Admin |
  |------------------|--------|------|----------|--------|--------|-------|
  | Admin            | Yes    | Yes  | Yes      | Yes    | Yes    | Yes   |
  | Investigator     | Yes    | Yes  | Yes      | Yes    | No     | No    |
  | Forensic Analyst | No     | Yes  | No       | Yes    | No     | No    |
  | Prosecutor       | No     | Yes  | No       | Yes    | No     | No    |
  | Judge/Court      | No     | Yes  | No       | Yes    | No     | No    |
  | Auditor          | No     | Yes  | No       | Yes    | No     | No    |
- Multi-factor authentication (MFA) for sensitive operations

### 5. Custody Transfer & Handoff
- Formal **transfer request** workflow (request → approve → confirm)
- Both parties must digitally sign the transfer
- Transfer logs include: from, to, reason, timestamp, location
- Notification system (email / in-app) on transfer events
- Evidence cannot be in limbo — always assigned to exactly one custodian

### 6. Digital Signatures & Authentication
- Each user signs actions using a digital signature (RSA / ECDSA)
- Signature verification to confirm identity of the signer
- Optional integration with PKI (Public Key Infrastructure)
- Non-repudiation — signers cannot deny their actions

---

## Advanced / Add-On Features

### 7. Blockchain-Based Immutable Ledger
- Store evidence hashes and custody events on a blockchain (Ethereum / Hyperledger / custom)
- Smart contracts to automate transfer rules and access policies
- Public verifiability — anyone with the hash can verify evidence integrity
- Decentralized trust — no single entity can alter the record

### 8. Evidence Preview & Secure Viewer
- In-browser preview for images, PDFs, text files, and videos
- **Watermarked viewing** — overlay user ID and timestamp on previews
- No raw download allowed for restricted roles — view-only mode
- Screenshot detection warning (optional)

### 9. Case Management Integration
- Link evidence to cases, suspects, witnesses, and incidents
- Case timeline view — visualize when each piece of evidence was collected and transferred
- Search and filter evidence by case, date, type, custodian, or status
- Dashboard with case statistics and evidence counts

### 10. Reporting & Court-Ready Export
- Generate **Chain of Custody Report** (PDF) containing:
  - Evidence details and metadata
  - Full hash history
  - Complete custody transfer timeline
  - Digital signatures of all custodians
  - Integrity verification result at time of export
- Timestamped and digitally signed report
- Compliant with legal standards (FRE, ACPO guidelines)

### 11. Notification & Alert System
- Real-time alerts for:
  - Unauthorized access attempts
  - Integrity check failures (tamper detection)
  - Custody transfer requests pending approval
  - Evidence nearing retention deadline
- Email, SMS, and in-app notification channels

### 12. Evidence Retention & Disposal Policy
- Configure retention periods per case or evidence type
- Auto-flag evidence approaching end-of-retention
- Secure deletion workflow with multi-party approval
- Disposal logged permanently in the audit trail

### 13. Multi-Format Evidence Support
- Disk images (.dd, .E01, .raw)
- Documents (.pdf, .docx, .xlsx)
- Media (.jpg, .png, .mp4, .wav)
- Log files (.log, .csv, .json, .xml)
- Email archives (.eml, .pst, .mbox)
- Network captures (.pcap)
- Compressed archives (.zip, .tar.gz) — with extraction and individual hashing

### 14. Geolocation & Device Tracking
- Record GPS coordinates at evidence collection
- Track which device was used for upload/access
- Map view showing where evidence was collected and transferred
- Device fingerprinting for access logs

### 15. API & Integration Layer
- RESTful API for third-party tool integration
- Integrate with forensic tools (Autopsy, FTK, EnCase)
- Webhook support for event-driven workflows
- Import/export in standard formats (CASE/UCO ontology)

---

## Tech Stack Suggestions

| Layer          | Options                                              |
|----------------|------------------------------------------------------|
| Frontend       | React.js / Next.js / Angular                         |
| Backend        | Node.js (Express) / Python (Django/Flask) / Java (Spring Boot) |
| Database       | PostgreSQL / MongoDB (evidence metadata)             |
| File Storage   | AWS S3 / MinIO / Local encrypted storage             |
| Blockchain     | Ethereum (Solidity) / Hyperledger Fabric / Polygon   |
| Hashing        | SHA-256 / SHA-3 (built-in crypto libraries)          |
| Auth           | JWT + OAuth 2.0 + TOTP (MFA)                         |
| Digital Signing| RSA / ECDSA via OpenSSL or Web Crypto API            |
| Deployment     | Docker + Kubernetes / AWS / Azure                    |

---

## Module Breakdown (Build Priority)

### Phase 1 — MVP (Must Have)
1. User authentication & RBAC
2. Evidence upload with SHA-256 hashing
3. Immutable audit/activity log
4. Integrity verification (re-hash & compare)
5. Basic custody transfer workflow
6. Evidence listing, search, and filtering

### Phase 2 — Enhanced
7. Digital signatures on actions
8. Court-ready PDF report generation
9. Case management & linking
10. Notification & alert system
11. Evidence preview with watermarking

### Phase 3 — Advanced
12. Blockchain integration for hash storage
13. Geolocation & device tracking
14. API layer & third-party integrations
15. Retention & secure disposal policy engine

---

## Key Differentiators (What Makes It Stand Out)

- **Hash chaining** — each event hash includes the previous, forming a verifiable chain
- **Blockchain anchoring** — publish hash checkpoints on a public blockchain for independent verification
- **Court-ready reports** — one-click export with all legally required documentation
- **Zero-trust access** — every access is logged, verified, and signed
- **Standards compliance** — aligns with NIST SP 800-86, ACPO, ISO 27037

---

## Sample User Flows

### Evidence Collection
```
Investigator collects file at crime scene
  → Uploads to system (hash generated automatically)
    → System assigns Evidence ID + records metadata
      → Custody assigned to Investigator
        → All actions logged in immutable audit trail
```

### Custody Transfer
```
Investigator initiates transfer to Forensic Analyst
  → Analyst receives notification
    → Analyst accepts transfer
      → Both digitally sign the handoff
        → Custody updated, event logged, hashes recorded
```

### Court Submission
```
Prosecutor requests integrity verification
  → System re-hashes evidence and compares
    → Verification result: INTACT
      → Generate Chain of Custody PDF report
        → Report includes full timeline, signatures, and hash history
          → Submit to court as admissible evidence
```

---

## Database Schema (Key Entities)

- **Users** — id, name, email, role, public_key, mfa_secret
- **Cases** — id, case_number, title, description, status, created_at
- **Evidence** — id, case_id, file_name, file_path, file_size, file_type, original_hash, current_custodian_id, status, uploaded_at
- **CustodyTransfers** — id, evidence_id, from_user_id, to_user_id, reason, status (pending/accepted/rejected), signed_by_from, signed_by_to, timestamp
- **AuditLogs** — id, evidence_id, user_id, action, details, ip_address, device_info, hash_at_event, previous_log_hash, timestamp
- **HashRecords** — id, evidence_id, hash_value, algorithm, computed_at, computed_by, blockchain_tx_id

---

*This document serves as a feature reference and planning guide for building the Digital Chain of Custody system.*
