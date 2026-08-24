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
- Q: Qual deve ser o ciclo de vida de status de reserva? → A: Pendente, Aprovada, Recusada e Cancelada; `Pendente -> Aprovada|Recusada`; `Pendente/Aprovada -> Cancelada` quando permitido pela regra de negócio; `Aprovada` com data/hora já passada é histórica e não recebe um novo status; reservas canceladas ou recusadas permanecem no banco para histórico, com exclusão lógica apenas quando aplicável; `Ativa/upcoming` é uma condição derivada, não um status.
- Q: Qual deve ser o limite diário de reservas por usuário? → A: Sem limite diário; apenas respeitar disponibilidade.
- Q: Quem pode cancelar uma reserva após a aprovação? → A: Dono até véspera; após, coordenador.
- Q: Quem aprova ou recusa reservas pendentes? → A: Coordenador aprova ou recusa reservas pendentes.
- Q: Quem pode visualizar reservas? → A: Ambos veem todas as reservas.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin/Staff Login & Access Control (Priority: P1) 🎯 **GATE 1: Foundation**

An administrative staff member (e.g., receptionist, facility manager) needs to log in to the space scheduling system with their unique credentials and see only the features appropriate for their role (space management, all bookings).

**Why this priority**: Authentication and role-based access control are the absolute foundation. No other user story can proceed without this working first.

**Independent Test**: 
- Admin can log in with valid credentials and access the admin dashboard
- Admin sees admin-specific features (space management)
- Session persists across page refreshes; logging out clears session
- No other features visible until foundation is complete

**Acceptance Scenarios**:

1. **Given** the admin is on the login page, **When** they enter valid admin credentials and click login, **Then** they are redirected to the admin dashboard
2. **Given** the admin is logged in, **When** they refresh the page, **Then** the session persists and they remain logged in
3. **Given** the admin is logged in, **When** they click logout, **Then** they are redirected to the login page and cannot access protected pages without logging in again
4. **Given** an invalid login attempt, **When** wrong credentials are entered, **Then** an error message is displayed and login is rejected

---

### User Story 2 - Regular User/Student Login & Access (Priority: P1) 🎯 **GATE 1: Foundation**

A regular user (e.g., student, faculty member) needs to log in to the space scheduling system with their unique credentials and see only the features appropriate for their role (view available spaces, create and manage their own bookings).

**Why this priority**: Both user profiles are essential to the foundation. Users cannot perform any actions (booking) until authentication works.

**Independent Test**:
- Regular user can log in with valid credentials and access the user dashboard
- User sees user-specific features (booking interface)
- Session works correctly; logout clears access
- User cannot access admin features (e.g., space management)

**Acceptance Scenarios**:

1. **Given** the user is on the login page, **When** they enter valid user credentials and click login, **Then** they are redirected to the user dashboard
2. **Given** the user is logged in, **When** they refresh the page, **Then** the session persists and they remain logged in
3. **Given** the user is logged in, **When** they try to access admin-only pages directly (e.g., /admin/spaces), **Then** they are redirected to the user dashboard
4. **Given** a user is logged in, **When** they click logout, **Then** the session is cleared and they must log in again to access protected pages

---

### User Story 3 - Admin Views & Manages Spaces (Priority: P2) 🎯 **GATE 2: Core Entities**

The admin needs to see a list of all spaces/rooms in the system and be able to view their details. This establishes the central entity (Space) and its basic CRUD read operations.

**Why this priority**: Spaces must exist in the system before users can book them. The admin must be able to view and configure spaces.

**Independent Test**:
- Admin can view a complete list of all spaces
- Admin can click on a space to see its full details (name, capacity, description, operating hours)
- Spaces display correctly with all required attributes
- System handles empty state (no spaces initially)

**Acceptance Scenarios**:

1. **Given** the admin is logged in and on the spaces listing page, **When** the page loads, **Then** a list of all spaces is displayed (or "no spaces yet" if none exist)
2. **Given** the admin views the spaces list, **When** they click on a space, **Then** a details view shows: name, capacity, description, and available time slots
3. **Given** spaces exist in the system, **When** the admin refreshes the spaces list, **Then** the list is accurate and up-to-date
4. **Given** the admin is viewing a space, **When** they navigate back to the spaces list, **Then** the list view loads correctly

---

### User Story 4 - Admin Creates & Updates Spaces (Priority: P2) 🎯 **GATE 2: Core Entities**

The admin needs to add new spaces/rooms to the system and update their details (e.g., capacity, operating hours, description). This completes the CRUD for the Space entity.

**Why this priority**: Before users can book, spaces must exist. Admin must be able to populate and maintain the space catalog.

**Independent Test**:
- Admin can create a new space with required attributes
- Admin can edit a space's details
- Changes persist in the database and are visible on subsequent page loads
- Validation prevents invalid data (e.g., capacity = 0, missing name)

**Acceptance Scenarios**:

1. **Given** the admin is on the spaces page, **When** they click "Create New Space", **Then** a form appears with fields for name, capacity, description, and operating hours
2. **Given** the admin fills out the space creation form and clicks save, **When** all required fields are valid, **Then** the space is created, a success message is shown, and the admin is redirected to the spaces list
3. **Given** the admin views a space, **When** they click edit and change its capacity from 20 to 25, **Then** the change is saved and the updated capacity is displayed on the space detail page
4. **Given** the admin tries to create a space without a name, **When** they click save, **Then** a validation error is shown and the space is not created

---

### User Story 5 - User Browses Available Spaces & Time Slots (Priority: P3) 🎯 **GATE 3: Listing & Discovery**

A regular user needs to see a list of available spaces with their details and view available time slots for each space. This establishes the user-facing list view with search/filter capability.

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
4. **Given** the user clicks on a space to see time slots, **When** the time slot view opens, **Then** only future dates (starting tomorrow or today after current time) are available for selection
5. **Given** the user is viewing a space, **When** they click on a specific date, **Then** a list of available time slots for that day is shown with their start and end times

---

### User Story 6 - User Creates a Booking (Priority: P3) 🎯 **GATE 3: CRUD Complete**

A regular user needs to create a booking for a space on a specific date and time. This implements the Create operation of the central entity (Booking) and enforces business rule validation.

**Why this priority**: Core functionality - users must be able to make reservations. Business rules (no double booking, capacity limits, permission checks) are validated here.

**Independent Test**:
- User can select a space, date, and available time slot
- User can submit a booking with their details
- Booking is created and stored in the database
- User receives confirmation of their booking
- System prevents double-booking (no two bookings at same time in same space)

**Acceptance Scenarios**:

1. **Given** the user has selected a space and date, **When** they choose an available time slot, **Then** a booking form appears with their user info pre-filled and the selected time slot displayed
2. **Given** the user fills in their booking purpose/reason and clicks confirm, **When** the booking does not conflict with existing bookings, **Then** the booking is created, a success message is shown, and they are redirected to their bookings list
3. **Given** the user tries to book the same space at the same time as an existing booking, **When** they click confirm, **Then** a conflict error is displayed and the booking is rejected (business rule: no double booking)
4. **Given** the user attempts to book a space for a past date/time, **When** they try to confirm, **Then** an error is shown indicating bookings cannot be made in the past (business rule: future bookings only)
5. **Given** the user is not an admin, **When** they try to book a space, **Then** their booking can only be created/modified if they have the appropriate permission (business rule: permission check)

---

### User Story 7 - User Views, Updates, Deletes Their Bookings (Priority: P3)

A regular user needs to see a list of their own bookings, update booking details (e.g., time, date), and cancel bookings. This completes the CRUD for the Booking entity.

**Why this priority**: Users must be able to manage their bookings after creating them. Full CRUD enables independent testing of booking management.

**Independent Test**:
- User can view all their active and past bookings
- User can edit a booking (change date/time to another available slot)
- User can delete/cancel a booking
- Changes persist and are accurate
- User cannot modify other users' bookings

**Acceptance Scenarios**:

1. **Given** the user is logged in and on their bookings page, **When** the page loads, **Then** a list of their bookings is displayed (active/upcoming only, or filtered by status)
2. **Given** the user views a booking, **When** they click edit, **Then** a form appears pre-filled with current booking details and available time slots
3. **Given** the user changes the time of their booking and clicks save, **When** the new time does not conflict, **Then** the booking is updated and the confirmation is shown
4. **Given** the user is on their bookings page, **When** they click delete/cancel on a booking, **Then** a confirmation dialog appears; upon confirmation, the booking is deleted and removed from their list
5. **Given** the user attempts to access another user's booking directly (e.g., via URL), **When** they navigate to it, **Then** access is denied or they are redirected (business rule: user can only modify their own bookings)

---

### User Story 8 - Admin Views All Bookings & Validates Business Rules (Priority: P4)

The admin needs to see all bookings (not just their own) to monitor usage, resolve conflicts, and ensure business rules are being enforced. This establishes admin visibility over the entire booking system.

**Why this priority**: Admin oversight is needed to manage the system and validate that all business rules are enforced correctly across all users.

**Independent Test**:
- Admin can view a complete list of all bookings (all users, all spaces)
- Admin can see who made each booking, when, and for what space
- Admin can filter/search bookings by space, user, or date range
- Admin can verify no bookings violate business rules
- Admin can see booking status and any conflicts

**Acceptance Scenarios**:

1. **Given** the admin is on the bookings management page, **When** the page loads, **Then** all bookings across all users and spaces are displayed
2. **Given** the admin is viewing bookings, **When** they filter by space, **Then** only bookings for that space are shown
3. **Given** the admin is viewing bookings, **When** they search by user name, **Then** only that user's bookings are displayed
4. **Given** the admin views the bookings list, **When** they look for conflicts or violations, **Then** no two bookings show for the same space at the same time (business rule enforced)
5. **Given** the admin views bookings, **When** they look at timestamps, **Then** all bookings have future or current dates (no past bookings in active list)

---

### User Story 9 - Dashboard with Key Metrics & Indicators (Priority: P5)

Both admin and user need to see a dashboard with 2-3 key business indicators:
- **Admin Dashboard**: Total spaces, total active bookings, booking occupancy rate, peak booking times
- **User Dashboard**: Upcoming bookings count, total hours booked this month, most frequently booked spaces

**Why this priority**: Dashboard completes the MVP by providing visibility into system health and usage patterns. Achieves the "2-3 indicators" requirement.

**Independent Test**:
- Dashboard loads with accurate metrics
- Metrics are calculated correctly from booking and space data
- Indicators update when new bookings are made or cancelled
- Both admin and user dashboards show appropriate data for their roles

**Acceptance Scenarios**:

1. **Given** the admin is on the dashboard, **When** the page loads, **Then** 3 key metrics are displayed: total spaces, total active bookings, and booking occupancy rate (business rule: metrics accurately reflect system state)
2. **Given** the user is on their dashboard, **When** the page loads, **Then** their upcoming bookings count and total hours booked this month are displayed
3. **Given** a new booking is created, **When** the admin refreshes the dashboard, **Then** the booking count and occupancy rate are updated correctly
4. **Given** a booking is cancelled, **When** the dashboard is refreshed, **Then** all metrics are recalculated and updated
5. **Given** the user views their dashboard, **When** they have no bookings, **Then** a helpful message indicates they have no upcoming bookings

---

### Edge Cases

- What happens when a user tries to book a space that no longer exists (deleted by admin)?
- How does the system handle bookings that have already started (time slot now in progress)?
- What happens if two users try to book the same slot simultaneously (race condition)?
- How does filtering/search behave with special characters in space names?
- What happens if a user's session expires during booking creation?
- What if the database connection is lost during a booking operation?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authenticate users with email/username and password, supporting exactly 2 user profiles (admin and regular user)
- **FR-002**: System MUST enforce role-based access control, showing admin-specific features only to admins and user-specific features only to regular users
- **FR-003**: System MUST maintain Space entities with attributes: name, capacity, description, building location, operating hours, and creation timestamp
- **FR-004**: System MUST maintain Booking entities with attributes: user ID, space ID, booking date, start time, end time, purpose, status, optional logical-deletion fields (for historical records), and creation/update timestamps; status MUST be restricted to the fixed set: Pendente, Aprovada, Recusada, Cancelada
- **FR-005**: System MUST maintain User entities with attributes: ID, username/email, password (hashed), profile type (admin/user), name, and contact info
- **FR-006**: Admin MUST be able to create, read, update, and delete spaces through a dedicated management interface
- **FR-019**: System MUST treat `Ativa`/`upcoming` as a derived condition based on date/time (e.g., booking Aprovada whose date/time has not yet passed), and not as a separate persisted status
- **FR-020**: System MUST preserve cancelled or rejected bookings as historical records in the database, using logical deletion only when needed and never deleting them physically from the main booking history
- **FR-007**: Admin and regular users MUST both be able to view all bookings across all users and spaces with filtering by space, user, and date range; however, only the booking owner or the coordinator can update or cancel eligible reservations according to the business rules
- **FR-008**: Regular user MUST be able to create bookings by selecting a space, date, and available time slot
- **FR-009**: Regular user MUST be able to view, update, and delete their own bookings (not other users' bookings) when the cancellation window and status rules permit it; other users may still view the entire booking list for transparency, but cannot modify others' records
- **FR-010**: Regular user MUST be able to search and filter spaces by name and capacity
- **FR-011**: System MUST display a listing of available spaces with search/filter capability on the user interface
- **FR-012**: System MUST display a dashboard with 2-3 key business indicators (metrics) for both admin and user roles
- **FR-013**: System MUST enforce that no two bookings can occupy the same space at the same time (business rule: no double booking)
- **FR-014**: System MUST enforce that bookings can only be created for future dates/times (business rule: no past bookings)
- **FR-015**: System MUST enforce that users can only create/modify/delete their own bookings unless they are an admin (business rule: permission-based access)
- **FR-016**: System MUST validate that a space exists before allowing a booking to be created for it (business rule: space validation)
- **FR-017**: System MUST enforce that booking times fall within the space's operating hours (business rule: operating hours check)
- **FR-018**: System MUST limit individual users to a maximum of [TBD] bookings per day or prevent excessive bookings (business rule: booking limits)

### Key Entities

- **User**: Represents a person using the system (admin or regular user)
  - Attributes: id, username/email, password (hashed), profile_type, full_name, contact_info, created_at
  - Relationships: Has many Bookings

- **Space**: Represents a bookable room/area in the facility
  - Attributes: id, name, capacity, description, building_location, operating_hours_start, operating_hours_end, created_at, updated_at
  - Relationships: Has many Bookings

- **Booking**: Represents a reservation for a space by a user
  - Attributes: id, user_id, space_id, booking_date, start_time, end_time, purpose, status, created_at, updated_at
  - Relationships: Belongs to User, Belongs to Space

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a full authentication flow (login → dashboard access) in under 1 minute
- **SC-002**: A new space can be created and appear in the booking interface within 30 seconds
- **SC-003**: A booking can be created, submitted, and confirmed in under 2 minutes end-to-end
- **SC-004**: Search/filter of spaces by name returns matching results in under 1 second
- **SC-005**: Dashboard metrics calculate and display within 2 seconds of page load
- **SC-006**: Zero double bookings allowed - the system prevents 100% of attempted conflicting bookings
- **SC-007**: 100% of bookings created respect future-date-only constraint (no past bookings allowed)
- **SC-008**: All user-created/updated/deleted bookings respect user permission boundaries (users cannot modify other users' bookings)
- **SC-009**: All business rules are validated and enforced at the database layer (backend validation)
- **SC-010**: System successfully handles concurrent users (at least 5 simultaneous booking attempts without data corruption)
- **SC-011**: Both admin and user dashboards display 2-3 accurate key metrics
- **SC-012**: Error messages are clear and guide users toward resolution (no cryptic error codes)

---

## Assumptions

- **Auth Method**: Simple email/password authentication is sufficient; no social login, SSO, or multi-factor authentication
- **Session Management**: Browser-based session tokens (e.g., JWT) stored in HTTP-only cookies; session timeout after 30 minutes of inactivity
- **Password Storage**: All passwords must be hashed using bcrypt or equivalent; no plain text passwords stored
- **User Registration**: Initial users (admin and sample regular users) will be created manually or via initial seed; no self-registration flow required
- **Booking Constraints**: 
  - Booking duration is flexible (can book any length within operating hours)
  - No recurring/recurring bookings (single bookings only)
  - Maximum booking duration per day per user will be defined in business rules (currently TBD)
  - Cancellation allowed up to booking time (no restriction)
- **Data Retention**: No purging of past bookings required; all historical data retained in database
- **Operating Hours**: Defined as fixed times (e.g., 7 AM - 7 PM daily); no complex schedules (e.g., different hours per day of week) for V1
- **Notifications**: No email confirmations, SMS, or push notifications required (business rules enforcement is local only)
- **UI Complexity**: Basic, functional UI focused on usability; no elaborate animations, no PWA, no responsive design beyond basic mobile viewport
- **Compliance**: No LGPD compliance, audit logging, or backup procedures required for this academic activity
- **Scale**: System designed for ~100 users and ~1000 bookings; no need to optimize for massive scale
- **Audit Trail**: User actions (create/update/delete bookings) do not require comprehensive audit logging; timestamps on bookings are sufficient
- **API Documentation**: Internal documentation sufficient; no public API documentation required
- **Testing Scope**: Unit and integration tests required; end-to-end browser testing assumed to be manual

---

## Business Rules *(Mandatory 6 Business Rules to Implement & Validate)*

1. **BR-001 - No Double Booking**: The system MUST prevent two bookings from occupying the same space at the same time. When a user attempts to create a booking that conflicts with an existing booking, the system MUST reject the booking with a clear error message.

2. **BR-002 - Future Bookings Only**: The system MUST prevent bookings from being created, updated, or kept active for past dates or times. A booking cannot have a start_time before the current date/time.

3. **BR-003 - Permission-Based Access**: The system MUST ensure that regular users can only create, view, update, and delete their own bookings. Users cannot modify bookings created by other users. Only admins can view/manage all bookings.

4. **BR-004 - Space Validation**: The system MUST ensure that a Space entity exists before a Booking can reference it. If a space is deleted, its past bookings remain (for audit), but no new bookings can be created for that space.

5. **BR-005 - Operating Hours Compliance**: The system MUST enforce that all bookings start and end within the space's defined operating hours. A booking from 8 AM to 8:30 PM for a space operating 7 AM - 7 PM MUST be rejected.

6. **BR-006 - Booking Limit Per User**: The system MUST NOT impose a fixed daily booking limit per user. The system MUST only enforce space availability and time-slot conflicts. Fairness is managed by the availability constraints, not by a daily cap.

7. **BR-007 - Booking Lifecycle & Historical Retention**: The system MUST use the fixed status set `Pendente`, `Aprovada`, `Recusada`, and `Cancelada`. Transitions are limited to `Pendente -> Aprovada | Recusada` and `Pendente/Aprovada -> Cancelada` when cancellation is allowed by business rules. Only the coordinator may approve or reject pending bookings. The owner may cancel a booking until the day before the reservation date; after that, only the coordinator may cancel it. `Aprovada` reservations that have already passed in time are historical records and do not require an additional `Concluída` status. Cancelled or rejected reservations MUST remain stored for history and must not be physically deleted; if logical deletion is used, it must only apply as a soft-delete mechanism for relevant views or retention rules.

---

## Open Questions & Clarifications

**These items are reasonable defaults based on context; if your specific theme differs, update before planning:**

- **Maximum daily bookings per user (BR-006)**: Currently unspecified. Reasonable default = 3 per day. Adjust if your business context requires different limits.
- **Booking cancellation policy**: Currently allowing cancellation anytime. If your theme requires a notice period (e.g., 24 hours), specify it here.
- **Space operating hours format**: Currently assumed fixed daily hours (e.g., 7 AM - 7 PM). If your spaces have different hours per day, specify here.
- **Admin vs. User distinction**: Currently assumed admin has full system access and users can only manage their own bookings. Adjust if different roles are needed.
- **Email notifications**: Explicitly out of scope per constitution. If business context requires confirmations, add to spec and clarify implementation method.

---

**Version**: 1.0.0-DRAFT | **Created**: 2026-08-17 | **Next Phase**: Clarification (if needed) → Planning → Task Generation
