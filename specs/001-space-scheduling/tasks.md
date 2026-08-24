---
description: "Task list for the space scheduling MVP"
---

# Tasks: Sistema de Agendamento de Espaços

**Input**: Design documents from `/specs/001-space-scheduling/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md, contracts/space-booking-api.md

**Organization**: Tasks are grouped into 8 delivery sessions of 90 minutes each, in the following order: modelo de dados → CRUD de Espaço → fluxo de Reserva → regras de negócio → listagem/filtro → painel → login/permissões → ajustes finais.

**Format**: `[ID] [Sx] [P?] Description with file path`

- **[Sx]**: session number from 1 to 8
- **[P]**: can run in parallel when work is in different files and no dependency exists
- All tasks are kept intentionally small enough for a single 90-minute block

## Session Order and Dependencies

1. S1: Modelo de dados
2. S2: CRUD de Espaço
3. S3: Fluxo de Reserva
4. S4: Regras de negócio
5. S5: Listagem e filtro
6. S6: Painel
7. S7: Login e permissões
8. S8: Ajustes finais

**Dependency rule**: each session begins only after the previous session is validated and complete.

**Parallel opportunities**:
- Session 1: `T001` and `T002` can be done in parallel by different developers if needed.
- Session 2: `T003` and `T004` can be split between backend and frontend.
- Session 3: `T005` and `T006` can be implemented in parallel after S2 is done.
- Session 4: `T007` and `T008` can be split between validation layer and API controller updates.

---

## Sessão 1: Modelo de dados

**Objetivo**: Definir as entidades principais e preparar a base do banco.

**Critério de teste independente**: banco cria as tabelas e seeds iniciais sem erros; modelo de dados responde aos requisitos de Usuário, Espaço e Reserva.

- [ ] T001 [S1] Create PostgreSQL schema and migrations for Usuario, Espaco, and Reserva in `db/migrations/001_initial_schema.sql`
- [ ] T002 [S1] [P] Configure ORM/DB bootstrap and seed the default roles and sample spaces in `backend/src/config/database.js` and `db/seeds/001_demo_data.sql`

**Checkpoint**: schema e seed prontos; sessão 2 pode iniciar.

---

## Sessão 2: CRUD de Espaço

**Objetivo**: Criar o cadastro básico de espaços (listagem, criação, edição, remoção).

**Critério de teste independente**: administrador consegue listar, cadastrar e editar espaços; todas as operações salvam no banco com validações mínimas.

- [ ] T003 [S2] [P] Implement backend space CRUD endpoints in `backend/src/controllers/spaceController.js` and `backend/src/routes/spaceRoutes.js`
- [ ] T004 [S2] [P] Implement space management screen and forms in `frontend/src/pages/SpacesPage.jsx` and `frontend/src/components/SpaceForm.jsx`

**Checkpoint**: espaço está disponível para uso na reserva; sessão 3 pode iniciar.

---

## Sessão 3: Fluxo de Reserva

**Objetivo**: Permitir que o professor solicite reservas e veja o fluxo de criação/consulta.

**Critério de teste independente**: professor consegue criar uma reserva pendente com data, horário e finalidade; reserva aparece na listagem do professor.

- [ ] T005 [S3] [P] Implement reservation creation endpoint and validation in `backend/src/controllers/reservationController.js` and `backend/src/validators/reservationValidator.js`
- [ ] T006 [S3] [P] Implement reservation request screen and list in `frontend/src/pages/ReservationsPage.jsx` and `frontend/src/components/ReservationForm.jsx`

**Checkpoint**: fluxo principal de criação de reserva funcional; sessão 4 pode iniciar.

---

## Sessão 4: Regras de negócio

**Objetivo**: Garantir as validações críticas do domínio e o ciclo de aprovação/cancelamento.

**Critério de teste independente**: regras de sobreposição, recusa, cancelamento e histórico são validadas do backend e respondem corretamente.

- [ ] T007 [S4] Implement business rules for approval, rejection, cancellation, and historical retention in `backend/src/services/reservationService.js`
- [ ] T008 [S4] Add rejection justification validation and conflict checks in `backend/src/validators/reservationStatusValidator.js` and `backend/src/middleware/errorHandler.js`

**Checkpoint**: todas as regras de negócio do domínio atendidas; sessão 5 pode iniciar.

---

## Sessão 5: Listagem e filtro

**Objetivo**: Exibir reservas e espaços com busca e filtro para o usuário e o coordenador.

**Critério de teste independente**: usuário consegue buscar por espaço, data e status e visualizar o conjunto relevante de reservas.

- [ ] T009 [S5] [P] Implement filtered reservation list endpoint in `backend/src/routes/reservationRoutes.js` and `backend/src/controllers/reservationController.js`
- [ ] T010 [S5] [P] Implement search/filter UI in `frontend/src/components/ReservationList.jsx` and `frontend/src/components/SpaceFilter.jsx`

**Checkpoint**: listagem e filtro funcional; sessão 6 pode iniciar.

---

## Sessão 6: Painel

**Objetivo**: Exibir indicadores principais para professor e coordenador.

**Critério de teste independente**: painel mostra 2 a 3 indicadores calculados com base em dados reais da aplicação.

- [ ] T011 [S6] [P] Implement dashboard metrics endpoint in `backend/src/controllers/dashboardController.js` and `backend/src/routes/dashboardRoutes.js`
- [ ] T012 [S6] [P] Render the dashboard cards in `frontend/src/pages/DashboardPage.jsx` and `frontend/src/components/MetricCard.jsx`

**Checkpoint**: painel com indicadores funcionando; sessão 7 pode iniciar.

---

## Sessão 7: Login e permissões

**Objetivo**: Finalizar autenticação simples por perfil e controle de permissões.

**Critério de teste independente**: professor e coordenador acessam telas diferentes conforme perfil; login com credenciais válidas funciona.

- [ ] T013 [S7] [P] Implement login and JWT/session handling in `backend/src/controllers/authController.js` and `backend/src/middleware/authMiddleware.js`
- [ ] T014 [S7] [P] Implement route protection and role-aware UI in `frontend/src/routes/AppRoutes.jsx` and `frontend/src/pages/LoginPage.jsx`

**Checkpoint**: autenticação e permissão definidos e funcionando; sessão 8 pode iniciar.

---

## Sessão 8: Ajustes finais

**Objetivo**: Revisão geral, correções e validação final do sistema.

**Critério de teste independente**: fluxo completo consegue ser executado end-to-end sem erros de regra de negócio ou navegação.

- [ ] T015 [S8] Improve final UX polish, loading/error states, and button flows in `frontend/src/components/` and `frontend/src/pages/`
- [ ] T016 [S8] Run regression checks and finalize API/UX validation in `backend/tests/` and `frontend/tests/`

**Checkpoint**: MVP concluído dentro do prazo e pronto para demonstração.

---

## Final Validation Checklist

- [ ] All tasks fit in a single 90-minute block
- [ ] Only the required stack is used (React + Node.js + PostgreSQL)
- [ ] In-scope features are completed and out-of-scope features are excluded
- [ ] Business rules are enforced in backend and validated in tests
- [ ] The application is demonstrable in the 8-session academic format
