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

- Usuario: id, nome, email/username, senha hash, perfil (Professor/Coordenador)
- Espaco: id, nome, capacidade, descricao
- Reserva: id, usuario_id, espaco_id, data, horario_inicio, horario_fim, finalidade, situacao, justificativa_recusa, created_at, updated_at

## Rationale

The domain supports the required auth, listing, search, and approval flow while keeping the data model simple enough for the schedule.

## Alternatives considered

- Separate `Status` table or generic admin tables: rejected to keep the MVP simpler and within the 90-minute task limit.
- Extra entities for notifications or attachments: rejected because the brief explicitly forbids them.

## Decision: Reservation lifecycle

- Status values: Pendente, Aprovada, Recusada, Cancelada
- Transition rules: Pendente -> Aprovada or Recusada; Pendente/Aprovada -> Cancelada when allowed by rule
- `Ativa/upcoming` is derived and not stored as a status
- Approved reservations that have already passed are historical records based on date/time
- Rejected or cancelled reservations remain stored for history; physical delete is avoided unless a soft-delete policy is clearly needed later

## Rationale

This matches the briefing’s fixed list of valid situations and keeps valid states predictable without introducing extra ephemeral statuses.

## Alternatives considered

- Adding `Concluida` status: rejected because the briefing says past approved bookings can be treated as historical based on date/time.
- Deleting rejected or cancelled records: rejected because the briefing explicitly requires keeping them for history.

## Decision: Time-slot validation

- Booking times are constrained to 50-minute blocks between 07:00 and 22:00.
- Overlap validation is checked only against approved reservations in the same space.
- A reservation can be created only when there is no overlapping approved reservation on the same space.

## Rationale

This prevents double-booking while preserving the operation rule from the brief and keeps validation deterministic.

## Alternatives considered

- Validating against all statuses: rejected because the brief says only Aprovada counts for overlap.
- Allowing arbitrary slot lengths: rejected because the project defines fixed 50-minute blocks.

## Decision: Permission model

- Professor: creates, views, and manages own reservations; may cancel until the day before the event
- Coordenador: approves/rejects pending reservations and can cancel after the owner window or when allowed by rule
- Both profiles can view the full reservation list for transparency; write access remains restricted by owner/coordinator rules

## Rationale

This satisfies the required two-profile permission model while keeping the MVP simple and aligned to the business process.

## Alternatives considered

- Generic admin role or more than two profiles: rejected by constitution and brief.
- Restricting all users to only their own reservations: rejected because the brief says both roles may see all reservations.
