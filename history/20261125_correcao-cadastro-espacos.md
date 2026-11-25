# Histórico — Correção do Cadastro de Espaços

## Identificação

- Data: 2026-11-25
- Objetivo: corrigir erro ao cadastrar espaços pela interface do Coordenador.

## Diagnóstico

O botão “Novo espaço” define `editing` como `{}`. Isso é intencional para abrir o formulário e, na renderização, a tela converte esse objeto sem `id` em `initialValue=null`, exibindo o formulário de criação. Porém, ao salvar, `if (editing)` avaliava o objeto vazio como verdadeiro e chamava `api.updateSpace(editing.id, data)`. Como `editing.id` era `undefined`, o cliente enviava `PUT /api/spaces/undefined`; o controller tentou validar o identificador e retornou “Informe um identificador de espaço válido.”

O banco gera o identificador automaticamente: `espacos.id` é `SERIAL PRIMARY KEY`; o `INSERT` de criação não inclui ID e usa `RETURNING *`. O endpoint correto de criação é `POST /api/spaces`. O método de edição é `PUT /api/spaces/:id`.

## Correção

- A seleção entre criação e edição agora verifica especificamente `editing?.id`.
- Sem ID selecionado, chama `api.createSpace(data)`; com ID, chama `api.updateSpace(id, data)`.
- Edição, validação do ID no backend, arquivamento e autorização existente para Coordenador foram preservados.
- As mensagens de validação do fluxo de espaços permanecem em português.

## Testes de regressão

- Frontend executa o formulário React do Coordenador, preenche “Espaço 4.0”, capacidade e localização, verifica `POST /api/spaces` sem ID e confirma o catálogo atualizado após a resposta.
- Backend verifica criação com ID serial, edição existente, rejeição de ID inválido em edição, campos obrigatórios ausentes e bloqueio de criação pelo Professor.
- Todos os testes de backend executam contra `agendamento_espacos_test`, nunca contra o banco normal.

## Validação

- Backend: 16 testes aprovados, 0 falhas.
- Frontend: 8 testes aprovados, 0 falhas.
- Build de produção Vite: aprovado.
- `git diff --check`: sem erros.
- Não houve exclusão de dados nem alteração da especificação.
- Nenhum commit foi realizado.

## Arquivos alterados nesta correção

- `frontend/src/pages/SpacesPage.jsx`
- `frontend/src/App.test.jsx`
- `backend/tests/domain.test.js`
- `history/20261125_correcao-cadastro-espacos.md`
