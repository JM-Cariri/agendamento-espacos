# Sistema de Agendamento de Espaços

Aplicação acadêmica local para solicitar e administrar reservas de espaços. A interface React é servida pelo Vite; o backend Express acessa o PostgreSQL existente.

## Requisitos

- Node.js 20 ou superior e npm
- PostgreSQL 17 em execução
- `pg_isready` e `curl`
- Linux com Bash e `flock`

## Configuração inicial

1. Confirme que o PostgreSQL existente está ativo.
2. Crie `backend/.env` a partir de `backend/.env.example` e preencha as credenciais localmente. Não versione nem compartilhe esse arquivo.
3. Use o banco configurado já existente (`agendamento_espacos`) e o usuário da aplicação. Não crie nem recrie o banco da aplicação.
4. Instale as dependências uma vez:

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

5. Se o schema ainda não estiver instalado, aplique as migrações existentes de forma explícita:

   ```bash
   cd backend && npm run db:migrate
   ```

   Seeds são comandos separados (`npm run db:seed`) e não são executados na inicialização normal.

## Inicialização diária

Na raiz do projeto:

```bash
./iniciar.sh
```

Abra **http://localhost:5173**. O script verifica PostgreSQL e dependências, impede uma segunda execução e encerra os processos iniciados ao pressionar `Ctrl+C`.

O frontend usa URLs relativas sob `/api`; o proxy de desenvolvimento do Vite encaminha essas chamadas para `http://localhost:3001`. Não acesse pelo IP da rede local: a origem canônica aprovada é `http://localhost:5173`.

## Origens confiáveis e segurança

- A API aceita sempre `http://localhost:5173` para operações de escrita locais.
- Para autorizar outro frontend, configure `TRUSTED_ORIGINS` explicitamente em `backend/.env`, com origens completas separadas por vírgula, por exemplo `https://frontend.exemplo.edu`. Não use `*`.
- Para uma demonstração em outro computador na rede local, adicione a origem exata usada pelo navegador (incluindo esquema, endereço e porta) a `TRUSTED_ORIGINS` e inicie o Vite com `npm run dev -- --host 0.0.0.0`. Se o endereço da máquina mudar, atualize somente essa origem explícita. O acesso padrão deste projeto continua sendo localhost.
- `FRONTEND_ORIGIN` legado permanece aceito como uma origem explícita. A origem vem do navegador; o frontend não sobrescreve o cabeçalho `Origin`.
- O cookie de sessão continua HttpOnly e SameSite=Lax; a API mantém JWT assinado e validação CSRF por origem.
- Não habilite CORS com wildcard e credenciais.

## Testes e build

```bash
cd backend && npm test
cd frontend && npm test
cd frontend && npm run build
```

Os testes do backend usam `agendamento_espacos_test`, separado do banco usado para execução normal. Nenhum dado de teste deve ser criado no banco de demonstração.
