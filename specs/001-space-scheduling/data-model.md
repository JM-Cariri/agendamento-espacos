# Data Model: Space Scheduling System

## Overview

The domain contains three primary entities: Usuario, Espaco, and Reserva. The reservation is the central entity and is related to both the space and the user who owns the booking.

## Entity: Usuario

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID or serial | PK, not null | Unique user identifier |
| nome | string | not null, trimmed | Display name |
| email | string | unique, not null | Login identifier |
| senha_hash | string | not null | Hashed password |
| perfil | enum | Professor or Coordenador | Role-based permission |
| created_at | timestamp | not null | Audit timestamp |
| updated_at | timestamp | not null | Audit timestamp |

### Relationships

- One user may create many reservations.
- Reservation ownership is tied to the user who submitted the booking.

## Entity: Espaco

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID or serial | PK, not null | Unique space identifier |
| nome | string | not null | Space name |
| capacidade | integer | > 0 | Seating/person capacity |
| descricao | text | nullable | Space description |
| created_at | timestamp | not null | Audit timestamp |
| updated_at | timestamp | not null | Audit timestamp |

### Relationships

- One space may have many reservations.

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
| deleted_at | timestamp | nullable | Optional soft-delete for history retention |

### Relationships

- Many reservations belong to one user.
- Many reservations belong to one space.

## Validation Rules

- `horario_inicio` and `horario_fim` must be within fixed 50-minute blocks between 07:00 and 22:00.
- `horario_fim > horario_inicio`.
- Reservation date must be in the future when creating or updating a pending/approved record.
- A reservation cannot overlap another approved reservation in the same space unless the other reservation is not approved.
- `justificativa_recusa` is required whenever `situacao = 'Recusada'`.
- Only an approved reservation with a future scheduled time is considered active/upcoming.
- Historical records remain in the table and are not physically deleted when cancellation or rejection occurs.

## State Transitions

- Pendente -> Aprovada
- Pendente -> Recusada
- Pendente -> Cancelada (if allowed by business rule)
- Aprovada -> Cancelada (if allowed by business rule)
- Aprovada -> Recusada is not valid for normal flow; the path is only Pendente -> Recusada
- Approved past bookings do not receive a new status; they remain historical by date/time

## Notes

This model intentionally keeps validation in the backend and database constraints to guarantee that business rules are enforced consistently.
