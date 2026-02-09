# TrustAI Ideathon 2026 - Presentation Content
## Digital Chain of Custody (DCoC) with Explainable AI

---

## Slide 1 - Title Slide

**Problem Statement:** P.S. 3 | Digital Chain of Custody
**Tagline:** Secure integrity of digital evidence with Explainable AI-driven trust scoring and audit intelligence

**Team Name:** [Your Team Name]
**Members:** [Member Names]
**Affiliation:** [Your College/University]

---

## Slide 2 - Problem Statement

### Who Is Affected?

- **Law Enforcement & Investigators** - Collect digital evidence (disk images, photos, videos, logs) at crime scenes but lack reliable tools to prove it was never altered between collection and court.
- **Forensic Analysts & Labs** - Receive evidence from multiple sources with no standardized way to verify what they received matches what was originally collected.
- **Prosecutors & Defense Attorneys** - Must prove or challenge the authenticity of digital evidence; any undocumented gap in custody can get evidence thrown out.
- **Judges & Courts** - Need clear, understandable proof that evidence is genuine before admitting it into proceedings. Technical audit trails are incomprehensible to non-technical decision-makers.
- **Victims & the Public** - Justice depends on admissible evidence; tampered or poorly handled digital evidence means criminals go free or innocents are wrongly convicted.

### Why Does It Matter?

- Digital data is **fragile** - it can be altered, copied, or deleted without visible traces, unlike physical evidence.
- **85% of criminal cases** now involve some form of digital evidence (emails, CCTV, phone data, social media).
- A **single gap** in the chain of custody (who handled it, when, and how) is enough for a court to rule evidence **inadmissible**.
- Existing processes rely on **manual documentation** (paper logs, spreadsheets) that are error-prone, easily forged, and hard to verify.
- Raw technical audit trails (hashes, timestamps, log entries) are **meaningless to judges and juries** without human-readable explanation.
- There is **no standardized way to quantify** how trustworthy a piece of digital evidence is - it's either "we followed procedure" or it isn't.

---

## Slide 3 - Proposed Solution

### What We Built: Digital Chain of Custody (DCoC) System with Explainable AI

A full-stack web application that creates a **tamper-proof, cryptographically verifiable trail** for every piece of digital evidence, enhanced with **Explainable AI** that provides transparent trust scoring and human-readable audit intelligence.

### Core Features

1. **SHA-256 Hash-at-Upload** - Cryptographic fingerprint computed the instant evidence is uploaded, creating an immutable baseline that can detect even a single byte change.

2. **Hash-Chained Audit Log** - Every action (upload, view, verify, transfer) is logged in an append-only ledger where each entry's hash includes the previous entry's hash - any tampering breaks the entire chain.

3. **Formal Custody Transfer Workflow** - State machine (Request -> Approve -> Complete) with mandatory reason, both-party acknowledgment, and automatic audit logging at every step.

4. **Role-Based Access Control** - 6 roles (Admin, Investigator, Forensic Analyst, Prosecutor, Judge, Auditor) with granular permissions. Every access is authenticated and logged.

### XAI Features (Trusted AI)

5. **Explainable Trust Score (XAI)** - An algorithmic trust score (0-100) computed from 6 weighted factors with SHAP-like feature attribution. Each factor shows exactly how many points it contributed and why, making the AI decision fully transparent and auditable. Judges can see not just "this evidence is trustworthy" but exactly WHY.

6. **AI-Generated Audit Summaries (XAI)** - Template-based Natural Language Generation that converts raw technical audit logs into court-friendly narratives. Automatically generates integrity analysis, custody chain analysis, risk assessments with recommendations, and key event highlights - all in plain English that non-technical judges and juries can understand.

### What Makes It Innovative

- **Explainable by Design** - Unlike black-box AI, every score and summary is fully transparent. Users see the exact factors, weights, and reasoning behind every trust assessment. No hidden decisions.
- **Hash Chaining without Blockchain overhead** - Achieves blockchain-like immutability using pure SHA-256 hash chaining, without cost, complexity, or energy consumption.
- **Forensic Watermarking** - Evidence previews are overlaid with the viewer's identity and timestamp, creating accountability without modifying the original file.
- **Zero-Trust Audit Architecture** - The audit chain can be independently verified by walking all entries and recomputing hashes - if any single entry was altered, verification fails.
- **Court-Ready PDF Reports** - One-click generation of professionally formatted reports with evidence metadata, hash history, custody timeline, and verification status.

---

## Slide 4 - Significance & Benefits

### For Law Enforcement

- **Eliminates manual documentation errors** - Automatic audit logging replaces paper-based chain of custody forms.
- **Proves evidence integrity mathematically** - SHA-256 hashes provide cryptographic proof, not just a person's word.
- **Proactive risk identification** - XAI Trust Score flags evidence with weak custody chains or overdue verifications BEFORE court submission.
- **Reduces case dismissals** - Unbroken, verifiable chain of custody prevents defense challenges.

### For Forensic Labs

- **Standardized handoff process** - Every transfer follows the same workflow regardless of agency, lab, or jurisdiction.
- **Complete traceability** - Every person who touched evidence, when, and why is permanently recorded.
- **Quantified evidence quality** - Trust Score gives analysts an objective measure of evidence handling quality (Grade A through F).

### For the Legal System

- **AI translates technical to legal** - Audit summaries convert complex hash chains and log entries into plain English narratives that judges and juries can understand.
- **Explainable trust decisions** - Trust Score shows the exact factors behind every assessment. No black-box AI - every decision is auditable and challengeable.
- **Risk flags with recommendations** - System proactively identifies issues (never verified, stale verification, custody disputes) and suggests corrective actions.
- **Faster case processing** - Automated verification and AI-generated reporting reduces preparation time.

### For Safe & Trusted AI

- **Transparency** - Every AI decision is fully explainable with factor-level attribution.
- **No hidden bias** - Rule-based algorithmic scoring, not opaque neural networks. The scoring formula is inspectable.
- **Auditability** - The AI system's own decisions are logged and reproducible.
- **Human oversight** - AI provides recommendations; humans make final decisions.

### Problems Directly Solved: 20 out of 22 identified challenges in digital evidence management.

---

## Slide 5 - Technical Solution (Overall Architecture)

### System Architecture

```
+------------------------------------------------------------------+
|                      FRONTEND (React + Vite)                      |
|  +-----------+ +----------+ +---------+ +---------+ +---------+  |
|  | Dashboard | | Evidence | | Cases   | | Audit   | |Transfers|  |
|  | Stats &   | | Upload/  | | Timeline| | Logs &  | | Request/|  |
|  | Activity  | | Verify/  | | Create/ | | Chain   | | Approve/|  |
|  |           | | Preview  | | Close   | | Verify  | | Complete|  |
|  +-----------+ +----------+ +---------+ +---------+ +---------+  |
|  +---------------------+ +---------------------+                 |
|  | XAI Trust Score     | | XAI Audit Summary   |                 |
|  | Circular Ring +     | | NLG Narratives +    |                 |
|  | Factor Breakdown    | | Risk Assessment     |                 |
|  +---------------------+ +---------------------+                 |
+-----------------------------+------------------------------------+
                              | Axios + JWT
+-----------------------------v------------------------------------+
|                   BACKEND (Python Flask)                          |
|                                                                   |
|  +------+ +--------+ +------+ +---------+ +------+ +---------+  |
|  | Auth | |Evidence| |Cases | |Transfers| |Audit | | Reports |  |
|  | JWT  | | SHA256 | | CRUD | | State   | | Hash | | PDF Gen |  |
|  | RBAC | | Upload | | Link | | Machine | |Chain | |         |  |
|  +------+ +--------+ +------+ +---------+ +------+ +---------+  |
|                                                                   |
|  +---------------------------+ +-----------------------------+   |
|  | XAI: Trust Score Engine   | | XAI: Audit Summary Engine  |   |
|  | 6-Factor Weighted Scoring | | Template-based NLG         |   |
|  | SHAP-like Attribution     | | Risk Analysis & Flagging   |   |
|  | Grade Computation (A-F)   | | Court-Friendly Narratives  |   |
|  +---------------------------+ +-----------------------------+   |
|                                                                   |
|  Security Layer: JWT Auth + bcrypt + RBAC Decorators              |
+-----------------------------+------------------------------------+
                              |
                +-------------v--------------+
                |      MongoDB Database      |
                |  users | cases | evidence  |
                |  audit_logs | transfers    |
                |  hash_records | notifs     |
                +----------------------------+
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Vite + Tailwind CSS | Fast dev, modern UI, responsive |
| Backend | Python Flask (Blueprints) | Lightweight, modular, forensic libraries available |
| Database | MongoDB | Flexible schema for varied evidence metadata |
| Auth | JWT + bcrypt | Stateless auth, secure password storage |
| Hashing | SHA-256 (hashlib) | Industry-standard cryptographic integrity |
| XAI Engine | Python (math, collections) | Rule-based scoring, no external AI APIs needed |
| NLG Engine | Python template strings | Court-friendly narrative generation |
| Reports | ReportLab | Professional PDF generation |
| Watermarking | Pillow (PIL) | Forensic watermark overlay |

---

## Slide 6 - Approach & Methodology

### XAI Trust Score Algorithm (Key Innovation)

```
Evidence Trust Score = Sum of 6 Weighted Factors (0-100)

+-------------------------------+-----+----------------------------------------+
| Factor                        | Max | How It's Computed                      |
+-------------------------------+-----+----------------------------------------+
| 1. Integrity Status           |  30 | intact+verified=30, unverified=10,     |
|                                |     | tampered=0                             |
| 2. Verification Frequency     |  15 | min(15, count * 3.75)                  |
| 3. Custody Chain Completeness |  20 | 20 - (rejected*5 + cancelled*3 +       |
|                                |     | pending*2)                             |
| 4. Audit Trail Coverage       |  15 | min(15, log_count * 1.5)               |
| 5. Verification Recency       |  10 | 10 * e^(-days_since/30)                |
|                                |     | (exponential decay)                    |
| 6. Custodian Count            |  10 | 2 custodians=10 (ideal), 1=8, 3=8,    |
|                                |     | 4-5=5, 6+=3                            |
+-------------------------------+-----+----------------------------------------+

Grade: A (>=90) | B (>=75) | C (>=55) | D (>=35) | F (<35)

XAI Output Per Factor:
  { name, score, max_score, percentage, explanation, status }

Example: "Integrity Status: 30/30 (100%) - Evidence integrity is verified
          intact with 3 successful verification(s)." [status: good]
```

### AI Audit Summary - Template-based NLG

```
Input: Raw audit logs + hash records + transfers + evidence metadata

Processing Pipeline:
  1. Query all related data from 4 MongoDB collections
  2. Compute statistics (action counts, unique users, time span)
  3. Select context-aware templates based on evidence state:
     - intact → positive narrative
     - tampered → WARNING narrative
     - unverified → cautionary narrative
  4. Generate 3 narratives:
     a. Main summary (who, what, when, current state)
     b. Integrity analysis (verification history, hash status)
     c. Custody analysis (transfer completeness, chain quality)
  5. Identify risk flags with severity + recommendations
  6. Rank key events by significance (high/medium/low)

Output: Court-friendly natural language that non-technical
        judges and juries can understand
```

### Hash Chaining Algorithm

```
Genesis Entry:
  previous_hash = "0000000000...000" (64 zeros)

For each new audit log entry:
  hash_input = f"{action}|{entity_id}|{user_id}|{details}|{timestamp}|{previous_hash}"
  current_hash = SHA256(hash_input)
  Store: { ..., hash: current_hash, previous_hash: previous_hash }

Chain Verification:
  Walk all entries in sequence
  For each: recompute hash from fields + previous entry's hash
  If recomputed != stored -> CHAIN BROKEN (tampering detected)
  If all match -> CHAIN INTACT
```

### Custody Transfer State Machine

```
                  +----------+
    Initiator --> | PENDING  | <-- Only current custodian can initiate
                  +----+-----+
                       |
              +--------+--------+
              |                 |
         Recipient          Initiator
         approves           cancels
              |                 |
        +-----v-----+    +-----v------+
        | APPROVED  |    | CANCELLED  |
        +-----+-----+    +------------+
              |
         Initiator
         completes
              |
        +-----v------+
        | COMPLETED  | --> Custody updated, audit logged
        +------------+

   At any point: Recipient can REJECT --> Transfer ends
```

---

## Slide 7 - Conclusion & Future Scope

### What We Achieved

- A **complete Digital Chain of Custody system** with **Explainable AI** addressing 20 out of 22 identified challenges.
- **XAI Trust Score** - Transparent, 6-factor weighted scoring with SHAP-like attribution. Every trust decision is fully explainable, auditable, and free from hidden bias.
- **AI Audit Summaries** - Template-based NLG converts raw technical logs into court-friendly narratives with risk analysis and recommendations.
- **Tamper-evident audit trail** using hash chaining - any modification is cryptographically detectable.
- **End-to-end evidence lifecycle** from upload to court-ready report, with integrity verification at every step.
- **Safe AI by design** - No black-box models. Rule-based, transparent, reproducible, and auditable AI decisions.
- **Zero licensing cost** - entirely open-source stack deployable by any agency.

### How It Aligns with "Safe and Trusted AI"

| Principle | How We Implement It |
|-----------|-------------------|
| **Transparency** | Every score shows exact factor breakdown with explanations |
| **Explainability** | SHAP-like attribution: users see which factors contributed how many points and why |
| **Fairness** | Rule-based scoring - no training data bias, same formula for all evidence |
| **Accountability** | AI decisions are logged, reproducible, and challengeable in court |
| **Human Oversight** | AI recommends, humans decide. Risk flags suggest actions, don't enforce them |
| **Robustness** | No external API dependencies. Works offline. Deterministic outputs |

### Future Scope

1. **Blockchain Anchoring** - Publish hash chain checkpoints to a public blockchain for independent third-party verification.

2. **ML-Based Anomaly Detection** - Train models on normal access patterns to detect suspicious behavior (unusual hours, bulk downloads, cross-case access) with SHAP explanations for each alert.

3. **Digital Signatures (RSA/ECDSA)** - Add cryptographic signing to transfers for legal non-repudiation.

4. **Cross-Agency Federation** - Enable secure evidence sharing between different agencies/jurisdictions with mutual verification.

5. **Mobile Evidence Collection** - Field app for investigators to capture and upload evidence directly from crime scenes with GPS tagging.

6. **Compliance Certification** - Align with ISO/IEC 27037, NIST SP 800-86, and India's Section 65B requirements.

---

## Slide 8 - References

1. TrackerProducts. "Major Issues in Cyber Evidence Management: Challenges and Solutions." https://trackerproducts.com/major-issues-in-cyber-evidence-management-challenges-and-solutions-2/

2. American Military University. "How Is Digital Evidence Preserved in Modern Investigations?" https://www.amu.apus.edu/area-of-study/criminal-justice/resources/how-is-digital-evidence-preserved/

3. Eviden. "6 Basic Requirements for Your Chain of Custody." https://eviden.com/publications/digital-security-magazine/detect-early-respond-swiftly/chain-of-custody-the-importance-of-correct-evidence-collection-for-the-litigation-process/

4. DigitalEvidence.AI. "Broken Chain of Custody: Causes, Consequences and How to Prevent." https://digitalevidence.ai/blog/broken-chain-of-custody

5. IJSRST. "Admissibility and Challenges of Digital Evidence in Legal Proceedings." https://ijsrst.com/paper/12484.pdf

6. NIH/PMC. "The Chain of Custody in the Era of Modern Forensics." https://pmc.ncbi.nlm.nih.gov/articles/PMC10000967/

7. SEFCOM, ASU. "Digital Evidence Chain of Custody - Systematization of Knowledge." https://sefcom.asu.edu/publications/CoC-SoK-tps2024.pdf

8. Cornerstone Discovery. "Maintaining Chain of Custody in Digital Forensics." https://cornerstonediscovery.com/maintaining-chain-of-custody-in-digital-forensics-what-you-should-know/

9. UNODC. "Digital Evidence Admissibility." https://www.unodc.org/cld/en/education/tertiary/cybercrime/module-6/key-issues/digital-evidence-admissibility.html

10. Eclipse Forensics. "Admissibility of Digital Evidence in Court." https://eclipseforensics.com/admissibility-of-digital-evidence-in-court-what-you-need-to-know/

11. Lundberg & Lee. "A Unified Approach to Interpreting Model Predictions (SHAP)." NeurIPS 2017. https://papers.nips.cc/paper/7062-a-unified-approach-to-interpreting-model-predictions

12. Ribeiro et al. "Why Should I Trust You? Explaining the Predictions of Any Classifier (LIME)." KDD 2016. https://arxiv.org/abs/1602.04938
