---
description: "Task list for the space scheduling MVP — revised session order"
---

# Tasks: Sistema de Agendamento de Espaços
**Input**: documentos em `/specs/001-space-scheduling/`
**Pré-requisitos**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/space-booking-api.md`
**Branch**: `001-space-scheduling`
**Estado**: planejamento revisado; nenhuma tarefa de código foi marcada como concluída.
## Organização e regras

- **8 sessões de referência, com teto de 90 minutos por sessão.** Cada sessão agrupa duas subtarefas pequenas, com estimativas-alvo que somam 90 minutos. As estimativas são metas, não garantia; se uma sessão exceder o tempo, registrar o desvio em vez de omitir testes.
- **Formato**: `- [ ] Tnnn [Sx] (~Xm) descrição — caminhos — requisitos`.
- **IDs T001–T016 preservados** para rastreabilidade com o planejamento anterior. A numeração **não determina** a ordem de execução; a ordem correta é a sequência das sessões e a ordem interna descrita em cada uma.
- Não há marcação `[P]` por padrão: as subtarefas dependem de resultados anteriores e devem ser executadas com verificação humana. Se houver dois estudantes atuando em paralelo, revisar dependências antes de dividir.
- Cada sessão termina com **teste verificável** e registro resumido do que mudou. Não marcar `[x]` antes de validar.
- **Stack obrigatório**: frontend React + Vite, backend Node.js + Express, banco PostgreSQL. O ambiente e a entrega são locais; não adicionar recursos fora do escopo.
- **Perfis únicos**: `Professor` e `Coordenador`. Autenticação e autorização de API vêm antes do uso das telas protegidas.
- **Estados únicos de reserva**: `Pendente`, `Aprovada`, `Recusada`, `Cancelada`. Cancelamento preserva o registro. Os dois perfis podem consultar todas as reservas, mas apenas usuários autorizados podem modificá-las.
- O banco local `agendamento_espacos` e o usuário `agendamento_app` já foram configurados e testados. **Não** criar novamente o banco nem inserir senhas reais no Git.

## Dependências e sequência

1. **S1 — Autenticação: base de dados mínima e login na API** (T001 → T013)
2. **S2 — Autenticação no React e conclusão do modelo relacional** (T002 e T014, após S1)
3. **S3 — Gerenciamento completo de espaços** (T003 → T004)
4. **S4 — CRUD de reservas e interface de solicitação** (T005 → T006)
5. **S5 — Listagens, pesquisa e filtros** (T009 → T010)
6. **S6 — Indicadores e dashboard** (T011 → T012)
7. **S7 — Consolidação e testes das seis regras de negócio** (T007 → T008)
8. **S8 — Revisão final e regressão** (T015 → T016)

**Regra de dependência**: só iniciar a sessão seguinte após validar a anterior. As validações mínimas de segurança e reserva devem ocorrer desde a primeira rota correspondente; S7 reforça, consolida e testa essas regras, não autoriza deixar rotas inseguras até lá.

---

## Sessão 1: Base do backend e autenticação inicial

**Objetivo**: disponibilizar login real para os dois perfis, usando PostgreSQL, antes de começar as telas administrativas.

- [ ] **T001 [S1] (~45min)** Preparar a estrutura mínima `backend/` (Express, dependências, scripts e `.env.example`), conexão em `backend/src/config/database.js`, tabela `Usuario` e migração inicial em `db/migrations/001_usuarios.sql`, além de seed local com dois usuários de demonstração em `db/seeds/001_usuarios.js`. Armazenar somente **hashes** de senha. Referências: FR-001, FR-005; `data-model.md`.
- [ ] **T013 [S1] (~45min)** Implementar `POST /api/auth/login`, `GET /api/auth/me` e middleware de JWT/perfil em `backend/src/controllers/authController.js`, `backend/src/routes/authRoutes.js`, `backend/src/middleware/authMiddleware.js` e `backend/src/app.js`. Configurar segredo via ambiente, nunca no código. Referências: FR-001, FR-002, BR-003.

**Critérios independentes de validação**: banco reconhece exatamente os perfis Professor e Coordenador; senha inválida retorna 401; login válido retorna token; endpoint protegido sem token retorna 401; rota de Coordenador acessada por Professor retorna 403. Testar com `curl`/cliente HTTP antes do React.

**Checkpoint**: autenticação e controle básico de acesso funcionais na API.

---

## Sessão 2: Interface de login e modelo completo

**Objetivo**: concluir as três entidades e demonstrar login, sessão e navegação separada por perfil.

- [ ] **T002 [S2] (~40min)** Acrescentar `Espaco` e `Reserva`, chaves estrangeiras, estados e índices na migração `db/migrations/002_espacos_reservas.sql`; criar seed de espaços em `db/seeds/002_espacos.js`. Não duplicar a tabela `Usuario` criada na S1. Revisar campos com `spec.md` e `data-model.md` antes da migração. Referências: FR-003, FR-004, FR-005, FR-019, FR-020.
- [ ] **T014 [S2] (~50min)** Inicializar `frontend/` com React + Vite e implementar login, logout local, persistência de sessão no recarregamento, proteção de rotas e menus por perfil em `frontend/src/pages/LoginPage.jsx`, `frontend/src/routes/AppRoutes.jsx`, `frontend/src/api/client.js` e `frontend/src/App.jsx`. A API continua sendo responsável pela autorização real. Referências: FR-001, FR-002, BR-003.

**Critérios independentes de validação**: três entidades relacionadas no banco; Professor e Coordenador fazem login; navegação mantém sessão no refresh; logout remove credenciais locais; acesso indevido recebe 403 da API e não revela tela administrativa.

**Checkpoint**: autenticação demonstrável na interface e modelo relacional pronto.

---

## Sessão 3: CRUD de Espaços

**Objetivo**: Coordenador administra espaços; Professor consulta, sem permissão de alteração.

- [ ] **T003 [S3] (~45min)** Implementar listagem, detalhe, criação, edição e exclusão controlada de espaços em `backend/src/controllers/spaceController.js` e `backend/src/routes/spaceRoutes.js`; validar nome, capacidade e campos definidos na especificação; impedir exclusão que quebraria histórico de reservas. Referências: FR-003, FR-006, BR-003, BR-004.
- [ ] **T004 [S3] (~45min)** Implementar `frontend/src/pages/SpacesPage.jsx` e `frontend/src/components/SpaceForm.jsx` com listagem, cadastro, edição, exclusão quando permitida e mensagens de validação. Referências: FR-006, FR-011.

**Critérios independentes de validação**: Coordenador realiza CRUD de espaços com persistência; Professor pode consultar e recebe 403 ao tentar modificar; exclusão de espaço relacionado a reservas não apaga o histórico.

**Checkpoint**: gerenciamento de espaços disponível para o fluxo de reservas.

---

## Sessão 4: CRUD de Reservas

**Objetivo**: Professor solicita, consulta, altera e cancela suas reservas elegíveis; ambos podem consultar todas.

- [ ] **T005 [S4] (~50min)** Implementar `POST /api/reservas`, `GET /api/reservas`, `GET /api/reservas/:id`, `PUT /api/reservas/:id` e `DELETE /api/reservas/:id` **como cancelamento por status**, em `backend/src/controllers/reservationController.js`, `backend/src/routes/reservationRoutes.js` e `backend/src/validators/reservationValidator.js`. O dono vem da autenticação, e não de `usuario_id` enviado pelo cliente. Inserir validações mínimas de data futura, existência de espaço, horário, titularidade e conflito com reservas aprovadas. Referências: FR-004, FR-007, FR-008, FR-009, FR-013–FR-017, BR-001–BR-005.
- [ ] **T006 [S4] (~40min)** Criar `frontend/src/pages/ReservationsPage.jsx` e `frontend/src/components/ReservationForm.jsx` para solicitar reserva, listar, consultar detalhe, editar quando permitido e cancelar preservando histórico; exibir estado `Pendente` após criação. Referências: FR-007, FR-008, FR-009, FR-020.

**Critérios independentes de validação**: criação persiste como Pendente; reservas são consultáveis; usuários não modificam reservas alheias; cancelamento não apaga linhas; entradas inválidas retornam erros claros.

**Checkpoint**: CRUD de reserva funcional, com exclusão lógica por cancelamento.

---

## Sessão 5: Listagem e pesquisa

**Objetivo**: permitir consultar reservas e localizar espaços com filtros claros.

- [ ] **T009 [S5] (~40min)** Adicionar parâmetros de pesquisa/filtro nas rotas e controladores de reservas e espaços em `backend/src/routes/reservationRoutes.js`, `backend/src/controllers/reservationController.js`, `backend/src/routes/spaceRoutes.js` e `backend/src/controllers/spaceController.js`: espaço, usuário, data e status; nome/capacidade dos espaços. Referências: FR-007, FR-010, FR-011.
- [ ] **T010 [S5] (~50min)** Implementar listagem com filtros e consulta de horários disponíveis em `frontend/src/components/ReservationList.jsx`, `frontend/src/components/SpaceFilter.jsx` e páginas correspondentes. A indicação visual de disponibilidade não substitui a validação do backend. Referências: FR-007, FR-010, FR-011.

**Critérios independentes de validação**: ambos os perfis visualizam todas as reservas; filtros retornam resultados correspondentes; busca de espaço por nome/capacidade funciona; ações indevidas continuam bloqueadas na API.

**Checkpoint**: listagem e filtros funcionando.

---

## Sessão 6: Dashboard

**Objetivo**: mostrar 2–3 indicadores reais para Professor e Coordenador.

- [ ] **T011 [S6] (~45min)** Implementar `GET /api/dashboard/metrics` em `backend/src/controllers/dashboardController.js` e `backend/src/routes/dashboardRoutes.js`, calculando 3 indicadores reais: total de espaços, reservas pendentes e reservas aprovadas. Referência: FR-012.
- [ ] **T012 [S6] (~45min)** Renderizar os indicadores em `frontend/src/pages/DashboardPage.jsx` e `frontend/src/components/MetricCard.jsx`, com estados de carregamento/erro simples e acesso pelos dois perfis. Referência: FR-012.

**Critérios independentes de validação**: valores mudam conforme o banco; dashboard não usa números fixos; ambos os perfis conseguem visualizá-lo.

**Checkpoint**: painel funcional com três métricas verificáveis.

---

## Sessão 7: Consolidar regras de negócio e fluxo de aprovação

**Objetivo**: completar o ciclo da reserva e comprovar as seis regras exigidas pela constituição.

- [ ] **T007 [S7] (~50min)** Implementar/aprimorar `backend/src/services/reservationService.js` e endpoint `PATCH /api/reservas/:id/status` para aprovar, recusar com justificativa e cancelar dentro da janela autorizada; validar transições, manter histórico, impedir conflito de aprovações concorrentes e derivar reservas futuras sem criar status `Concluida`. Referências: FR-019, FR-020, BR-001, BR-003 e BR-006.
- [ ] **T008 [S7] (~40min)** Consolidar validadores de status e horário em `backend/src/validators/reservationStatusValidator.js`, `backend/src/validators/reservationValidator.js` e `backend/src/middleware/errorHandler.js`; adicionar testes backend para **BR-001** conflito, **BR-002** data futura, **BR-003** permissões, **BR-004** espaço existente, **BR-005** horários, **BR-006** ciclo e histórico. Referências: FR-013–FR-017, BR-001–BR-006.

**Critérios independentes de validação**: Coordenador aprova/recusa reservas pendentes; recusa sem justificativa é rejeitada; Professor não aprova; apenas titulares ou Coordenador cancelam nas condições aprovadas; datas, horários e conflitos são bloqueados; canceladas e recusadas permanecem no banco.

**Checkpoint**: seis regras com testes e fluxo completo de aprovação/cancelamento.

---

## Sessão 8: Ajustes finais e regressão

**Objetivo**: apresentar um fluxo completo confiável, sem incluir novas funcionalidades.

- [ ] **T015 [S8] (~40min)** Ajustar navegação, feedback de ações, estados de carregamento, erros e formulários em `frontend/src/components/` e `frontend/src/pages/`. Sem PWA, notificações ou outras extensões fora do escopo.
- [ ] **T016 [S8] (~50min)** Executar testes de regressão em `backend/tests/` e, quando aplicável, `frontend/tests/`: login/logout, 401/403, CRUD de espaços, reserva, filtros, dashboard e seis regras; conferir tentativa simultânea de aprovação conflitante; registrar execução e instruções locais no `quickstart.md` se necessário.

**Critérios independentes de validação**: fluxo Professor solicita → Coordenador aprova/recusa → todos consultam → titular ou Coordenador cancela quando autorizado; histórico preservado; nenhuma rota protegida acessível sem autenticação.

**Checkpoint**: MVP pronto para demonstração escolar.

---

## Pendências documentais antes de executar a S4

- **Duração de reserva**: o `data-model.md` original exige blocos fixos de **50 minutos (07:00–22:00)**, enquanto as *Assumptions* do `spec.md` original indicam duração flexível. **Não presumir uma das duas regras**: conferir a especificação atualmente aprovada e alinhar `data-model.md`, contrato e validadores antes da T005.
- **Campos de Espaço**: a especificação cita localização e horário de funcionamento, ausentes do quadro de atributos de `Espaco` na versão original do `data-model.md`. Conferir e alinhar antes da T002.
- **Documentos disponíveis**: a cópia ZIP analisada é anterior às correções de FR-018, BR-003 e BR-006 feitas no computador. **Manter as versões corrigidas locais de `spec.md` e do checklist**; esta revisão altera somente `tasks.md`.

## Final Validation Checklist

- [ ] As oito sessões respeitam a prioridade da constituição e têm checkpoints demonstráveis
- [ ] Nenhuma subtarefa supera a meta de tempo definida para a sessão sem registro/ajuste
- [ ] Exatamente dois perfis: Professor e Coordenador
- [ ] Três entidades relacionadas com FKs: Usuario, Espaco e Reserva
- [ ] CRUD de espaços e operações de reserva com cancelamento sem exclusão física
- [ ] Listagem com pesquisa/filtros
- [ ] Dashboard com 2–3 indicadores calculados do banco
- [ ] BR-001 a BR-006 implementadas e testadas no backend
- [ ] Sem funcionalidades fora do escopo ou dados sensíveis versionados
- [ ] README/quickstart e execução final validados antes da entrega
