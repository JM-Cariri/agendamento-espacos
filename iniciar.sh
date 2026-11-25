#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  trap - EXIT INT TERM
  for pid in "$FRONTEND_PID" "$BACKEND_PID"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  for pid in "$FRONTEND_PID" "$BACKEND_PID"; do
    if [[ -n "$pid" ]]; then
      wait "$pid" 2>/dev/null || true
    fi
  done
}

fail() {
  printf 'Erro: %s\n' "$*" >&2
  exit 1
}

command -v pg_isready >/dev/null || fail "pg_isready não foi encontrado. Instale os clientes do PostgreSQL."
command -v curl >/dev/null || fail "curl não foi encontrado."
command -v flock >/dev/null || fail "flock não foi encontrado."
command -v ss >/dev/null || fail "ss não foi encontrado."
[[ -f "$BACKEND_DIR/.env" ]] || fail "Crie backend/.env usando backend/.env.example e configure as credenciais localmente."
[[ -x "$FRONTEND_DIR/node_modules/.bin/vite" ]] || fail "Dependências do frontend ausentes. Execute: cd frontend && npm install"
[[ -d "$BACKEND_DIR/node_modules" ]] || fail "Dependências do backend ausentes. Execute: cd backend && npm install"

exec 9>"${TMPDIR:-/tmp}/agendamento-espacos-${UID}.lock"
flock -n 9 || fail "iniciar.sh já está em execução."

set -a
# shellcheck disable=SC1091
source "$BACKEND_DIR/.env"
set +a

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
PORT="${PORT:-3001}"
[[ "$PORT" == "3001" ]] || fail "Configure PORT=3001 em backend/.env para usar o proxy local padronizado."

pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1 || fail "PostgreSQL indisponível em ${DB_HOST}:${DB_PORT}."

for port in 3001 5173; do
  if ss -H -ltn "sport = :$port" | grep -q .; then
    fail "A porta $port já está em uso. Encerre a instância existente antes de iniciar novamente."
  fi
done

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
node "$BACKEND_DIR/src/app.js" &
BACKEND_PID=$!
"$FRONTEND_DIR/node_modules/.bin/vite" "$FRONTEND_DIR" --host localhost --config "$FRONTEND_DIR/vite.config.js" &
FRONTEND_PID=$!

for _ in {1..30}; do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null || ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    fail "Um dos servidores encerrou durante a inicialização."
  fi
  if curl --silent --fail --max-time 1 http://localhost:3001/health >/dev/null 2>&1 \
    && curl --silent --fail --max-time 1 http://localhost:5173/ >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

curl --silent --fail --max-time 1 http://localhost:3001/health >/dev/null 2>&1 \
  || fail "Backend não ficou pronto; consulte a mensagem exibida acima."
curl --silent --fail --max-time 1 http://localhost:5173/ >/dev/null 2>&1 \
  || fail "Frontend não ficou pronto; consulte a mensagem exibida acima."

printf 'Sistema iniciado. Acesse: http://localhost:5173\n'
printf 'API local: http://localhost:3001 (acessada pelo proxy /api do Vite)\n'
printf 'Pressione Ctrl+C para encerrar frontend e backend.\n'

while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 1
done
fail "Um dos servidores encerrou inesperadamente."
