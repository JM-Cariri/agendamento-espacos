# Quickstart: Local Setup

## Requirements

- Node.js 20+
- PostgreSQL 17
- npm or pnpm
- Git

## 1. Database setup

1. Use the preconfigured local PostgreSQL 17 database `agendamento_espacos` and user `agendamento_app`; do not recreate them. Provide the local database password through an untracked `.env` file or environment variable, never in Git.
2. Create a `.env` file in the backend folder with values like:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agendamento_espacos
DB_USER=agendamento_app
DB_PASSWORD=<senha local fornecida fora do Git>
JWT_SECRET=<segredo local forte fornecido fora do Git>
FRONTEND_ORIGIN=http://localhost:5173
PORT=3001
```

For deployed production environments (deployment is outside the project scope), require HTTPS and set the authentication cookie `Secure`; keep HttpOnly and SameSite=Lax. State-changing API requests validate `Origin` against `FRONTEND_ORIGIN`.

3. Run migrations for `Usuario`, `Sessoes`, `Espaco`, and `Reserva`.

## 2. Backend setup

```bash
cd backend
npm install
npm run dev
```

Expected behavior:
- API runs on `http://localhost:3001`
- Routes are available for auth, spaces, and reservations

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Expected behavior:
- SPA runs on the default Vite port (commonly `http://localhost:5173`)
- Routes available for login, dashboard, spaces, and reservation management

## 4. Seed data

Create one Professor and one Coordenador through the local seed workflow. Store only password hashes; supply seed passwords locally without committing plaintext credentials.

Also create a few demo spaces and sample reservations to validate the schedule and approval flow.

## 5. Validation checklist

- User can log in as Professor or Coordenador
- Login sets a signed JWT in an HttpOnly cookie tied to a `Sessoes` row; no token is exposed to frontend JavaScript
- Authenticated activity renews session expiry and JWT for 30 minutes; after idle expiry requests return 401
- Logout immediately revokes `Sessoes` and clears the cookie; replay of the prior token returns 401
- Missing/untrusted Origin on state-changing requests returns 403; production cookies use Secure over HTTPS
- Professor requests to Coordinator-only API operations receive 403
- Professor can create a reservation request
- Coordenador can approve or reject pending reservation
- Overlap validation blocks conflicting pending or approved reservations in the same non-archived space; rejected and cancelled reservations do not block
- Slots are fixed at 50 minutes, aligned from 07:00 through 22:00; same-day future slots are accepted
- Five simultaneous attempts to book the same slot result in exactly one created reservation and four conflict responses
- A Professor can create multiple non-overlapping reservations on the same date
- Owner can cancel an eligible reservation before its date; on that date only the Coordinator can cancel it before start
- A space with future pending/approved reservations cannot be archived; a successfully archived space retains historical FKs and rejects new bookings
- Space filters accept a case-insensitive name substring and positive integer minimum capacity
- Rejected or cancelled records remain available for history
- Professor dashboard future count includes not-started Pendente/Aprovada; derived future-approved is approved-only. Coordinator dashboard shows non-archived spaces, pending, and approved counts
- Verify SC-001–SC-005 locally; use approximately 1000 seeded spaces for SC-004 and approximately 1000 seeded reservations for SC-005
- Verify actionable error messages for invalid filters, conflicts, archive restrictions, and cancellation restrictions
