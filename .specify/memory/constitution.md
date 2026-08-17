<!-- 
SYNC IMPACT REPORT
Version: 0.0.0 → 1.0.0 (MINOR: Initial constitution for academic SDD project)
Modified Principles: N/A (initial version)
Added Sections: Fixed Technology Stack, Mandatory Scope, Out-of-Scope Constraints, Development Workflow
Removed Sections: None
Templates requiring updates: 
  - ✅ plan-template.md (verified: no constitution-specific gates needed)
  - ✅ spec-template.md (verified: supports flexible scope)
  - ✅ tasks-template.md (verified: supports 90-minute session sizing)
Follow-up TODOs: None
-->

# Agendamento de Espaços Constitution

Academic Spec Driven Development (SDD) activity for a Programming course.
8 sessions × 90 minutes available for complete implementation and testing.

## Core Principles

### I. Scope Compliance (Non-Negotiable)

The project MUST deliver the complete minimum required scope for the academic activity.
All development decisions, task prioritization, and feature requests are evaluated against
this scope. Scope cannot be reduced; any mismatch means requirements misunderstanding, not scope flexibility.

**Minimum Mandatory Scope**:
- Authentication with exactly 2 user profiles and role-based permission control
- 3 related main entities (core domain entities of the theme)
- 1 complete CRUD operation on the central entity
- 1 listing screen with search and/or filtering capability
- 1 dashboard/panel with 2–3 key business indicators
- All 6 business rules of the theme implemented and validated
- Proper error handling and validation throughout

### II. Fixed Technology Stack (Non-Negotiable)

No variation from the mandatory technology stack is permitted.
All architectural decisions MUST use exactly these technologies; no substitutions, no alternative frameworks.

**Required Stack**:
- **Frontend**: React (single-page application)
- **Backend**: Node.js (API server)
- **Database**: PostgreSQL (relational data)

### III. Session-Sized Task Delivery

Every task generated MUST be completable within a single 90-minute session by a single developer.
Task size must account for: development time + local testing + integration review time.
If a task cannot fit within 90 minutes, it is TOO LARGE and must be decomposed further.

**Implication**: No task description, requirement, or implementation can assume multi-session effort.

### IV. Core Feature Priority Sequence

Development follows a strict priority order to ensure MVP delivery within 8 sessions:

1. **Authentication & Authorization** (Session 1–2)  
   Simple login, 2 profiles, role-based permission enforcement

2. **Domain Entity Model** (Session 2–3)  
   3 main entities and their relationships established

3. **Central Entity CRUD** (Session 3–4)  
   Complete Create, Read, Update, Delete for the main entity

4. **Listing & Discovery** (Session 4–5)  
   Listing screen with search/filter functionality

5. **Dashboard & Metrics** (Session 5–6)  
   Dashboard with 2–3 key business indicators

6. **Business Rule Validation** (Session 6–8)  
   All 6 business rules implemented, tested, and integrated

### V. Strict Out-of-Scope Enforcement

The following features are EXPLICITLY OUT OF SCOPE in any circumstance.
Any request for these features must be immediately rejected with reference to this principle.

**Forbidden Features**:
- Password recovery, email confirmation, social login, or more than 2 user profiles
- Email, WhatsApp, push notifications, or any asynchronous messaging
- Image, file, or attachment uploads of any kind
- Online payments, billing, invoicing, or banking integration
- Mobile application (iOS/Android), PWA, or responsive design beyond basic mobile viewport
- PDF/Excel export, formatted printing, or document generation
- Complete audit logging, LGPD compliance, data retention policies, or backup procedures
- Integration with external school systems, SSO, or third-party identity providers
- Generic administrative interface for managing static system configuration lists

## Fixed Technology Stack

**Frontend**: React (JavaScript/TypeScript)  
**Backend**: Node.js (JavaScript/TypeScript, typically Express or similar)  
**Database**: PostgreSQL (relational, SQL)  
**Testing**: Jest, Supertest, or equivalent unit/integration frameworks  
**Version Control**: Git with feature branching  
**Deployment Scope**: Local development environment only; production deployment is OUT OF SCOPE

## Mandatory Scope Requirements

Organized by session-based delivery phases:

| Phase | Sessions | Deliverable | Success Criteria |
|-------|----------|------------|------------------|
| **Authentication** | 1–2 | Login system, 2 profiles, permissions | Users can log in with correct profile; unauthorized access is blocked |
| **Data Model** | 2–3 | 3 entities, relationships, schema | Entities exist in database, relationships enforced by FK constraints |
| **CRUD Operations** | 3–4 | Central entity CRUD | Create, Read (single + list), Update, Delete all functional |
| **Listing & Search** | 4–5 | Search/filter listing screen | Can list all entities, search by ≥1 field, apply ≥1 filter |
| **Dashboard** | 5–6 | 2–3 business indicators | Indicators calculate and display correctly; reflect current data |
| **Business Rules** | 6–8 | All 6 rules implemented + validated | Each rule prevents/enforces expected behavior; integrated in CRUD |

## Development Workflow

### Task Sizing & Session Alignment

1. Every task in `tasks.md` MUST include an estimated session count (e.g., "Fits in 1 session", "Requires 2 sessions").
2. Tasks MUST be ordered by dependency and priority per the Core Feature Priority Sequence.
3. No task may cross session boundaries; if a task extends beyond 90 minutes, decompose it.
4. Each developer works on one task per session; tasks are independent when same-session parallelization is needed.

### Scope Creep Prevention

- Any feature request not in the Mandatory Scope Requirements is **immediately rejected**.
- Any feature in the Forbidden Features list (Principle V) is **immediately rejected**.
- Questions about scope ambiguity are escalated to the specification phase; they do NOT result in ad-hoc scope expansion.
- If scope questions emerge during development, they are handled via clarification and re-specification, not informal additions.

### Acceptance & Validation

- Each session ends with a working, integrated feature (or task increment) that can be demonstrated.
- All acceptance criteria from the specification MUST pass before a task is marked complete.
- Business rule validation is MANDATORY; rules must be testable and tested.

## Governance

### Constitution Supersedes All Other Decisions

This document is the authority for development governance. Any conflict between this constitution and:
- Task descriptions → Constitution wins; task is revised
- Spec requirements → Constitution wins; spec is aligned
- Code review feedback → Constitution wins; feedback is corrected
- Developer preference → Constitution wins; reasoning is documented

### Amendment & Version Control

**Version Scheme**: MAJOR.MINOR.PATCH (semantic versioning)
- **MAJOR**: Principle removal, scope reduction, or technology stack change
- **MINOR**: New principle, relaxation of constraint, or additional mandatory requirement
- **PATCH**: Wording clarification, example updates, correction of errors (no governance change)

**Amendment Process**:
1. Changes require documented rationale and stakeholder consensus.
2. All changes are recorded with date and amendment description.
3. Dependent templates (`plan-template.md`, `spec-template.md`, `tasks-template.md`) are audited for alignment.
4. Amendment is committed to version control with a clear commit message.

### Compliance Review

- **Specification Gate**: Every spec MUST verify alignment with Principles I (scope), II (stack), and IV (priority).
- **Task Generation Gate**: Every task set MUST verify Principle III (session sizing) and the forbidden features list.
- **Code Review Gate**: Code MUST implement features in scope, using only the required stack, with business rules validated.

### Escalation & Exception Handling

If a developer discovers a true impossibility (e.g., a business rule cannot be implemented within stack constraints):
1. Document the issue with concrete evidence.
2. Escalate to specification clarification (not unilateral scope change).
3. Resolve via updated spec, re-prioritization, or clarified business rule.
4. Update constitution only if the impediment reflects a genuine governance gap.

---

**Version**: 1.0.0 | **Ratified**: 2026-08-17 | **Last Amended**: 2026-08-17
