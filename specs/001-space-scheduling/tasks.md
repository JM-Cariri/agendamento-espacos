---
description: "Task list for the space scheduling MVP — revised session order"
---

# Tasks: Sistema de Agendamento de Espaços
**Input**: documentos em `/specs/001-space-scheduling/`
**Pré-requisitos**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/space-booking-api.md`
**Branch**: `001-space-scheduling`
**Estado**: planejamento revisado; T001 concluída após validação local; as demais tarefas permanecem pendentes.
## Organização e regras

- **8 sessões de referência, com teto de 90 minutos por sessão.** Cada sessão agrupa duas subtarefas pequenas, com estimativas-alvo que somam 90 minutos. As estimativas são metas, não garantia; se uma sessão exceder o tempo, registrar o desvio em vez de omitir testes.
- **Formato**: `- [ ] Tnnn [Sx] (~Xm) descrição — caminhos — requisitos`.
- **IDs T001–T016 preservados** para rastreabilidade com o planejamento anterior. A numeração **não determina** a ordem de execução; a ordem correta é a sequência das sessões e a ordem interna descrita em cada uma.
- Não há marcação `[P]` por padrão: as subtarefas dependem de resultados anteriores e devem ser executadas com verificação humana. Se houver dois estudantes atuando em paralelo, revisar dependências antes de dividir.
- Cada sessão termina com **teste verificável** e registro resumido do que mudou. Não marcar `[x]` antes de validar.
- **Stack obrigatório**: frontend React + Vite, backend Node.js + Express, banco PostgreSQL. O ambiente e a entrega são locais; não adicionar recursos fora do escopo.
- **Perfis únicos**: `Professor` e `Coordenador`. Autenticação e autorização de API vêm antes do uso das telas protegidas.
- **Estados únicos de reserva**: `Pendente`, `Aprovada`, `Recusada`, `Cancelada`. Cancelamento preserva o registro. Os dois perfis podem consultar todas as reservas, mas apenas usuários autorizados podem modificá-las.
- O banco PostgreSQL 17 local `agendamento_espacos` e o usuário `agendamento_app` já foram configurados e testados. **Não** recriar o banco nem versionar senhas ou credenciais reais.

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

- [x] **T001 [S1] (~45min)** Preparar a estrutura mínima `backend/` (Express, dependências, scripts e `.env.example`), conexão em `backend/src/config/database.js`, tabela `Usuario` com email obrigatório (login/contato) e telefone opcional, tabela de suporte `Sessoes` com FK para `Usuario`, migração inicial em `db/migrations/001_usuarios.sql` e seed local com dois usuários em `db/seeds/001_usuarios.js`. Armazenar somente **hashes** de senha. Referências: FR-001, FR-005; `data-model.md`.
- [ ] **T013 [S1] (~45min)** Implementar `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` e middleware de JWT/perfil em `backend/src/controllers/authController.js`, `backend/src/routes/authRoutes.js`, `backend/src/middleware/authMiddleware.js` e `backend/src/app.js`. O JWT assinado em cookie HttpOnly identifica uma sessão em `Sessoes`; validar assinatura, usuário, existência, revogação e expiração em cada requisição autenticada; renovar JWT e `expires_at` para 30 minutos após atividade; no logout gravar `revoked_at` antes de limpar o cookie. Validar `Origin` configurada em toda operação de escrita, usar SameSite=Lax e configurar Secure/HTTPS em produção. Segredo e origem permitida vêm do ambiente. Testar revogação imediata após logout, expiração de 30 minutos com relógio de teste controlável, 401/403 e origem não confiável. Referências: FR-001, FR-002, BR-003.

**Critérios independentes de validação**: banco reconhece exatamente os perfis Professor e Coordenador; senha inválida retorna 401; login válido define cookie HttpOnly sem expor token no corpo; endpoint protegido sem sessão ou após 30 minutos sem atividade retorna 401; logout revoga a linha de `Sessoes` e o token é imediatamente rejeitado; rota exclusiva de Coordenador acessada por Professor retorna 403; origem ausente/não confiável em escrita retorna 403. Testar com cliente HTTP compatível com cookies antes do React.

**Checkpoint**: autenticação e controle básico de acesso funcionais na API.

---

## Sessão 2: Interface de login e modelo completo

**Objetivo**: concluir as três entidades e demonstrar login, sessão e navegação separada por perfil.

- [ ] **T002 [S2] (~40min)** Acrescentar `Espaco` e `Reserva`, chaves estrangeiras restritivas, estados e índices na migração `db/migrations/002_espacos_reservas.sql`; criar seed de espaços em `db/seeds/002_espacos.js`. `Espaco` inclui localização obrigatória, horários fixos 07:00–22:00 e `archived_at` nullable; reserva referencia espaço sem permitir exclusão física. Não duplicar tabelas `Usuario`/`Sessoes` da S1. Referências: FR-003, FR-004, FR-005, FR-019, FR-020.
- [ ] **T014 [S2] (~50min)** Inicializar `frontend/` com React + Vite e implementar login, logout pela API, restauração de sessão no recarregamento usando o cookie HttpOnly, envio de credenciais/cookies e Origin esperado, proteção de rotas e menus por perfil em `frontend/src/pages/LoginPage.jsx`, `frontend/src/routes/AppRoutes.jsx`, `frontend/src/api/client.js` e `frontend/src/App.jsx`. Não armazenar nem expor JWT no frontend; a API é responsável pela autorização real. Medir o fluxo login→dashboard para SC-001. Referências: FR-001, FR-002, BR-003, SC-001.

**Critérios independentes de validação**: três entidades core relacionadas e tabela de suporte de sessão no banco; Professor e Coordenador fazem login; navegação mantém sessão no refresh por cookie; logout chama a API, revoga a linha no banco e limpa o cookie; acesso indevido recebe 403 da API e não revela tela administrativa.

**Checkpoint**: autenticação demonstrável na interface e modelo relacional pronto.

---

## Sessão 3: CRUD de Espaços

**Objetivo**: Coordenador administra espaços; Professor consulta, sem permissão de alteração.

- [ ] **T003 [S3] (~45min)** Implementar listagem, detalhe, criação, edição e arquivamento lógico via `PATCH /api/spaces/:id/archive` em `backend/src/controllers/spaceController.js` e `backend/src/routes/spaceRoutes.js`; validar nome, capacidade, localização obrigatória e horários; excluir fisicamente fica proibido. Rejeitar arquivamento com mensagem explicativa se existirem reservas futuras Pendente/Aprovada e garantir FK histórica. Testar arquivamento bloqueado/permitido. Referências: FR-003, FR-006, BR-003, BR-004.
- [ ] **T004 [S3] (~45min)** Implementar `frontend/src/pages/SpacesPage.jsx` e `frontend/src/components/SpaceForm.jsx` com listagem, cadastro, edição e ação de arquivar (sem DELETE), localização, horários 07:00–22:00 e erros acionáveis; medir o tempo de cadastro até aparecer na tela de reservas para SC-002. Referências: FR-006, FR-011, SC-002, SC-012.

**Critérios independentes de validação**: Coordenador cria/edita/consulta e arquiva espaços; Professor consulta e recebe 403 ao tentar modificar; arquivamento bloqueado por reservas futuras Pendente/Aprovada explica o motivo; arquivamento permitido preserva espaço e FKs históricas e impede novas reservas.

**Checkpoint**: gerenciamento de espaços disponível para o fluxo de reservas.

---

## Sessão 4: CRUD de Reservas

**Objetivo**: Professor solicita, consulta, altera e cancela suas reservas elegíveis; ambos podem consultar todas.

- [ ] **T005 [S4] (~50min)** Implementar `POST /api/reservas`, `GET /api/reservas`, `GET /api/reservas/:id`, `PUT /api/reservas/:id` e `PATCH /api/reservas/:id/status` em `backend/src/controllers/reservationController.js`, `backend/src/routes/reservationRoutes.js` e `backend/src/validators/reservationValidator.js`; não criar rota DELETE de reserva. O dono vem da sessão e o estado inicial é definido no servidor como `Pendente`. Validar sessão/autorização, origem em escrita, início futuro, espaço existente e não arquivado, slot fixo, titularidade, conflito atômico entre Pendente/Aprovada e política de cancelamento desde a primeira implementação. Cancelar somente se elegível: titular antes da data; no dia, Coordenador apenas antes do início; bloquear status Recusada/Cancelada e reserva já iniciada. Adicionar teste de criação válida, conflito e cancelamento pelo titular antes da data; testes concorrentes e dos outros limites de cancelamento ficam em T008. Confirmar que o mesmo Professor pode criar duas reservas não sobrepostas na data para SC-013. Referências: FR-004, FR-007–FR-009, FR-013–FR-018, BR-001–BR-006, SC-013.
- [ ] **T006 [S4] (~40min)** Criar `frontend/src/pages/ReservationsPage.jsx` e `frontend/src/components/ReservationForm.jsx` para solicitar reserva, listar, consultar detalhe, editar campos permitidos sem alterar estado/titular, e cancelar via `PATCH /api/reservas/:id/status` preservando histórico; exibir estado `Pendente` após criação e erros de conflito/cancelamento com instruções acionáveis. Referências: FR-007, FR-008, FR-009, FR-020, SC-012.

**Critérios independentes de validação**: criação persiste como Pendente; reservas são consultáveis; usuários não modificam reservas alheias; apenas PATCH de status cancela; titular antes da data pode cancelar; titular no dia recebe 403; Coordenador no dia, antes do início, pode cancelar; reserva Recusada/Cancelada ou iniciada não pode ser cancelada; espaço arquivado não recebe reserva; cinco tentativas concorrentes produzem uma criação e quatro conflitos; mensagens explicam como corrigir a entrada.

**Checkpoint**: CRUD de reserva funcional; cancelamento apenas por transição de status, sem exclusão física.

---

## Sessão 5: Listagem e pesquisa

**Objetivo**: permitir consultar reservas e localizar espaços com filtros claros.

- [ ] **T009 [S5] (~40min)** Adicionar parâmetros de pesquisa/filtro nas rotas e controladores de reservas e espaços em `backend/src/routes/reservationRoutes.js`, `backend/src/controllers/reservationController.js`, `backend/src/routes/spaceRoutes.js` e `backend/src/controllers/spaceController.js`: reservas por espaço, usuário, data, status e período; espaços por `nome` (substring case-insensitive) e `capacidadeMinima` (inteiro > 0); espaços arquivados ficam fora da busca normal. Validar período como `futuras` (Pendente/Aprovada não iniciadas) ou `aprovadasFuturas` (somente Aprovada não iniciadas). Testar correspondência de nome/capacidade e filtros inválidos, que retornam 400 com mensagem acionável. Referências: FR-007, FR-010, FR-011, FR-019, SC-012.
- [ ] **T010 [S5] (~50min)** Implementar listagem com filtros e consulta de horários disponíveis em `frontend/src/components/ReservationList.jsx`, `frontend/src/components/SpaceFilter.jsx` e páginas correspondentes; distinguir visualmente reservas futuras Pendente/Aprovada de futuras exclusivamente Aprovadas. A indicação visual de disponibilidade não substitui a validação do backend. Medir busca por nome até resultados visíveis para SC-004 com cerca de 1000 espaços-semente. Referências: FR-007, FR-010, FR-011, FR-019, SC-004.

**Critérios independentes de validação**: ambos os perfis visualizam todas as reservas; filtros retornam resultados correspondentes; busca de espaço por nome/capacidade funciona; ações indevidas continuam bloqueadas na API.

**Checkpoint**: listagem e filtros funcionando.

---

## Sessão 6: Dashboard

**Objetivo**: mostrar 2–3 indicadores reais para Professor e Coordenador.

- [ ] **T011 [S6] (~45min)** Implementar `GET /api/dashboard/metrics` em `backend/src/controllers/dashboardController.js` e `backend/src/routes/dashboardRoutes.js`, retornando conforme o perfil: Professor—reservas próprias futuras (Pendente ou Aprovada não iniciadas), pendentes e aprovadas; Coordenador—total de espaços não arquivados, reservas pendentes e aprovadas no sistema. `Aprovada futura` é condição derivada distinta e aprovada-only; contagens por status incluem histórico. Medir SC-005 com cerca de 1000 reservas-semente. Referências: FR-012, FR-019, SC-005.
- [ ] **T012 [S6] (~45min)** Renderizar os indicadores específicos do perfil em `frontend/src/pages/DashboardPage.jsx` e `frontend/src/components/MetricCard.jsx`, com estados de carregamento/erro simples e acesso pelos dois perfis. Medir os indicadores até ficarem visíveis para SC-005 com cerca de 1000 reservas-semente. Referências: FR-012, SC-005.

**Critérios independentes de validação**: valores mudam conforme o banco; dashboard não usa números fixos; Professor vê apenas suas contagens pessoais e Coordenador vê as contagens gerais definidas.

**Checkpoint**: painel funcional com três métricas verificáveis.

---

## Sessão 7: Consolidar regras de negócio e fluxo de aprovação

**Objetivo**: completar o ciclo da reserva e comprovar as seis regras exigidas pela constituição.

- [ ] **T007 [S7] (~50min)** Implementar/aprimorar `backend/src/services/reservationService.js` e `PATCH /api/reservas/:id/status` para aprovar e recusar com justificativa; manter histórico, garantir que aprovação não crie sobreposição com reserva Pendente/Aprovada mesmo sob concorrência e testar esse recheck concorrente; derivar as condições futura/Aprovada futura sem criar status `Concluida`. Cancelamento usa a mesma rota canônica e regras já exigidas desde T005. Executar fluxo Professor solicita → Coordenador aprova/recusa e medir SC-003. Referências: FR-019, FR-020, BR-001, BR-003, BR-006, SC-003.
- [ ] **T008 [S7] (~40min)** Consolidar validadores de status e horário em `backend/src/validators/reservationStatusValidator.js`, `backend/src/validators/reservationValidator.js` e `backend/src/middleware/errorHandler.js`; adicionar testes backend para **BR-001** conflito concorrente (cinco tentativas simultâneas para o mesmo slot resultam em uma criação e quatro 409), **BR-002** data futura, **BR-003** permissões, **BR-004** espaço existente/arquivado, **BR-005** horários, **BR-006** ciclo/histórico e os limites restantes de cancelamento: titular no dia (403) e Coordenador no dia antes do início (sucesso). Testar também repetição/estado inválido e mensagens acionáveis. Referências: FR-013–FR-017, BR-001–BR-006, SC-010, SC-012.

**Critérios independentes de validação**: Coordenador aprova/recusa reservas pendentes; recusa sem justificativa é rejeitada; Professor não aprova; titular antes da data e Coordenador no dia antes do início podem cancelar; titular no dia, estados repetidos/inválidos e reservas iniciadas são bloqueados; datas, horários e conflitos são bloqueados; as cinco tentativas concorrentes produzem exatamente uma reserva; canceladas e recusadas permanecem no banco; erros informam como corrigir.

**Checkpoint**: seis regras com testes e fluxo completo de aprovação/cancelamento.

---

## Sessão 8: Ajustes finais e regressão

**Objetivo**: apresentar um fluxo completo confiável, sem incluir novas funcionalidades.

- [ ] **T015 [S8] (~40min)** Ajustar navegação, feedback de ações, estados de carregamento, erros e formulários em `frontend/src/components/` e `frontend/src/pages/`; verificar que mensagens de conflito, arquivamento e cancelamento sejam claras e acionáveis (SC-012). Sem PWA, notificações ou outras extensões fora do escopo.
- [ ] **T016 [S8] (~50min)** Executar a suíte de regressão já implementada em `backend/tests/` e, quando aplicável, `frontend/tests/`: sessões/CSRF, 401/403, arquivamento, reservas, filtros, dashboards e seis regras; confirmar execução do teste concorrente (cinco solicitações, uma criação/quatro 409), concorrência de aprovação e múltiplas reservas não sobrepostas no mesmo dia. Os testes e medições SC-001–SC-005 são criados/executados nas tarefas correspondentes (SC-001 T014; SC-002 T004; SC-003 T007; SC-004 T010; SC-005 T012); T016 confere o resultado integrado, não concentra a criação ou aferição individual dos testes. Registrar regressão e atualizar o `quickstart.md` se necessário.

**Critérios independentes de validação**: fluxo Professor solicita → Coordenador aprova/recusa → todos consultam → titular ou Coordenador cancela quando autorizado; histórico preservado; nenhuma rota protegida acessível sem autenticação.

**Checkpoint**: MVP pronto para demonstração escolar.

---

## Regras documentais consolidadas

- Duração, janela diária e disponibilidade estão definidos em `spec.md`, `data-model.md`, `research.md` e no contrato da API: slots alinhados de 50 minutos, das 07:00 às 22:00; `Pendente` e `Aprovada` bloqueiam conflitos.
- `Espaco` inclui localização obrigatória e atributos de horário 07:00–22:00.
- Sessões usam cookie HttpOnly com expiração após 30 minutos sem atividade, logout invalidante e autorização no servidor.
- Testes de sessão, arquivamento, cancelamento, concorrência, erros acionáveis, desempenho e ausência de limite diário estão distribuídos nas tarefas correspondentes; T016 executa a regressão integrada.
- Indicadores pessoais do Professor e gerais do Coordenador estão separados em T011/T012.

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
