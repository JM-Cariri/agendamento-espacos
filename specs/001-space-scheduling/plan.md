# Implementation Plan: Space Scheduling System

**Branch**: `001-space-scheduling` | **Date**: 2026-08-24 | **Spec**: `/specs/001-space-scheduling/spec.md`
**Input**: Feature specification from `/specs/001-space-scheduling/spec.md`

**Note**: This plan follows the constitution rules for a fixed React + Node.js + PostgreSQL stack and 90-minute task sizing.

## Summary

This feature delivers a compact room scheduling system for a school environment with a simple login, role-based permissions between Professor and Coordenador, three related entities, and a full reservation workflow. The MVP prioritizes: authentication, space management, reservation creation with approval flow, listing/search, dashboard metrics, and persisted validation of the six business rules without adding out-of-scope features.

## Technical Context

**Language/Version**: Node.js 20 LTS (backend) + React 18 (frontend)  
**Primary Dependencies**: Express, PostgreSQL driver, JWT or session middleware, React Router, Axios, Vite  
**Storage**: PostgreSQL 15+  
**Testing**: Jest + Supertest for backend API tests; React Testing Library for UI smoke tests  
**Target Platform**: Local development environment on Linux/macOS/Windows via Node + PostgreSQL  
**Project Type**: Web application (React SPA + Node.js REST API)  
**Performance Goals**: MVP must support the academic 8-session delivery window; no heavy optimization required  
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

This project follows the pattern described in the feature spec and constitution; the unknowns were narrowed to the domain model and lifecycle rules. The decisions below are therefore fixed before implementation:

- Booking status set is restricted to Pendente, Aprovada, Recusada, Cancelada.
- Active/upcoming is a derived condition: an approved booking whose time has not passed yet.
- Overlap validation uses only reservations with status Aprovada in the same space.
- Rejected or cancelled bookings remain in the database for history; soft-delete is optional but not mandatory for record retention.
- Coordinador is the role that approves or rejects pending reservations; both roles can view all reservations, while only owner or coordinator can take edit/cancel actions within the policy window.

## Phase 0: Research and Planning Decisions

### Research Findings

1. **Authentication model**: Simple login with two profiles (Professor and Coordenador), no password recovery, no email confirmation.
2. **Reservation lifecycle**: Pendente is the initial state; approval is manual by Coordenador; rejection is explicit and required when rejected; cancellation is allowed by rule and must keep records.
3. **Scheduling model**: Fixed 50-minute blocks between 07:00 and 22:00, with overlap checks only on approved reservations.
4. **Entity design**: `Usuario`, `Espaco`, `Reserva` form the core domain. Reservation joins both other entities.
5. **Scope fit**: MVP can be implemented within 8 sessions by splitting the domain and UI into four slices: auth, management, reservations, dashboard.

### Design Decisions

- Use a relational design with explicit enums for role and reservation status.
- Keep a `justificativa_recusa` column that is required whenever status = Recusada.
- Use server-side validation for business rules to avoid client-only trust.
- Use a small dashboard that shows counts and occupancy without introducing unsupported report/export features.
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

The implementation will be organized into 4 main slices with confirmed 90-minute boundaries:

1. Authentication and role-based routing
2. Space management CRUD and filters
3. Reservation lifecycle, approval, and conflict validation
4. Dashboard and final polish

Each slice is decomposed into smaller tasks so each task fits a single 90-minute session.

## Generated Artifacts

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [quickstart.md](./quickstart.md)
- [contracts/space-booking-api.md](./contracts/space-booking-api.md)
- [tasks.md](./tasks.md) will be generated in the next task-generation step
