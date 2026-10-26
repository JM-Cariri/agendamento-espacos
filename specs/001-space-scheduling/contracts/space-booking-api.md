# API Contract: Space Booking

## Base URL

`/api`

## Authentication

### POST /auth/login

Request:

```json
{
  "email": "professor@school.com",
  "password": "<senha do usuário>"
}
```

Response:

```json
{
  "user": {
    "id": 1,
    "nome": "Ana Silva",
    "perfil": "Professor"
  }
}
```

The response sets a signed JWT only in an HttpOnly cookie (SameSite=Lax; Secure when served over HTTPS). The JWT identifies a PostgreSQL `Sessoes` record linked to the user. The server never returns the token in the response body or exposes it to frontend JavaScript.

Every authenticated request validates the JWT signature and checks that the session record exists, belongs to the JWT user, is not revoked, and has not expired. Authenticated activity updates `last_activity_at` and `expires_at` to 30 minutes after the activity and renews the JWT cookie with the same session identifier. Missing, invalid, expired, revoked, or unknown sessions return 401.

### GET /auth/me

Returns the authenticated user's identity and profile. Requires a valid session.

### POST /auth/logout

Sets `revoked_at` on the current `Sessoes` row, then clears the cookie. Revocation takes effect immediately; subsequent requests using the token return 401.

All protected API routes require a valid session (401 otherwise) and enforce profile permissions on the server (403 otherwise); frontend route guards are not an authorization boundary. All state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`), including login and logout, must validate the `Origin` header against the configured frontend origin and reject a missing or untrusted origin with 403. Cookies use SameSite=Lax. In production, serve over HTTPS and set Secure; local HTTP development may omit Secure.

## Spaces

### GET /spaces

Returns non-archived spaces by default. Optional query parameters:

| Parameter | Validation and behavior |
|---|---|
| `nome` | Optional non-empty string; case-insensitive substring match |
| `capacidadeMinima` | Optional positive integer; returns spaces with capacity greater than or equal to the value |

Example: `GET /spaces?nome=laboratorio&capacidadeMinima=20`

Response is an array of matching space objects including `id`, `nome`, `capacidade`, `descricao`, `localizacao_predio`, operating hours, `created_at`, and `updated_at`. Invalid or empty filter values return 400 with an actionable validation message. Archived spaces are excluded and cannot be booked.

### POST /spaces

Request:

```json
{
  "nome": "Sala 101",
  "capacidade": 30,
  "descricao": "Sala de aula com projetor",
  "localizacao_predio": "Bloco A, 1º andar",
  "horario_funcionamento_inicio": "07:00",
  "horario_funcionamento_fim": "22:00"
}
```

All spaces require a building location. Operating hours are 07:00–22:00 for every space in V1.

### GET /spaces/:id

Returns a single space and its reservation summary, including `archived_at` when archived so historical reservation references remain understandable.

### PUT /spaces/:id

Updates a space.

### PATCH /spaces/:id/archive

Logically archives a space by setting `archived_at`; never physically deletes it. Returns the archived space on success. Returns 409 with an explanatory message if it has future `Pendente` or `Aprovada` reservations. Its reservation FK remains intact and its historical bookings remain readable. New bookings against an archived space are rejected with 409.

Success response includes the archived space's `id` and `archived_at`; rejection uses the standard error response with an actionable explanation.

## Reservations

### GET /reservas

Returns all reservations; filters may include `status` (`Pendente`, `Aprovada`, `Recusada`, or `Cancelada`), `spaceId`, `userId`, `date`, `dateFrom`, and `dateTo`. Optional temporal filters:

| Parameter | Accepted value and behavior |
|---|---|
| `periodo` | `futuras`: includes not-yet-started `Pendente` and `Aprovada` reservations |
| `periodo` | `aprovadasFuturas`: includes only not-yet-started `Aprovada` reservations |

`periodo` accepts only these values; invalid values return 400. The two conditions are query filters, not persisted statuses.
When combined with other filters, all supplied filters are applied together. Invalid dates or a `dateFrom` later than `dateTo` return 400 with an actionable validation message.

### POST /reservas

Request:

```json
{
  "espaco_id": 2,
  "data": "2026-08-25",
  "horario_inicio": "09:00",
  "horario_fim": "09:50",
  "finalidade": "Reunião de projeto"
}
```

Validation:
- The owner is derived from the authenticated session; client-supplied `usuario_id` is not accepted.
- The server sets the initial status to `Pendente`; client-supplied status is not accepted.
- start/end must describe one consecutive 50-minute slot aligned from 07:00 through 22:00.
- start date/time must be later than the current date/time; a same-day slot is allowed only if it has not started.
- no overlapping `Pendente` or `Aprovada` reservation in the same space; `Recusada` and `Cancelada` do not block.
- conflict detection and creation must be atomic under concurrent requests.
- invalid date/time formats return 400 with an actionable validation message.

### GET /reservas/:id

Returns a single reservation with related user and space details.

### PUT /reservas/:id

Updates reservation details such as space, date, time, or purpose under the same ownership, future-start, non-archived-space, slot, and conflict validations as creation. It cannot change `usuario_id` or `situacao`; status transitions, including cancellation, are available only through `PATCH /reservas/:id/status`.

### PATCH /reservas/:id/status

Request:

```json
{
  "situacao": "Aprovada",
  "justificativa_recusa": null
}
```

When `situacao` is `Recusada`, the server requires:

```json
{
  "situacao": "Recusada",
  "justificativa_recusa": "Espaço já reservado para outra atividade"
}
```

For cancellation, request:

```json
{
  "situacao": "Cancelada"
}
```

Status changes are performed only through this endpoint; there is no reservation DELETE operation. Only the Coordinator may change a `Pendente` reservation to `Aprovada` or `Recusada`; rejection requires a non-empty `justificativa_recusa`. Approval must recheck overlap against `Pendente` and `Aprovada` reservations atomically. Other invalid transitions return 409.

Cancellation is performed by setting `situacao` to `Cancelada`. Backend validation:
- Cancellation is allowed only in these cases: the owner cancels an eligible `Pendente` or `Aprovada` reservation before its date; or the Coordinator cancels one on its date, before its start time.
- Reservations whose start time has passed, or whose status is already `Cancelada` or `Recusada`, cannot be cancelled; repeated/invalid transitions return 409 with an actionable message.
- Unauthorized same-day owner cancellation returns 403.
- Cancellation preserves the row and its history.

## Dashboard

### GET /dashboard/metrics

Returns metrics shaped by the authenticated profile. Professor response:

```json
{
  "perfil": "Professor",
  "minhasReservasFuturas": 5,
  "minhasReservasPendentes": 2,
  "minhasReservasAprovadas": 8
}
```

`minhasReservasFuturas` counts the Professor's not-yet-started Pendente or Aprovada reservations. This is distinct from `minhasReservasAprovadasFuturas`, a derived approved-only condition (not a separately persisted status). The selected dashboard metrics remain the first three fields shown above; status counts include all matching records, including historical records.

Coordinator response:

```json
{
  "perfil": "Coordenador",
  "totalEspacos": 12,
  "reservasPendentes": 5,
  "reservasAprovadas": 38
}
```

## Errors

Errors use a standard JSON format (401 unauthenticated/expired, 403 forbidden, 409 scheduling conflict, and 4xx for invalid input):

```json
{
  "error": "Mensagem amigável de erro",
  "details": ["Campo obrigatório", "Sobreposição de horário"]
}
```
