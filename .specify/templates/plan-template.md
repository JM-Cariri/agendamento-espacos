# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Node.js (backend) + React (frontend) per Constitution Principle II  
**Primary Dependencies**: Express or equivalent (backend), React + hooks (frontend)  
**Storage**: PostgreSQL (relational database per Constitution Principle II)  
**Testing**: Jest, Supertest, or equivalent integration frameworks  
**Target Platform**: Local development environment (production deployment is out of scope)  
**Project Type**: Web service (React SPA frontend + Node.js API backend)  
**Performance Goals**: Support 90-minute development sessions per Constitution Principle III  
**Constraints**: NO responsive design beyond basic mobile viewport, NO file uploads, NO external integrations  
**Scale/Scope**: Must deliver minimum mandatory scope per Constitution Principle I

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Fixed Technology Stack** (Principle II):  
- Frontend: React (not Vue, Angular, Svelte, or other)  
- Backend: Node.js (not Python, Go, Java, or other)  
- Database: PostgreSQL (not MongoDB, MySQL, SQLite, or other)

✅ **Scope Alignment** (Principle I):  
- [ ] Requires 2-profile authentication with role-based permissions  
- [ ] Defines 3 main related entities  
- [ ] Includes complete CRUD for central entity  
- [ ] Includes search/filter listing screen  
- [ ] Includes 2–3 business indicator dashboard  
- [ ] Lists all 6 business rules to be implemented and validated

✅ **Feature Compliance** (Principle V):  
- [ ] No password recovery, email confirmation, or additional profiles  
- [ ] No email/WhatsApp/push notifications  
- [ ] No file/image uploads  
- [ ] No payment integration  
- [ ] No mobile app, PWA, or responsive design requirements  
- [ ] No PDF/Excel export, audit logging, or LGPD compliance  
- [ ] No external system integration

✅ **Priority Sequence** (Principle IV):  
- Plan sequences implementation in order: Auth → Entities → CRUD → Search/Filter → Dashboard → Business Rules

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
