# Histórico — Endereços de Acesso Local

## Identificação

- Data: 2026-11-25
- Objetivo: padronizar o acesso e remover dependência do IP atual da rede local.

## Alterações

- Frontend configurado para usar somente URLs relativas em `/api`.
- Vite usa `localhost` na porta 5173 e proxy para o backend em `localhost:3001`.
- API confia sempre na origem canônica `http://localhost:5173`; origens adicionais podem ser listadas explicitamente em `TRUSTED_ORIGINS`. `FRONTEND_ORIGIN` legado permanece uma origem explicitamente configurada.
- O frontend não tenta definir manualmente `Origin`; o cabeçalho é fornecido pelo navegador. A API continua rejeitando origem ausente ou não confiável.
- Adicionado `iniciar.sh`, que verifica dependências e PostgreSQL, bloqueia inicializações duplicadas e encerra os processos filhos com Ctrl+C.
- Adicionado README com configuração, execução local e opção explícita para demonstração em rede.
- O smoke de inicialização encontrou uma opção de CLI Vite incompatível (`--root`); corrigido para usar a raiz como argumento posicional.

## Arquivos alterados

- `backend/.env.example`
- `backend/src/middleware/authMiddleware.js`
- `frontend/src/api/client.js`
- `frontend/src/api/client.test.jsx`
- `frontend/vite.config.js`
- `iniciar.sh`
- `README.md`

## Validação

- Backend: 16 testes aprovados, incluindo rejeição de origem ausente/não confiável.
- Frontend: 7 testes aprovados.
- Build de produção Vite concluído.
- Teste real no navegador usando `http://localhost:5173`: login Professor, reload restaurando sessão e logout concluídos.
- Backend e frontend responderam HTTP 200 nos respectivos smoke checks.
- `bash -n iniciar.sh` aprovado; execução real do script iniciou ambos os servidores e confirmou as URLs locais.
- Execução de `iniciar.sh` com serviços ativos recusou corretamente iniciar uma instância duplicada.
- Medições de contraste dos botões e controles de fechar ficaram acima de 4,5:1, inclusive no estado desabilitado.
- `git diff --check` sem erros.
- Não foi criado nem alterado qualquer dado ou credencial PostgreSQL.

## Observações

- O PostgreSQL existente estava parado durante a validação e foi iniciado novamente com o diretório de dados existente, sem migrações.
- Nenhum commit foi realizado.
