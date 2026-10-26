# Data Model: Space Scheduling System

## Overview

The domain contains three primary entities: Usuario, Espaco, and Reserva. The reservation is the central entity and is related to both the space and the user who owns the booking.

## Entity: Usuario

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID or serial | PK, not null | Unique user identifier |
| nome | string | not null, trimmed | Display name |
| email | string | unique, not null | Login identifier |
| telefone | string | nullable | Optional contact phone |
| senha_hash | string | not null | Hashed password |
| perfil | enum | Professor or Coordenador | Role-based permission |
| created_at | timestamp | not null | Audit timestamp |
| updated_at | timestamp | not null | Audit timestamp |

### Relationships

- One user may create many reservations.
- Reservation ownership is tied to the user who submitted the booking.

## Entity: Sessoes (authentication support)

This table supports authentication and does not add a fourth core business entity.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, not null | Session identifier carried as the JWT session claim |
| usuario_id | FK | not null, references Usuario.id | Session owner |
| created_at | timestamp | not null | Session creation |
| last_activity_at | timestamp | not null | Last successfully authenticated activity |
| expires_at | timestamp | not null | Sliding expiry, renewed to 30 minutes after activity |
| revoked_at | timestamp | nullable | Set at logout; revoked sessions are immediately rejected |

Every protected request verifies the signed JWT and checks that its session row exists, belongs to its user, is not revoked, and has not expired. Logout updates `revoked_at` before clearing the HttpOnly cookie.

## Entity: Espaco

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID or serial | PK, not null | Unique space identifier |
| nome | string | not null | Space name |
| capacidade | integer | > 0 | Seating/person capacity |
| descricao | text | nullable | Space description |
| localizacao_predio | string | not null | Building/location reference |
| horario_funcionamento_inicio | time | not null, fixed to 07:00 in V1 | Daily operating-hours start |
| horario_funcionamento_fim | time | not null, fixed to 22:00 in V1 | Daily operating-hours end |
| archived_at | timestamp | nullable | Logical archive time; archived spaces cannot be booked |
| created_at | timestamp | not null | Audit timestamp |
| updated_at | timestamp | not null | Audit timestamp |

### Relationships

- One space may have many reservations. Reservation FK uses `ON DELETE RESTRICT`; spaces with reservation history are never physically deleted.

## Entity: Reserva

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID or serial | PK, not null | Unique reservation identifier |
| usuario_id | FK | not null, references Usuario.id | Owner of the reservation |
| espaco_id | FK | not null, references Espaco.id | Space booked |
| data | date | not null | Reservation day |
| horario_inicio | time | not null | Start time |
| horario_fim | time | not null | End time |
| finalidade | text | not null | Reason for reservation |
| situacao | enum | Pendente, Aprovada, Recusada, Cancelada | Approval lifecycle |
| justificativa_recusa | text | required when situacao = Recusada | Mandatory rejection reason |
| created_at | timestamp | not null | Created at |
| updated_at | timestamp | not null | Last update |

The reservation FK to `Espaco` uses `ON DELETE RESTRICT`. Reservations are never physically deleted; cancellation is a status transition.

### Relationships

- Many reservations belong to one user.
- Many reservations belong to one space.

## Validation Rules

- `horario_inicio` and `horario_fim` must identify one consecutive 50-minute slot aligned to the daily schedule beginning at 07:00; all spaces use 07:00–22:00.
- `horario_fim > horario_inicio`, and the slot must end no later than 22:00.
- Reservation start date/time must be later than the current date/time when creating or updating. Same-day slots are allowed only if their start time is still in the future.
- A reservation cannot overlap another `Pendente` or `Aprovada` reservation in the same space. `Recusada` and `Cancelada` do not block availability.
- A reservation can only reference a non-archived space.
- A space cannot be archived while it has a future `Pendente` or `Aprovada` reservation. Archiving sets `archived_at`; it does not remove the row or break historical FKs.
- Reservation creation must handle concurrent requests atomically: for five simultaneous requests for the same slot, exactly one may be stored and the others must receive a conflict result.
- `justificativa_recusa` is required whenever `situacao = 'Recusada'`.
- `Aprovada futura` is an approved reservation whose start is still in the future. The distinct `reservas futuras` dashboard count includes not-yet-started Pendente and Aprovada reservations.
- Historical records remain in the table and are not physically deleted when cancellation or rejection occurs.
- There is no fixed daily booking limit per user; multiple non-overlapping slots may be booked on the same date when availability permits.
- Cancellation uses `PATCH /reservas/:id/status` and is allowed only in these cases: the owner cancels an eligible Pendente/Aprovada reservation before its date, or the Coordinator cancels one on its date before start. Recusada, Cancelada, and already-started reservations cannot be cancelled.
- Space name filtering is a case-insensitive substring match; capacity filtering is a minimum integer greater than zero.

## State Transitions

- Pendente -> Aprovada
- Pendente -> Recusada
- Pendente -> Cancelada (if allowed by business rule)
- Aprovada -> Cancelada (if allowed by business rule)
- Aprovada -> Recusada is not valid for normal flow; the path is only Pendente -> Recusada
- Approved past bookings do not receive a new status; they remain historical by date/time
- `Cancelada` and `Recusada` are terminal for cancellation; neither can transition to `Cancelada` again.

## Notes

This model intentionally keeps validation in the backend and database constraints to guarantee that business rules are enforced consistently.
