# API Contract: Space Booking

## Base URL

`/api`

## Authentication

### POST /auth/login

Request:

```json
{
  "email": "professor@school.com",
  "password": "password123"
}
```

Response:

```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "nome": "Ana Silva",
    "perfil": "Professor"
  }
}
```

## Spaces

### GET /spaces

Returns all spaces with their metadata.

### POST /spaces

Request:

```json
{
  "nome": "Sala 101",
  "capacidade": 30,
  "descricao": "Sala de aula com projetor"
}
```

### GET /spaces/:id

Returns a single space and its reservation summary.

### PUT /spaces/:id

Updates a space.

### DELETE /spaces/:id

Deletes a space if no hard constraints remain; otherwise returns validation error.

## Reservations

### GET /reservas

Returns all reservations; filters may include `status`, `spaceId`, `userId`, and `date`.

### POST /reservas

Request:

```json
{
  "usuario_id": 1,
  "espaco_id": 2,
  "data": "2026-08-25",
  "horario_inicio": "09:00",
  "horario_fim": "09:50",
  "finalidade": "Reunião de projeto",
  "situacao": "Pendente"
}
```

Validation:
- start/end must be in fixed 50-minute blocks
- date must be in the future
- no overlapping approved reservation in the same space
- no invalid time format

### GET /reservas/:id

Returns a single reservation with related user and space details.

### PUT /reservas/:id

Allows updates within defined business rules. Some transitions may be restricted by role and time.

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

### DELETE /reservas/:id

Soft delete or status-based cancel depending on policy. Records must remain for historical traceability unless a defined soft-delete rule is explicitly adopted.

## Dashboard

### GET /dashboard/metrics

Returns a small set of metrics, for example:

```json
{
  "totalEspacos": 12,
  "reservasAprovadas": 38,
  "percentualOcupacao": 62,
  "reservasHoje": 5
}
```

## Errors

All endpoints return errors in a standard JSON format:

```json
{
  "error": "Mensagem amigável de erro",
  "details": ["Campo obrigatório", "Sobreposição de horário"]
}
```
