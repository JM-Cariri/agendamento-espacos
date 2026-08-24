# Quickstart: Local Setup

## Requirements

- Node.js 20+
- PostgreSQL 15+
- npm or pnpm
- Git

## 1. Database setup

1. Create a PostgreSQL database for the project.
2. Create a `.env` file in the backend folder with values like:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agendamento_espacos
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=change-me
PORT=3001
```

3. Run migrations or schema creation scripts for `Usuario`, `Espaco`, and `Reserva`.

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

Create default seed users:
- Professor: `professor@school.com` / `password123`
- Coordenador: `coordenador@school.com` / `password123`

Also create a few demo spaces and sample reservations to validate the schedule and approval flow.

## 5. Validation checklist

- User can log in as Professor or Coordenador
- Professor can create a reservation request
- Coordenador can approve or reject pending reservation
- Overlap validation blocks conflicting approved reservations in the same space
- Rejected or cancelled records remain available for history
- Dashboard shows 2-3 relevant indicator cards
