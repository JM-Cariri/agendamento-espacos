# Implementation Plan: Space Scheduling System

**Branch**: `001-space-scheduling` | **Date**: 2026-08-24 | **Spec**: `/specs/001-space-scheduling/spec.md`
**Input**: Feature specification from `/specs/001-space-scheduling/spec.md`

**Note**: This plan follows the constitution rules for a fixed React + Node.js + PostgreSQL stack and 90-minute task sizing.

## Summary

This feature delivers a compact room scheduling system for a school environment with a simple login, role-based permissions between Professor and Coordenador, three related entities, and a full reservation workflow. The MVP prioritizes: authentication, space management, reservation creation with approval flow, listing/search, dashboard metrics, and persisted validation of the six business rules without adding out-of-scope features.

## Technical Context

**Language/Version**: Node.js 20 LTS (backend) + React 18 (frontend)  
**Primary Dependencies**: Express, PostgreSQL driver, JWT middleware using an HttpOnly cookie, React Router, Axios, Vite
**Storage**: PostgreSQL 17
**Testing**: Jest + Supertest for backend API tests; React Testing Library for UI smoke tests  
**Target Platform**: Local development environment on Linux/macOS/Windows via Node + PostgreSQL  
**Project Type**: Web application (React SPA + Node.js REST API)  
**Performance Goals**: Meet SC-001–SC-005 in a local acceptance run; use approximately 1000 seeded spaces for SC-004 and approximately 1000 seeded reservations for SC-005; no heavy optimization required
**Constraints**: 90-minute task sizing, fixed stack only, no PWA/mobile/responsive design beyond basic layout, no email/file/payment integrations  
**Scale/Scope**: Up to roughly 100 users and 1000 bookings; low-friction academic project scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Fixed Technology Stack** (Principle II):  
- Frontend: React SPA  
- Backend: Node.js REST API  
- Database: PostgreSQL

✅ **Scope Alignment** (Principle I):  
- [x] Requires 2-profile authentication with role-based permissions  
- [x] Defines 3 main related entities  
- [x] Includes complete CRUD for central entity  
- [x] Includes search/filter listing screen  
- [x] Includes 2–3 business indicator dashboard  
- [x] Lists all 6 business rules to be implemented and validated

✅ **Feature Compliance** (Principle V):  
- [x] No password recovery, email confirmation, or additional profiles  
- [x] No email/WhatsApp/push notifications  
- [x] No file/image uploads  
- [x] No payment integration  
- [x] No mobile app, PWA, or responsive design requirements  
- [x] No PDF/Excel export, audit logging, or LGPD compliance  
- [x] No external system integration

✅ **Priority Sequence** (Principle IV):  
- Auth → Entities → Reservations → Search/Filter → Dashboard → Business Rule validation

## Project Structure

### Documentation (this feature)

```text
specs/001-space-scheduling/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
├── spec.md              # Approved feature specification
├── checklists/
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── validators/
│   └── app.js
├── tests/
│   ├── integration/
│   └── unit/
├── .env.example
├── package.json
└── knexfile.js or sequelize config

frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── store/
│   └── App.jsx
├── public/
├── package.json
└── vite.config.js

db/
├── migrations/
└── seeds/
```

**Structure Decision**: A split architecture is used with one independent backend API and one frontend SPA, matching the fixed stack and keeping the feature development modular enough for 90-minute tasks.

## Complexity Tracking

> No constitution violations exist; no complexity justification required.

## Research

This project follows the pattern described in the feature spec and constitution; the domain, session, and lifecycle rules below are fixed before implementation:

- Booking status set is restricted to Pendente, Aprovada, Recusada, Cancelada.
- `Aprovada futura` is a derived condition: an approved booking whose start date/time has not passed yet; `reservas futuras` additionally includes pending bookings.
- Overlap validation blocks conflicting reservations with status Pendente or Aprovada in the same space; Recusada and Cancelada do not block availability.
- Rejected or cancelled bookings remain in the database for history; reservations are never physically deleted.
- Spaces are logically archived using `archived_at`, never physically deleted; archival is rejected while future Pendente/Aprovada reservations exist.
- Authentication uses a PostgreSQL `Sessoes` record per signed JWT; logout revokes the row, and idle activity renews both the record and JWT.
- State-changing requests validate the configured Origin; cookies use SameSite=Lax, and production requires HTTPS and Secure.
- Cancellation is canonical only through `PATCH /reservas/:id/status`; DELETE is not used for reservations.
- Coordenador is the role that approves or rejects pending reservations; both roles can view all reservations, while only the owner or Coordinator can take edit/cancel actions within the policy window. Cancellation is canonical through `PATCH /reservas/:id/status`.
- `reservas futuras` includes not-yet-started Pendente/Aprovada; `Aprovada futura` is the distinct approved-only derived condition.

## Phase 0: Research and Planning Decisions

### Research Findings

1. **Authentication model**: Simple login with two profiles (Professor and Coordenador), signed JWT only in an HttpOnly cookie, PostgreSQL `Sessoes` row linked to Usuario, sliding expiry after 30 minutes of inactivity with renewed JWT, immediate server-side revocation on logout, Origin validation for state-changing requests, SameSite=Lax, and HTTPS/Secure in production. Protected API routes validate session state and permissions independently of frontend route guards.
2. **Reservation lifecycle**: Pendente is the initial state; approval is manual by Coordenador; rejection is explicit and required when rejected; cancellation uses only `PATCH /reservas/:id/status`, is checked by the backend at initial implementation, and keeps records. Owner may cancel eligible records before reservation date; on that date, only Coordinator may cancel before start. Repeated/late cancellation is rejected.
3. **Scheduling model**: Consecutive 50-minute slots aligned from 07:00 through 22:00 for every space; same-day requests are accepted only when the slot start remains in the future. Pendente and Aprovada reservations block overlapping slots.
4. **Entity design**: `Usuario`, `Espaco`, `Reserva` form the core domain; `Sessoes` is an authentication-support table. Usuario email is required for login/contact and phone is optional. Espaco includes required building location, operating-hours fields (07:00 and 22:00), and `archived_at`; its row and reservation FKs are retained.
5. **Scope fit**: MVP can be implemented within 8 sessions by splitting the domain and UI into four slices: auth, management, reservations, dashboard.

### Design Decisions

- Use a relational design with explicit enums for role and reservation status and restrictive FKs preserving history.
- Keep a `justificativa_recusa` column that is required whenever status = Recusada.
- Use server-side validation for business rules to avoid client-only trust.
- Exclude archived spaces from booking choices; reject archival with a clear reason when future pending/approved reservations exist.
- Use a role-specific dashboard: Professor sees own future (not-started Pendente/Aprovada), pending, and approved booking counts; Coordenador sees total non-archived spaces and system-wide pending and approved counts. `Aprovada futura` remains a distinct approved-only derived condition.
- Keep the UI functional and minimal, with basic navigation and no elaborate responsiveness.

## Phase 1: Design and Contracts

**Prerequisites**: research.md complete.

### Data Model

See [data-model.md](./data-model.md) for the canonical entity definitions, field constraints, and relationship mapping.

### API Contracts

See [contracts/space-booking-api.md](./contracts/space-booking-api.md) for the expected REST endpoints, payloads, and validation conditions.

### Quickstart

See [quickstart.md](./quickstart.md) for local setup and run steps for backend, frontend, and database.

### Re-check Constitution

The design still complies with the constitution: fixed stack, in-scope functionality only, 90-minute task sizing, and no out-of-scope additions.

## Phase 2: Task Planning Outcome

The implementation follows the constitution's priority sequence across the eight sessions, each totaling 90 minutes:

1. S1–S2: Authentication, role-based routing, and relational model
2. S3–S4: Space management followed by reservation CRUD
3. S5–S6: Search/filter followed by role-specific dashboards
4. S7–S8: Business-rule consolidation, error feedback, and regression

The detailed session sequence and preserved task IDs are in [tasks.md](./tasks.md).

## Generated Artifacts

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [quickstart.md](./quickstart.md)
- [contracts/space-booking-api.md](./contracts/space-booking-api.md)
- [tasks.md](./tasks.md) contains the eight sessions and 16 preserved task IDs for implementation
