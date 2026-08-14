# Risk Register

## Table of contents

- [Overview](#overview)
- [Tech stack](#tech-stack)
- [Features](#features)
- [Local setup](#local-setup)
- [API](#api)
- [Risk scoring](#risk-scoring)
- [Business rule](#business-rule)
- [Design decisions / assumptions](#design-decisions--assumptions)
- [What I’d do with more time](#what-id-do-with-more-time)
- [Testing](#testing)
- [Tools used](#tools-used)

## Overview

Risk Register is a full stack app for tracking organizational risks and the mitigations that reduce them.

You can create risks, attach mitigations, and see how residual risk changes as controls are added or removed. Inherent and residual scores (with severity bands) are calculated by the backend and shown in a React dashboard.

## Tech stack

**Backend**

- Node.js
- Express 5
- SQLite via `better-sqlite3`
- Zod (request validation)

**Frontend**

- React 19 + TypeScript
- Vite
- React Router
- Radix UI Themes

## Features

- Risk dashboard with title, category, status, inherent/residual scores, severity badges, and mitigation count
- Filter risks by category and/or status (AND when both are set)
- List sorted by residual score descending (API)
- Create and edit risks (shared form) with live inherent score preview
- Risk detail page with mitigations
- Add, edit, and delete mitigations; residual score and mitigation count update from the API response
- Delete a risk from the detail page (cascades mitigations)
- Business rule: a risk cannot be Closed with zero mitigations
- Loading, empty, and error states on the main screens
- Backend unit and API integration tests

## Local setup

Requires Node.js (v20+ recommended). Setup takes a few minutes.

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Environment variables (optional)

Defaults work out of the box. Override only if needed:

| Variable | Where | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | backend | `3001` | Backend HTTP port |
| `VITE_API_BASE_URL` | frontend | `http://localhost:3001` | API base URL used by the frontend |

Example:

```bash
# backend
PORT=3001 npm run dev

# frontend (optional)
# create frontend/.env with:
# VITE_API_BASE_URL=http://localhost:3001
```

### 3. Database

There is **no separate migration or seed step**.

On backend startup, SQLite:

- creates `backend/data/` if needed
- opens `backend/data/hyperproof.db`
- creates the `risks` and `mitigations` tables (and index) if they do not exist

Foreign keys are enabled; deleting a risk cascades to its mitigations.

**Seed data:** none. Start with an empty database and create risks in the UI.

### 4. Start the backend

```bash
cd backend
npm run dev
```

Server: [http://localhost:3001](http://localhost:3001)  
Health check: `GET /health`

### 5. Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal (typically [http://localhost:5173](http://localhost:5173)).

## API

Base URL: `http://localhost:3001`

Successful responses use `{ "success": true, "data": ... }`.  
Errors use `{ "success": false, "message": "...", "errors": [...] }` when field details exist.

### Risks

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/risks` | Create a risk |
| `GET` | `/risks` | List risks (optional `?category=` and/or `?status=`; sorted by residual desc) |
| `GET` | `/risks/:id` | Get one risk (includes `mitigations`) |
| `PUT` | `/risks/:id` | Update a risk |
| `DELETE` | `/risks/:id` | Delete a risk (cascades mitigations) |

### Mitigations

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/risks/:riskId/mitigations` | Add a mitigation; response includes updated risk scores |
| `PUT` | `/mitigations/:id` | Update a mitigation; response includes updated risk scores |
| `DELETE` | `/mitigations/:id` | Delete a mitigation; response includes updated risk scores |

### Other

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Liveness check |

**Risk body fields:** `title`, `description`, `category`, `owner`, `likelihood` (1–5), `impact` (1–5), `status` (`Open` \| `Mitigating` \| `Closed`).

**Categories:** `Operational`, `Financial`, `Compliance`, `Security`, `Strategic`.

**Mitigation body fields:** `description`, `effectiveness` (1–5).

## Risk scoring

### Inherent risk

```
Inherent Risk = Likelihood × Impact
```

Example: likelihood `4`, impact `5` → inherent `20`.

### Severity

| Score | Severity |
| --- | --- |
| 1–5 | Low |
| 6–12 | Medium |
| 13–19 | High |
| 20–25 | Critical |

### Residual risk

#### Approach used in this project: strongest mitigation (Approach 1)

The code implements **Approach 1**: only the strongest mitigation affects the residual score.

1. If there are no mitigations → residual = inherent  
2. Otherwise take the highest `effectiveness`  
3. Map effectiveness to reduction:

| Effectiveness | Reduction |
| --- | --- |
| 1 | 10% |
| 2 | 20% |
| 3 | 30% |
| 4 | 40% |
| 5 | 50% |

4. Compute:

```
residual = max(1, round(inherent × (1 - reduction)))
```

Example: inherent `20`, strongest effectiveness `5` → 50% reduction → residual `10`.

I chose this because it is easy to understand and easy to explain. It also passes the basic checks. With no mitigations, residual equals inherent. A strong mitigation lowers the score a lot. Residual never goes below 1.

If one mitigation is stronger, the weaker ones do not change the final score by themselves.

The frontend can show a live inherent score while editing. The backend always recalculates the real scores. Scores are not saved as separate columns in the database.

#### Other approaches considered (not used in code)

Before choosing Approach 1, I also thought about these options.

##### Approach 2: Add the reduction from every mitigation

Let every mitigation add some percentage of reduction:

| Effectiveness | Reduction |
| --- | --- |
| 1 | 5% |
| 2 | 10% |
| 3 | 15% |
| 4 | 20% |
| 5 | 25% |

Example: MFA = 4, Data Encryption = 5, Security Training = 2 → 20% + 25% + 10% = **55%** total reduction.

For inherent `20`:

```
Residual = 20 × (1 - 0.55) = 9  (Medium)
```

Every mitigation helps lower the score, which feels fair at first. With many strong mitigations the total cut can go over 100%. I could force residual to stay at least 1, but that still feels wrong for business. Adding more controls should not make the risk look almost gone automatically. I did not use this because the score can fall too fast.

##### Approach 2: Reduce likelihood instead of the score directly

Some controls lower the chance that something bad happens (for example MFA). So instead of cutting the final score, change likelihood:

Likelihood `4`, Impact `5` → inherent `20`.
After a strong control, Likelihood goes from `4` to `2`.
Residual = `2 × 5 = 10`.

This matches how some real controls work. I would need extra rules for how much effectiveness lowers likelihood, and I would need to keep likelihood between 1 and 5. That adds extra rules the assignment does not ask for. I did not use this because it needs too many extra rules for this assignment.

##### Approach 3: Reduce both likelihood and impact

Different controls can change different parts of a risk. Firewall or MFA may lower the chance of the event. Backups or disaster recovery may lower how bad the damage is.

Before: Likelihood `4`, Impact `5` → inherent `20`.
After: Likelihood `2`, Impact `4` → residual `8`.

I believe this is closer to how a bigger risk system might work. Each mitigation only has one number (`effectiveness` from 1 to 5). The assignment does not say how much should go to likelihood versus impact, so I would need more fields or more guessing. I did not use this because it needs more data than the assignment gives.

##### Approach 4: Weighted mitigation effectiveness

Give some mitigations more importance (a weight), for example:

| Mitigation | Effectiveness | Weight |
| --- | --- | --- |
| MFA | 5 | 40% |
| Encryption | 4 | 35% |
| Training | 2 | 25% |

Then combine: `(5×0.40) + (4×0.35) + (2×0.25) = 3.9` (on a scale from 1 to 5).

Important controls can matter more than weaker ones. I would need a new weight idea in the database, API, and UI. I did not use this because of extra assumptions.

## Business rule

A risk **cannot be marked Closed when it has zero mitigations**.

Closing implies the risk has been addressed with at least one control. The API rejects create or update to `Closed` with no mitigations (`400`). Deleting the last mitigation from a risk that is already `Closed` is also rejected so the rule cannot be bypassed.

## Design decisions / assumptions

- **SQLite instead of PostgreSQL** for local setup speed: one file DB, no Docker or Postgres install, tables created on startup. For production with many writers, switch to PostgreSQL and proper migrations.
- **Inherent and residual scores are calculated**, not stored as separate DB fields
- **Deleting a risk cascades** to its mitigations (`ON DELETE CASCADE`)  
- **Category + status filters use AND** when both query params are present  
- List results are **always sorted by residual score descending** (no separate sort control in the UI)  
- Residual is **rounded** to the nearest integer  
- Residual **cannot go below 1**  
- Architecture: routes → controllers → services → repositories  

## What I’d do with more time

- Switch from SQLite to **PostgreSQL** and add real database migration files so schema changes are tracked and easy to apply  
- Put the scoring math in one shared place used by both frontend and backend, so the live preview and API never disagree  
- Wrap related database writes in a single transaction (for example risk + mitigation changes) so we never end up only partly updated  
- Add more API tests for race conditions (two users deleting or updating at once) and tests that check response shapes stay stable  
- Add pagination to `GET /risks`, reject stale edits using `updatedAt`, and return clearer error codes with messages  
- On the frontend, cache API data and refresh it after saves; optionally update the UI immediately and undo if the API fails  
- Add request IDs in logs and basic metrics (how often Closed without mitigation is rejected, score ranges) to debug production issues  

## Testing

From the backend folder, run the full suite with one command:

```bash
cd backend
npm test
```

This runs Node’s built in test runner on `tests/*.test.js`.

**Unit tests** (`riskCalculations.test.js`):

- Inherent: `1×1`, `4×5`, `5×5`  
- Severity boundaries: 1, 5, 6, 12, 13, 19, 20, 25  
- Residual: no mitigations, effectiveness 1 and 5, strongest of many, floor at 1  

**API integration tests** (`api.integration.test.js`):

- Risk and mitigation CRUD  
- Closed with zero mitigations rejected; Closed with a mitigation allowed  
- Invalid likelihood / impact / effectiveness  
- Missing risk / mitigation → 404  
- Category+status AND filter, residual sort, cascade delete, malformed JSON → 400  

## Tools used

- **[Cursor](https://cursor.com)**: code editor used to build and iterate on this project  
- **[Wispr Flow](https://wisprflow.ai)**: speech to text used for prompting while working in Cursor  
