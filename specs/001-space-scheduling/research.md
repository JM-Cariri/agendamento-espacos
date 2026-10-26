# Research: Space Scheduling System

## Decision: Technology and project shape

- Frontend: React SPA
- Backend: Node.js REST API
- Database: PostgreSQL
- Architecture: separate frontend and backend projects with shared domain rules

## Rationale

This project must match the academic fixed stack and fit a strict 8-session delivery window. A split React + Node.js + PostgreSQL solution keeps implementation manageable while preserving clear separation between UI, API, and persistence rules.

## Alternatives considered

- Single monolith with server-rendered pages: rejected because the stack is fixed to React SPA + Node.js API.
- Additional profiles or external integrations: rejected by constitution and project scope.
- Mobile or file-upload features: rejected as out of scope.

## Decision: Core domain model

- Usuario: id, nome, email (required login/contact), telefone (optional), senha hash, perfil (Professor/Coordenador)
- Sessoes (authentication support, not a core business entity): id, usuario_id, created_at, last_activity_at, expires_at, revoked_at
- Espaco: id, nome, capacidade, descricao, localizacao_predio, horario_funcionamento_inicio, horario_funcionamento_fim, archived_at
- Reserva: id, usuario_id, espaco_id, data, horario_inicio, horario_fim, finalidade, situacao, justificativa_recusa, created_at, updated_at

## Rationale

The domain supports the required auth, listing, search, and approval flow while keeping the data model simple enough for the schedule.

## Alternatives considered

- Separate `Status` table or generic admin tables: rejected to keep the MVP simpler and within the 90-minute task limit.
- Extra entities for notifications or attachments: rejected because the brief explicitly forbids them.

## Decision: Reservation lifecycle

- Status values: Pendente, Aprovada, Recusada, Cancelada
- Transition rules: Pendente -> Aprovada or Recusada; Pendente/Aprovada -> Cancelada when allowed by rule
- `Aprovada futura` is the derived approved-only condition; the distinct dashboard/list filter `reservas futuras` includes not-yet-started Pendente/Aprovada. Neither is stored as a status.
- Approved reservations that have already passed are historical records based on date/time
- Rejected or cancelled reservations remain stored for history; physical delete is forbidden.
- Cancellation is performed only through `PATCH /reservas/:id/status`; the backend validates owner/Coordinator permissions, date boundary, start time, current status, and rejects repeated cancellation.

## Rationale

This matches the briefing’s fixed list of valid situations and keeps valid states predictable without introducing extra ephemeral statuses.

## Alternatives considered

- Adding `Concluida` status: rejected because the briefing says past approved bookings can be treated as historical based on date/time.
- Deleting rejected or cancelled records: rejected because the briefing explicitly requires keeping them for history.

## Decision: Time-slot validation

- Booking times are constrained to consecutive 50-minute blocks aligned from 07:00 through 22:00; all spaces use this schedule.
- Pending and approved reservations block overlapping slots in the same space; rejected and cancelled reservations do not.
- Same-day reservations are allowed only when the slot start is still in the future.
- Concurrent attempts for the same slot must be handled atomically: among five simultaneous attempts, exactly one reservation is created and the others are rejected as conflicts.
- Reservation `reservas futuras` means not-yet-started Pendente or Aprovada; `Aprovada futura` is the distinct approved-only derived condition.

## Rationale

This prevents double-booking while preserving the operation rule from the brief and keeps validation deterministic.

## Alternatives considered

- Ignoring pending reservations: rejected by the clarification dated 2026-10-26; pending reservations block a slot until the Coordinator decides.
- Allowing arbitrary slot lengths: rejected because the approved rule requires fixed 50-minute blocks.

## Decision: Permission model

- Professor: creates, views, and manages own reservations; may cancel eligible reservations before their date
- Coordenador: approves/rejects pending reservations and may cancel eligible reservations on their date only before start; the cancellation window is limited to these role/date cases
- Both profiles can view the full reservation list for transparency; write access remains restricted by owner/coordinator rules

## Rationale

This satisfies the required two-profile permission model while keeping the MVP simple and aligned to the business process.

## Alternatives considered

- Generic admin role or more than two profiles: rejected by constitution and brief.
- Restricting all users to only their own reservations: rejected because the brief says both roles may see all reservations.

## Decision: Authentication and sessions

- JWT is delivered only in an HttpOnly cookie and identifies a PostgreSQL `Sessoes` record linked to the authenticated Usuario.
- Every protected request verifies JWT signature and session existence, ownership, revocation state, and expiry.
- Authenticated activity renews both `expires_at` and JWT expiry to 30 minutes after activity; idle expiry is based on persisted last activity.
- Logout sets `revoked_at` in the database before clearing the cookie; the token is immediately rejected.
- Protected API requests return 401 when unauthenticated or expired and 403 when the authenticated profile lacks permission. Frontend route guards do not replace API authorization.
- State-changing requests, including login/logout, validate the configured Origin. Cookies use SameSite=Lax; production uses HTTPS and the Secure attribute.

## Decision: Space archival and listing filters

- Spaces with reservation history are never physically deleted; the FK from Reserva uses `ON DELETE RESTRICT`.
- Archival sets `archived_at`. Future Pendente/Aprovada bookings prevent archival with a clear explanation; archived spaces are excluded from booking choices and reject new reservations.
- Space name filtering is case-insensitive substring matching. Capacity filter accepts a minimum positive integer; invalid values return a clear validation error.

## Decision: Dashboard indicators

- Professor sees own future bookings, own pending bookings, and own approved bookings.
- Coordenador sees total spaces, all system-wide pending bookings, and all system-wide approved bookings.
- The future-bookings count includes the Professor's not-yet-started Pendente or Aprovada records; status counts include all matching records, including historical records.
- `Aprovada futura` specifically includes only not-yet-started approved records and is not interchangeable with the dashboard's `reservas futuras`.
