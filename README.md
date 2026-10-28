# BrandWarden 🛡️
> **Evidence-First Brand Governance Web Application**  
> *Content goes in, it is checked against approved guidelines and facts, issues come back explained with the exact verbatim source quote, and a human decides.*

---

## What It Does
In high-stakes brand marketing, unverified claims, outdated figures, and inconsistent voice damage customer trust and create legal exposure. Traditional LLM-based checkers frequently hallucinate rules or suggest changes that drift away from the creator's intent.

**BrandWarden** solves this with an **Evidence Gate**:
1. Draft copy is ingested (pasted text or DOCX) alongside a required one-line **intended message**.
2. A deterministic **Rule Engine** catches banned words, unapproved terminology (e.g. "clients" vs. "customers"), and exclamation spam.
3. A **Claim Checker** detects superlatives (#1, best, leading), absolute guarantees, and audits numerical values against approved operational facts (e.g. catching an outdated "$50 free shipping" claim when approved policy is "$75").
4. An **AI Judge** (Claude 3.5 / Gemini 1.5) analyzes tone and messaging using only top BM25-retrieved guideline clauses.
5. **The Evidence Gate**: Every candidate finding must quote an approved clause or fact **verbatim**. Any finding with an invented or unverified quote is discarded and logged in the transparency audit log.
6. The **Suggestion Engine** proposes non-destructive edits and runs an intent-drift check to flag potential meaning alterations.
7. A complete **Review Workflow** enforces role-based approvals, blocking high-severity violations unless explicitly overridden with an audit-logged justification.

---

## Architecture Diagram

```
                 +-------------------------------------------------+
                 |       Client (React + Vite + Tailwind CSS)      |
                 |  No-Login Header Role Switcher (Creator/Admin)  |
                 +------------------------+------------------------+
                                          |
                                    REST API calls
                                    with X-Role
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                         FastAPI Unified Web Service                               |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                           ANALYSIS PIPELINE                                 |  |
|  |                                                                             |  |
|  |  [Input Text + Intended Message]                                            |  |
|  |            |                                                                |  |
|  |            +----> 1. Rule Engine (Terminology, Banned Words, Punctuation)   |  |
|  |            |                                                                |  |
|  |            +----> 2. Claim Checker (Superlatives, Guarantees, Fact Audits)  |  |
|  |            |                                                                |  |
|  |            +----> 3. BM25 Retrieval & PII Masking ([EMAIL], [PHONE])        |  |
|  |            |                                                                |  |
|  |            +----> 4. AI Judge (Claude / Gemini with 10s timeout & cache)    |  |
|  |            |                                                                |  |
|  |            +----> 5. EVIDENCE GATE (Verifies quotes verbatim against DB)    |  |
|  |            |         * Suppresses unverified findings with audit reason     |  |
|  |            |                                                                |  |
|  |            +----> 6. Suggestion Engine (Intent-drift detection)             |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|                  +----------------------+----------------------+                  |
|                  |                                             |                  |
|                  v                                             v                  |
|      +------------------------+                    +------------------------+     |
|      |  Guideline Library     |                    |  Review & Audit Log    |     |
|      |  - Clauses (V-2.1 etc) |                    |  - Status Transitions  |     |
|      |  - Approved Facts      |                    |  - Approval Overrides  |     |
|      |  - Heading Docx Parser |                    |  - Word Diff History   |     |
|      +-----------+------------+                    +-----------+------------+     |
|                  |                                             |                  |
|                  +----------------------+----------------------+                  |
|                                         v                                         |
|                       SQLAlchemy ORM (SQLite / PostgreSQL)                        |
+-----------------------------------------------------------------------------------+
```

---

## Completed Features
- [x] **No-Login Demo Access**: Header role dropdown (Creator, Reviewer, Manager, Admin) sending role headers and enforcing permissions in FastAPI. Landing page includes a 1-click "Try the Northwind Demo" button.
- [x] **Northwind Outdoor Seed Data**: Pre-loaded guideline clauses (`V-2.1`, `T-09`, `C-3.2`, `C-3.4`, `A-1.1`, `S-1.0`), approved operational facts, and the sample draft.
- [x] **Deterministic Rule Engine**: Preferred terms ("customers" instead of "clients"), exclamation mark frequency, and sentence length checks.
- [x] **Claim Verification**: Superlative detection (`#1`, `best`, `leading`), unconditional guarantee detection (`guaranteed`, `forever`), and direct numerical conflict auditing against verified facts.
- [x] **The Evidence Gate**: Filters candidate findings so only findings citing verbatim quotes in stored clauses/facts survive.
- [x] **AI Adapter with Graceful Fallback**: Claude (3.5 Haiku) and Gemini (1.5 Flash) adapter with 10-second timeout, SHA-256 caching, and automatic fallback to deterministic checks with an "AI unavailable, deterministic checks only" badge.
- [x] **PII Masking**: Emails, phone numbers, and confidential terms masked prior to external AI calls.
- [x] **Suggestion Engine with Drift Detection**: Context-aware non-destructive suggestions with token-overlap intent-drift warnings.
- [x] **Findings Workspace**: Content display with highlighted spans, finding cards, severity and confidence badges, exact clickable source quotes that open clause modals, and Accept/Edit/Dismiss actions.
- [x] **Pipeline Transparency Panel**: Displays candidate findings count, evidence gate discards, verified findings shown, pipeline stages run, and expandable discard reason logs.
- [x] **Review Workflow**: Statuses (`draft`, `in_review`, `needs_changes`, `approved`, `rejected`), comments thread, version diff viewer, and mandatory approval override justification for open high-severity findings.
- [x] **Guideline Library**: Browse and search clauses/facts; Admin capability to add clauses or bulk upload DOCX/MD/TXT documents split into clauses by headings.
- [x] **Single Service Dockerfile**: Multi-stage build producing a single container hosting both the Vite React SPA and FastAPI backend.

---

## How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ (for building the frontend)

### 1. Clone & Set Up Backend
```bash
git clone <repo-url>
cd BrandWarden

# Create and activate virtual environment (optional)
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Build the Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### 3. Run the Backend & Web App
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Open your browser at **`http://localhost:8000`**. The application is pre-seeded and ready to use immediately with no login or setup.

### 4. Running Tests
```bash
pytest backend/tests/ -v
```
To run the automated end-to-end smoke test of the complete demo journey:
```bash
pytest backend/tests/test_smoke.py -v
```

---

## Deployment
BrandWarden is packaged as a single Docker container via `Dockerfile`.

### Deploying to Render
1. Connect repository to [Render](https://render.com).
2. Render detects `render.yaml` or create a Web Service using Docker environment.
3. Health check path: `/health`.
4. (Optional) Set `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` in Render environment variables. If left empty, the app runs in deterministic mode.

---

## Honest Known Limitations
- **Document Formats**: Ingests plain text and DOCX files. PDF or image review and visual accessibility checks are deferred to future milestones.
- **Diff Granularity**: Version comparisons use a fast, word-level Longest Common Subsequence (LCS) diff; rich formatting markup differences inside DOCX are flattened to text for diffing.
- **In-Memory / SQLite Default**: By default, SQLite stores data locally. For production deployments with multiple ephemeral replicas, configure `DATABASE_URL` to point to PostgreSQL.

---

## Disclosures
- **AI Models & Services**: Anthropic Claude (`claude-3-5-haiku-20241022`) and Google Gemini (`gemini-1.5-flash`) via their respective official client SDKs.
- **Core Open-Source Libraries**: FastAPI, SQLAlchemy, Pydantic, python-docx, rank-bm25, scikit-learn, React 18, Vite, Tailwind CSS, Lucide React, Pytest, HTTPX.
- **AI Coding Assistance Disclosure**: Google Antigravity and AI coding agents assisted in architecting, writing, and testing code across this project.
