# Feature Specification: Space Scheduling System (Agendamento de Espaços)

**Feature Branch**: `001-space-scheduling`  
**Created**: 2026-08-17  
**Status**: Draft  
**Input**: Academic SDD activity with mandatory scope, fixed tech stack, 8 sessions × 90 minutes

## Scope Compliance Check *(mandatory)*

✅ **Scope Alignment**:
- ✅ Mandatory minimum scope included: auth (2 profiles), 3 entities, CRUD, search/filter, dashboard, 6 business rules
- ✅ Technology stack: React (frontend) + Node.js (backend) + PostgreSQL (database) only
- ✅ NO forbidden features (no password recovery, email, files, payments, PWA, LGPD, external integrations)
- ✅ User stories follow Core Feature Priority Sequence: Auth → Entities → CRUD → Search → Dashboard → Rules
- ✅ Each user story is independently testable and deliverable

## Clarifications

### Session 2026-08-24
- Q: Qual deve ser o ciclo de vida de status de reserva? → A: Pendente, Aprovada, Recusada e Cancelada; `Pendente -> Aprovada|Recusada`; `Pendente/Aprovada -> Cancelada` quando permitido pela regra de negócio; `Aprovada` com data/hora já passada é histórica e não recebe um novo status; reservas canceladas ou recusadas permanecem no banco para histórico e nunca são excluídas fisicamente; `Aprovada futura` é uma condição derivada, não um status.
- Q: Qual deve ser o limite diário de reservas por usuário? → A: Sem limite diário; apenas respeitar disponibilidade.
- Q: Quem pode cancelar uma reserva após a aprovação? → A: Dono até véspera; após, coordenador.
- Q: Quem aprova ou recusa reservas pendentes? → A: Coordenador aprova ou recusa reservas pendentes.
- Q: Quem pode visualizar reservas? → A: Ambos veem todas as reservas.

### Session 2026-10-26
- Q: Qual regra de duração e horários deve prevalecer? → A: Reservas usam blocos fixos de 50 minutos, entre 07:00 e 22:00, iguais para todos os espaços; no mesmo dia, só podem começar se o horário de início ainda estiver no futuro.
- Q: Quais reservas bloqueiam uma sobreposição? → A: Reservas `Pendente` e `Aprovada` bloqueiam o mesmo espaço e horário até a decisão do Coordenador; `Recusada` e `Cancelada` não bloqueiam.
- Q: Como manter e encerrar a sessão? → A: JWT em cookie `HttpOnly`, com expiração após 30 minutos sem atividade; logout invalida a sessão.
- Q: Qual cenário comprova concorrência? → A: Cinco tentativas simultâneas para o mesmo espaço e horário devem criar exatamente uma reserva; as demais são rejeitadas como conflito, sem duplicidade ou corrupção.
- Q: Quais indicadores exibir por perfil? → A: Professor: próprias reservas futuras, pendentes e aprovadas. Coordenador: total de espaços, reservas pendentes e aprovadas em todo o sistema.
- Q: Como revogar e proteger sessões? → A: JWT assinado vinculado a registro PostgreSQL em `Sessoes`; renovar JWT e sessão após atividade, expirar após 30 minutos sem atividade, revogar no logout, validar a origem de operações de escrita e usar cookie apropriado.
- Q: Como preservar espaços referenciados? → A: Arquivamento lógico, sem exclusão física; bloquear novas reservas e impedir arquivamento enquanto houver reservas futuras Pendentes ou Aprovadas.
- Q: Qual operação cancela reserva? → A: `PATCH /reservas/:id/status` é a operação canônica. Titular cancela até a véspera; no dia, somente Coordenador, antes do início e enquanto elegível.
- Q: Quais dados e filtros de usuário/espaço? → A: Email obrigatório também é email de contato e identificador de login; telefone é opcional. Espaços podem ser filtrados por trecho do nome e capacidade mínima.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Coordenador Login & Access Control (Priority: P1) 🎯 **GATE 1: Foundation**

The Coordenador needs to log in to the system and access coordinator features, including space management and all bookings.

**Why this priority**: Authentication and role-based access control are the absolute foundation. No other user story can proceed without this working first.

**Independent Test**: 
- Coordenador can log in with valid credentials and access the coordinator dashboard
- Coordenador sees coordinator-specific features (space management)
- Session persists across page refreshes; logging out clears session
- No other features visible until foundation is complete

**Acceptance Scenarios**:

1. **Given** the Coordenador is on the login page, **When** they enter valid credentials and click login, **Then** they are redirected to the coordinator dashboard
2. **Given** the Coordenador is logged in, **When** they refresh the page before 30 minutes of inactivity, **Then** the HttpOnly-cookie session persists
3. **Given** the Coordenador is logged in, **When** they click logout, **Then** the server revokes the corresponding `Sessoes` record, clears the cookie, and immediately rejects that token with 401
4. **Given** an invalid login attempt, **When** wrong credentials are entered, **Then** an error message is displayed and login is rejected
5. **Given** 30 minutes pass without authenticated activity, **When** the user makes a protected request, **Then** the persisted session is expired and the API returns 401
6. **Given** a Professor requests a Coordinator-only operation, **When** the API authorizes the request, **Then** it returns 403 regardless of frontend route visibility

---

### User Story 2 - Professor Login & Access (Priority: P1) 🎯 **GATE 1: Foundation**

The Professor needs to log in to the system and access Professor features, including browsing spaces and managing their own bookings.

**Why this priority**: Both user profiles are essential to the foundation. Users cannot perform any actions (booking) until authentication works.

**Independent Test**:
- Professor can log in with valid credentials and access the Professor dashboard
- User sees user-specific features (booking interface)
- Session works correctly; logout clears access
- Professor cannot access Coordinator-only features (e.g., space management)

**Acceptance Scenarios**:

1. **Given** the Professor is on the login page, **When** they enter valid credentials and click login, **Then** they are redirected to the Professor dashboard
2. **Given** the Professor is logged in, **When** they refresh the page before 30 minutes of inactivity, **Then** the HttpOnly-cookie session persists
3. **Given** the Professor is logged in, **When** they try to access Coordinator-only pages directly, **Then** they are redirected to the Professor dashboard and the API still rejects unauthorized operations
4. **Given** the Professor is logged in, **When** they click logout, **Then** the server revokes the corresponding `Sessoes` record, clears the cookie, and immediately rejects that token with 401
5. **Given** 30 minutes pass without authenticated activity, **When** the user makes a protected request, **Then** the session is expired and the API returns 401

---

### User Story 3 - Coordenador Views & Manages Spaces (Priority: P2) 🎯 **GATE 2: Core Entities**

The Coordenador needs to see a list of all spaces/rooms in the system and view their details. This establishes the central entity (Space) and its basic CRUD read operations.

**Why this priority**: Spaces must exist in the system before Professors can book them. The Coordenador must be able to view and configure spaces.

**Independent Test**:
- Coordenador can view a complete list of all spaces
- Coordenador can click on a space to see its full details (name, capacity, description, building location, operating hours)
- Spaces display correctly with all required attributes
- System handles empty state (no spaces initially)

**Acceptance Scenarios**:

1. **Given** the Coordenador is logged in and on the spaces listing page, **When** the page loads, **Then** a list of all spaces is displayed (or "no spaces yet" if none exist)
2. **Given** the Coordenador views the spaces list, **When** they click on a space, **Then** a details view shows: name, capacity, description, building location, and available time slots
3. **Given** spaces exist in the system, **When** the Coordenador refreshes the spaces list, **Then** the list is accurate and up-to-date
4. **Given** the Coordenador is viewing a space, **When** they navigate back to the spaces list, **Then** the list view loads correctly

---

### User Story 4 - Coordenador Creates & Updates Spaces (Priority: P2) 🎯 **GATE 2: Core Entities**

The Coordenador needs to add new spaces/rooms to the system and update their details (e.g., capacity, building location, description). This completes the CRUD for the Space entity.

**Why this priority**: Before Professors can book, spaces must exist. The Coordenador must be able to populate and maintain the space catalog.

**Independent Test**:
- Coordenador can create a new space with required attributes
- Coordenador can edit a space's details
- Changes persist in the database and are visible on subsequent page loads
- Validation prevents invalid data (e.g., capacity = 0, missing name)

**Acceptance Scenarios**:

1. **Given** the Coordinator is on the spaces page, **When** they click "Create New Space", **Then** a form appears with fields for name, capacity, description, building location, and operating hours (07:00–22:00)
2. **Given** the Coordenador fills out the space creation form and clicks save, **When** all required fields are valid, **Then** the space is created, a success message is shown, and the Coordenador is redirected to the spaces list
3. **Given** the Coordenador views a space, **When** they click edit and change its capacity from 20 to 25, **Then** the change is saved and the updated capacity is displayed on the space detail page
4. **Given** the Coordenador tries to create a space without a name, **When** they click save, **Then** a validation error is shown and the space is not created
5. **Given** a space has future Pendente or Aprovada reservations, **When** the Coordenador attempts to archive it, **Then** archiving is rejected with an explanatory message and the space remains non-archived
6. **Given** a space has no future Pendente or Aprovada reservations, **When** the Coordenador archives it, **Then** it is retained for historical references and unavailable for new reservations

---

### User Story 5 - User Browses Available Spaces & Time Slots (Priority: P3) 🎯 **GATE 3: Listing & Discovery**

A Professor needs to see a list of available spaces with their details and view available time slots for each space. This establishes the Professor-facing list view with search/filter capability.

**Why this priority**: Users must be able to discover spaces and see when they are available before they can book.

**Independent Test**:
- User can view a list of all available spaces
- User can see key space information (name, capacity, description)
- User can search/filter spaces by name or capacity
- User can view available time slots for a specific space
- Booking interface shows only future dates (not past dates)

**Acceptance Scenarios**:

1. **Given** the user is logged in and on the booking/spaces page, **When** the page loads, **Then** a list of all available spaces is displayed with their details
2. **Given** the user is viewing spaces, **When** they use the search field to filter by space name (e.g., "Lab"), **Then** only spaces matching "Lab" in their name are shown
3. **Given** the user is viewing spaces, **When** they filter by capacity (e.g., "10+"), **Then** only spaces with that capacity or greater are displayed
4. **Given** the Professor clicks on a space to see time slots, **When** the time slot view opens, **Then** only future dates and same-day slots whose start time is still in the future are available for selection
5. **Given** the user is viewing a space, **When** they click on a specific date, **Then** a list of available time slots for that day is shown with their start and end times

---

### User Story 6 - User Creates a Booking (Priority: P3) 🎯 **GATE 3: CRUD Complete**

A Professor needs to create a booking for a space on a specific date and time. This implements the Create operation of the central entity (Booking) and enforces business rule validation.

**Why this priority**: Core functionality - users must be able to make reservations. Business rules (no double booking, capacity limits, permission checks) are validated here.

**Independent Test**:
- User can select a space, date, and available time slot
- User can submit a booking with their details
- Booking is created and stored in the database
- User receives confirmation of their booking
- System prevents double-booking (no two bookings at same time in same space)

**Acceptance Scenarios**:

1. **Given** the Professor has selected a space and date, **When** they choose an available 50-minute slot, **Then** a booking form appears with their user info pre-filled and the selected time slot displayed
2. **Given** the user fills in their booking purpose/reason and clicks confirm, **When** the booking does not conflict with existing bookings, **Then** the booking is created, a success message is shown, and they are redirected to their bookings list
3. **Given** the user tries to book the same space at the same time as an existing booking, **When** they click confirm, **Then** a conflict error is displayed and the booking is rejected (business rule: no double booking)
4. **Given** the user attempts to book a space for a past date/time, **When** they try to confirm, **Then** an error is shown indicating bookings cannot be made in the past (business rule: future bookings only)
5. **Given** the authenticated profile is Professor, **When** they try to book a space, **Then** the booking is created for that Professor and cannot be reassigned to another user (business rule: permission check)
6. **Given** the Professor already has a reservation on a date, **When** they request another non-overlapping slot with availability on that date, **Then** the second reservation is accepted without a daily-limit error

---

### User Story 7 - Professor Views, Updates, Cancels Their Bookings (Priority: P3)

A Professor needs a personal view of their bookings, with the option to update eligible bookings and cancel them. This personal view defaults to the Professor's own records; the separate all-bookings listing remains available to both profiles as specified in FR-007.

**Why this priority**: Users must be able to manage their bookings after creating them. Full CRUD enables independent testing of booking management.

**Independent Test**:
- Professor can view their future bookings (Pendente/Aprovada not yet started) and historical bookings
- User can edit a booking (change date/time to another available slot)
- Professor can cancel an eligible booking without deleting its historical record
- Changes persist and are accurate
- User cannot modify other users' bookings

**Acceptance Scenarios**:

1. **Given** the Professor is logged in and on their bookings page, **When** the page loads, **Then** their future list includes not-yet-started Pendente and Aprovada reservations; an approved-only future filter includes only Aprovada reservations
2. **Given** the user views a booking, **When** they click edit, **Then** a form appears pre-filled with current booking details and available time slots
3. **Given** the user changes the time of their booking and clicks save, **When** the new time does not conflict, **Then** the booking is updated and the confirmation is shown
4. **Given** the Professor owns an eligible Pendente or Aprovada reservation scheduled for a future date, **When** they cancel it before that date through `PATCH /reservas/:id/status`, **Then** its status becomes `Cancelada` and the record remains in history
5. **Given** the Professor owns an eligible reservation scheduled for today, **When** they attempt cancellation through `PATCH /reservas/:id/status`, **Then** the API rejects it with 403 because same-day cancellation is Coordinator-only
6. **Given** the Coordenador requests cancellation of an eligible Pendente or Aprovada reservation scheduled for today before its start, **When** they use `PATCH /reservas/:id/status`, **Then** its status becomes `Cancelada` and the record remains in history
7. **Given** a reservation is already Cancelada or Recusada, or its scheduled start has passed, **When** anyone requests cancellation, **Then** the API rejects the transition with an actionable error and preserves its status
8. **Given** the Professor attempts to modify another user's booking directly (e.g., via URL), **When** they navigate to it, **Then** the API denies the modification (business rule: users can only modify their own bookings)

---

### User Story 8 - Coordenador Views All Bookings & Validates Business Rules (Priority: P4)

The Coordenador needs to see all bookings (not just their own) to monitor usage, resolve conflicts, and ensure business rules are being enforced. Both profiles can access the all-bookings listing.

**Why this priority**: Coordinator oversight is needed to manage the system and validate that all business rules are enforced correctly across all users.

**Independent Test**:
- Coordenador can view a complete list of all bookings (all users, all spaces)
- Coordenador can see who made each booking, when, and for what space
- Coordenador can filter/search bookings by space, user, or date range
- Coordenador can verify no bookings violate business rules
- Coordenador can see booking status and any conflicts

**Acceptance Scenarios**:

1. **Given** the Coordenador is on the bookings management page, **When** the page loads, **Then** all bookings across all users and spaces are displayed
2. **Given** the Coordenador is viewing bookings, **When** they filter by space, **Then** only bookings for that space are shown
3. **Given** the Coordenador is viewing bookings, **When** they search by user name, **Then** only that user's bookings are displayed
4. **Given** the Coordenador views the bookings list, **When** they look for conflicts or violations, **Then** no overlapping `Pendente` or `Aprovada` bookings show for the same space at the same time
5. **Given** the Coordenador views bookings, **When** they select `reservas futuras`, **Then** not-yet-started Pendente and Aprovada reservations are shown; when they select `Aprovada futura`, only not-yet-started Aprovada reservations are shown

---

### User Story 9 - Dashboard with Key Metrics & Indicators (Priority: P5)

Both profiles need to see 2-3 key business indicators:
- **Coordenador Dashboard**: total spaces, total pending bookings, and total approved bookings across the system.
- **Professor Dashboard**: own future bookings, own pending bookings, and own approved bookings.

**Why this priority**: Dashboard completes the MVP by providing visibility into system health and usage patterns. Achieves the "2-3 indicators" requirement.

**Independent Test**:
- Dashboard loads with accurate metrics
- Metrics are calculated correctly from booking and space data
- Indicators update when new bookings are made or cancelled
- Both the Coordenador and Professor dashboards show their defined role-specific data

**Acceptance Scenarios**:

1. **Given** the Coordenador is on the dashboard, **When** the page loads, **Then** total spaces, all `Pendente` bookings, and all `Aprovada` bookings are displayed
2. **Given** the Professor is on the dashboard, **When** the page loads, **Then** their future bookings (not-yet-started `Pendente` or `Aprovada`), all their pending bookings, and all their approved bookings are displayed
3. **Given** a booking is created or its status changes, **When** the dashboard is refreshed, **Then** the affected role-specific counts are recalculated correctly
4. **Given** a booking is cancelled, **When** the dashboard is refreshed, **Then** all metrics are recalculated and updated
5. **Given** the Professor views their dashboard, **When** they have no bookings, **Then** a helpful message indicates they have no future bookings

---

### Edge Cases

- What happens when a user tries to book an archived space?
- How does the system handle bookings that have already started (time slot now in progress)?
- What happens if two users try to book the same slot simultaneously (race condition)?
- How does filtering/search behave with special characters in space names?
- What happens if a user's session expires during booking creation?
- What if the database connection is lost during a booking operation?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authenticate users with email and password, supporting exactly 2 user profiles: Professor and Coordenador
- **FR-002**: System MUST enforce role-based access control on every protected API request. A missing or expired session returns 401; an authenticated profile without permission receives 403. Frontend route guards are not an authorization boundary.
- **FR-003**: System MUST maintain Space entities with attributes: name, capacity, description, required building location, daily operating-hours start and end, archive timestamp, and creation/update timestamps. Spaces are logically archived, never physically deleted, and retain historical reservation references. Archived spaces MUST NOT be available for new reservations. Archiving MUST be rejected with an explanatory message while the space has future Pendente or Aprovada reservations.
- **FR-004**: System MUST maintain Booking entities with attributes: user ID, space ID, booking date, start time, end time, purpose, status, and creation/update timestamps; status MUST be restricted to the fixed set: Pendente, Aprovada, Recusada, Cancelada. Bookings are never physically deleted; cancellation is represented by the status.
- **FR-005**: System MUST maintain User entities with attributes: ID, required unique email (used for login and contact), password (hashed), profile type (`Professor` or `Coordenador`), name, and optional phone number
- **FR-006**: Coordenador MUST be able to create, read, update, and logically archive spaces through a dedicated management interface
- **FR-019**: System MUST treat `Aprovada futura` as a derived condition for an `Aprovada` reservation whose start date/time has not passed. The separate dashboard metric `reservas futuras` includes not-yet-started `Pendente` and `Aprovada` reservations. Neither condition is a persisted status.
- **FR-020**: System MUST preserve cancelled or rejected bookings as historical records in the database; neither may be physically deleted.
- **FR-007**: Coordinators and Professors MUST both be able to view all bookings across all users and spaces with filtering by space, user, and date range; only the booking owner or Coordinator can update eligible reservations, and cancellation is limited to the owner before the reservation date or the Coordinator on that date before start
- **FR-008**: Professor MUST be able to create bookings by selecting a space, date, and available time slot
- **FR-009**: Professors MUST be able to view all bookings and update or cancel only their own eligible bookings, subject to the cancellation window and booking status rules. Cancellation MUST change the booking status to `Cancelada` without physically deleting the record.
- **FR-010**: Professor MUST be able to search spaces by a case-insensitive name substring and filter by minimum capacity (integer greater than zero); invalid filter values MUST return a clear validation error.
- **FR-011**: System MUST display a listing of available spaces with search/filter capability on the user interface
- **FR-012**: System MUST display these role-specific indicators: Professor—own future bookings (not-yet-started Pendente or Aprovada), own pending bookings, and own approved bookings; Coordinator—total non-archived spaces, all pending bookings, and all approved bookings.
- **FR-013**: System MUST enforce that no two `Pendente` or `Aprovada` bookings can occupy overlapping times in the same non-archived space. `Recusada` and `Cancelada` bookings do not block availability.
- **FR-014**: System MUST enforce that bookings can only be created or updated when their start date/time is in the future. Same-day bookings are allowed only when their start time is later than the current time.
- **FR-015**: System MUST enforce that Professors can only create bookings for themselves and update or cancel their own eligible bookings. Coordinators MAY manage other users' bookings according to their administrative permissions and the booking lifecycle rules.
- **FR-016**: System MUST validate that a space exists before allowing a booking to be created for it (business rule: space validation)
- **FR-017**: System MUST enforce that bookings use a fixed 50-minute slot aligned to the daily schedule beginning at 07:00 and fall within every space's 07:00–22:00 operating hours.

- **FR-018**: System MUST NOT impose a fixed daily booking limit per user. Bookings are subject to space availability and scheduling conflict validation.


### Key Entities

- **User**: Represents a person using the system (Professor or Coordenador)
  - Attributes: id, required unique email (login/contact email), password (hashed), profile_type (`Professor` or `Coordenador`), full_name, optional phone, created_at
  - Relationships: Has many Bookings

- **Session**: Server-verifiable authentication session linked to one User; it is an authentication-support record, not a fourth core business entity.
  - Attributes: id, user_id, created_at, last_activity_at, expires_at, revoked_at

- **Space**: Represents a bookable room/area in the facility
  - Attributes: id, name, capacity, description, building_location, operating_hours_start (07:00), operating_hours_end (22:00), archived_at, created_at, updated_at
  - Relationships: Has many Bookings; historical reservations retain the FK to archived spaces

- **Booking**: Represents a reservation for a space by a user
  - Attributes: id, user_id, space_id, booking_date, start_time, end_time, purpose, status, created_at, updated_at
  - Relationships: Belongs to User, Belongs to Space

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

SC-001–SC-003 are measured as user-visible elapsed time in the local acceptance run. Measure SC-004 with approximately 1000 seeded spaces and SC-005 with approximately 1000 seeded reservations; measure from initiating the search/page load until matching results or dashboard metrics are visible.

- **SC-001**: In a local acceptance run, users can complete a full authentication flow (login → dashboard access) in under 1 minute
- **SC-002**: In a local acceptance run, a new space can be created and appear in the booking interface within 30 seconds
- **SC-003**: In a local acceptance run, a booking can be created, submitted, and confirmed in under 2 minutes end-to-end
- **SC-004**: Search/filter of spaces by name returns matching results in under 1 second
- **SC-005**: Dashboard metrics calculate and display within 2 seconds of page load
- **SC-006**: Zero overlapping `Pendente` or `Aprovada` bookings are stored for the same space; `Recusada` and `Cancelada` records do not block a slot
- **SC-007**: 100% of created or updated bookings have a start date/time later than the current time; same-day future slots are accepted and past/current starts are rejected
- **SC-008**: All user-created, updated, and cancelled bookings respect permission boundaries (users cannot modify other users' bookings; cancellation changes status and never deletes the record)
- **SC-009**: Every business rule is enforced by the API; database constraints are used for rules expressible as constraints, and integration tests verify enforcement
- **SC-010**: In an integration test, five simultaneous attempts to create the same space/time slot produce exactly one reservation and four conflict responses; no overlapping `Pendente`/`Aprovada` records or partial/corrupt records remain
- **SC-011**: Professor and Coordinator dashboards display the three defined, accurate role-specific metrics
- **SC-012**: Error messages are clear and guide users toward resolution (no cryptic error codes)
- **SC-013**: The same Professor can create at least two bookings on the same date when the 50-minute slots do not overlap and spaces are available; no daily-limit validation rejects them

---

## Assumptions

- **Auth Method**: Simple email/password authentication is sufficient; no social login, SSO, or multi-factor authentication
- **Session Management**: A signed JWT is stored only in an HttpOnly cookie and identifies a PostgreSQL `Sessoes` record linked to the user. Every authenticated request validates the JWT signature and verifies that the session exists, is not revoked, and has not expired. Authenticated activity renews both the stored expiry and JWT for 30 minutes. Logout revokes the session record and clears the cookie; that token is immediately rejected with 401. Missing, expired, revoked, or unknown sessions return 401; authenticated users without permission receive 403. State-changing requests, including authentication endpoints, validate the configured request Origin. Cookies use SameSite=Lax; production deployments require HTTPS and Secure cookies. Frontend route guards are only a usability layer.
- **Password Storage**: All passwords must be hashed using bcrypt or equivalent; no plain text passwords stored
- **User Registration**: Initial users (Coordenador and sample Professores) will be created manually or via initial seed; no self-registration flow required
- **Booking Constraints**: 
  - Each booking uses exactly one 50-minute slot aligned to the schedule from 07:00 through 22:00, the same schedule for every space.
  - Pending and approved reservations block overlapping slots; rejected and cancelled reservations do not.
  - A booking on the current date is allowed only if its start time is later than the current time.
  - No recurring/recurring bookings (single bookings only)
  - No fixed daily limit on the number of bookings per user; each booking must respect space availability, operating hours, and scheduling conflict rules.
  - Cancellation policy: Cancellation is allowed only in these cases: the booking owner MAY cancel an eligible pending or approved booking before the reservation date; the Coordinator MAY cancel an eligible booking on the reservation date, only before its start time. Cancellation MUST change the status to `Cancelada` and preserve the booking in the database for historical records.
- **Data Retention**: No purging of past bookings required; all historical data retained in database
- **Operating Hours**: All spaces have the same daily operating hours, 07:00–22:00; no day-of-week variations in V1. The `Espaco` entity stores the required operating-hours attributes with these values.
- **Notifications**: No email confirmations, SMS, or push notifications required (business rules enforcement is local only)
- **UI Complexity**: Basic, functional UI focused on usability; no elaborate animations, no PWA, no responsive design beyond basic mobile viewport
- **Compliance**: No LGPD compliance, audit logging, or backup procedures required for this academic activity
- **Scale**: System designed for ~100 users and ~1000 bookings; no need to optimize for massive scale
- **Audit Trail**: User actions (create/update/cancel bookings) do not require comprehensive audit logging; timestamps and reservation status are sufficient
- **API Documentation**: Internal documentation sufficient; no public API documentation required
- **Testing Scope**: Unit and integration tests required; end-to-end browser testing assumed to be manual

---

## Business Rules *(Mandatory 6 Business Rules to Implement & Validate)*

1. **BR-001 - No Double Booking**: The system MUST prevent overlapping `Pendente` or `Aprovada` bookings for the same space. `Recusada` and `Cancelada` bookings do not block availability. A conflicting attempt MUST be rejected with a clear error message, including when requests arrive concurrently.

2. **BR-002 - Future Bookings Only**: The system MUST reject a booking created or updated when its start date/time is not later than the current date/time. Same-day bookings are allowed only for a slot whose start time is still in the future.


3. **BR-003 - Permission-Based Access**: The system MUST allow both Professors and Coordinators to view all bookings. Professors MUST only create bookings for themselves and MUST NOT modify bookings belonging to other users. Booking owners MAY update or cancel their own bookings only when permitted by the booking status and cancellation rules. Coordinators MAY manage bookings according to their administrative permissions, including approving, rejecting, and cancelling reservations when allowed.


4. **BR-004 - Space Validation**: The system MUST ensure that a non-archived Space entity exists before a Booking can reference it. Spaces are logically archived, never physically deleted, preserving FK references for historical reservations. Archiving MUST be rejected with an explanatory message while future Pendente or Aprovada reservations exist; archived spaces cannot receive new reservations.

5. **BR-005 - Operating Hours Compliance**: All spaces have daily operating hours from 07:00 to 22:00. Each reservation MUST use exactly one 50-minute slot aligned to the schedule beginning at 07:00, with no slot outside those hours.

6. **BR-006 - Booking Lifecycle & Historical Retention**: The system MUST use the fixed status set `Pendente`, `Aprovada`, `Recusada`, and `Cancelada`. Transitions are limited to `Pendente -> Aprovada | Recusada` and `Pendente/Aprovada -> Cancelada` when cancellation is allowed by business rules. Only the Coordinator may approve or reject pending bookings. Cancellation is allowed only in these cases: the owner cancels an eligible Pendente or Aprovada booking before its reservation date; the Coordinator cancels an eligible booking on the reservation date, only before its start time. Recusada or Cancelada bookings and bookings whose start time has passed cannot be cancelled again. Cancellation MUST use `PATCH /reservas/:id/status`, set `Cancelada`, and preserve the record; no reservation is physically deleted. `Aprovada` reservations that have already passed remain historical and do not require an additional status.

---

## Resolved Clarifications

- **Maximum daily bookings per user **: Resolved on 2026-08-24. No fixed daily booking limit. Bookings must respect space availability and scheduling conflict rules.
- **Booking cancellation policy**: Resolved on 2026-08-24 and clarified on 2026-10-26. Cancellation is limited to two cases: the booking owner may cancel until the day before the reservation date; on the reservation date, only the coordinator may cancel an eligible booking, and only before its start time.
- **Space operating hours format**: Resolved on 2026-10-26. All spaces have required `operating_hours_start` and `operating_hours_end` attributes set to 07:00 and 22:00; bookings use aligned 50-minute slots.
- **Reservation overlap**: Resolved on 2026-10-26. `Pendente` and `Aprovada` block overlapping slots; `Recusada` and `Cancelada` do not.
- **Authentication and authorization**: Resolved on 2026-10-26. JWT in HttpOnly cookie, 30-minute inactivity expiry, server-side invalidation on logout, 401 for unauthenticated/expired requests, and 403 for insufficient role permissions.
- **Admin vs. User distinction**: Exactly two roles are approved: Coordenador and Professor. Both can view all bookings; write operations follow owner/coordinator permissions and cancellation rules.
- **Dashboard metrics**: Resolved on 2026-10-26. Professor sees own future, pending, and approved bookings; Coordenador sees total spaces and system-wide pending and approved bookings.
- **Session revocation and CSRF**: Resolved on 2026-10-26. A signed JWT identifies a PostgreSQL `Sessoes` record; authenticated activity renews session and token, logout revokes immediately, and state-changing requests validate the configured Origin. Cookies use SameSite=Lax and production uses HTTPS/Secure.
- **Space archival**: Resolved on 2026-10-26. Spaces are retained with `archived_at`; future Pendente/Aprovada reservations prevent archival, and archived spaces are unavailable to new reservations.
- **User contact fields**: Resolved on 2026-10-26. Required unique email serves as login and contact email; phone is optional.
- **Space filters and future metrics**: Resolved on 2026-10-26. Name matching is case-insensitive substring; capacity filter is minimum integer > 0. Personal future count includes not-started Pendente/Aprovada; derived future-approved is Aprovada only.
- **Email notifications**: Out of scope per constitution; no email confirmations are required.

There are no unresolved product decisions blocking implementation.

---

**Version**: 1.0.0-DRAFT | **Created**: 2026-08-17 | **Next Phase**: Clarification (if needed) → Planning → Task Generation
