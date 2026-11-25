# Histórico — Limpeza da Base de Demonstração

## Identificação

- Data: 2026-11-25
- Banco: `agendamento_espacos`
- Objetivo: remover somente registros artificiais confirmados, preservando dados institucionais, contas e histórico legítimo ou incerto.

## Backup obrigatório

- Arquivo: `/home/mark/.local/backups/agendamento-espacos/agendamento_espacos_20261125_0956.dump`
- Formato: arquivo custom do `pg_dump`, com schema, dados e estado das sequences.
- Permissões: diretório de backup `0700`; arquivo `0600`.
- Tamanho: 19.706 bytes.
- SHA-256: `02fe17fd0747d9422b3753af111c320f89020f1ab2d9df28476c53394fdb18f8`
- Integridade: `pg_dump` terminou com sucesso; `pg_restore --list` enumerou 43 objetos; `pg_restore --file=/dev/null` leu o payload completo com sucesso.
- O backup foi criado e validado antes de qualquer alteração. Nenhuma credencial foi gravada neste arquivo de histórico.

Restauração recomendada em uma base de destino vazia (não executar sobre a base de demonstração ativa):

```bash
createdb --owner=agendamento_app agendamento_espacos_restore
pg_restore --no-owner --no-acl --dbname=agendamento_espacos_restore \
  /home/mark/.local/backups/agendamento-espacos/agendamento_espacos_20261125_0956.dump
```

O comando `createdb` requer uma função PostgreSQL com permissão para criar bases. O backup não deve ser restaurado com `--clean` sobre a base ativa.

## Atribuição dos registros

Os registros artificiais foram identificados pela combinação de nome gerado (`Espaço teste <timestamp>-<sufixo>`, opcionalmente seguido por `métricas`), descrição `Criado por teste de integração`, localização `Bloco de testes` e data de criação de 2026-11-24. Todos os espaços candidatos estavam arquivados. As reservas filhas tinham finalidades de integração conhecidas.

### Registros removidos

- Espaços: IDs 2, 6, 7, 8 e 9.
- Reservas dependentes: IDs 1–11.
- Ordem: remoção das reservas filhas e depois dos espaços, dentro da mesma transação PostgreSQL.
- A transação validou o conjunto esperado, as finalidades das reservas, o número exato de remoções e a ausência de referências restantes antes de confirmar.

### Registros preservados

- Usuários: IDs 1 e 2 — Professora Ana Silva e Coordenador Bruno Costa; nenhum usuário foi alterado.
- Espaços: ID 1 (`Sala 201`), ID 3 (`Sala 101`), ID 4 (`Laboratório de Informática`), ID 5 (`Auditório`) e ID 10 (`Espaço 4.0`).
- O ID 1 da auditoria anterior atualmente corresponde a `Sala 201`, com dados institucionais; não foi removido por causa da referência histórica ao ID.
- Reservas IDs 12, 13 e 14, todas vinculadas ao Espaço 4.0, foram preservadas. Embora as finalidades pareçam compatíveis com testes manuais, a origem individual não pôde ser comprovada; a orientação de preservar registros incertos foi aplicada.
- A conta do Professor e a conta do Coordenador foram preservadas.

## Resultado e integridade

Após a limpeza:

- Usuários: 2 (1 Professor e 1 Coordenador).
- Espaços: 5; todos os 5 estão ativos.
- Reservas: 3 (2 Canceladas, 1 Pendente e 0 Aprovadas).
- Referências órfãs entre reservas, usuários e espaços: 0.
- Indicadores reais do dashboard Coordenador: `totalEspacos=5`, `reservasPendentes=1`, `reservasAprovadas=0`.
- Nenhuma tabela, banco, usuário ou schema foi recriado; nenhuma regra de arquivamento foi alterada.

## Validação após a limpeza

- Login do Professor: HTTP 200; `/auth/me`: HTTP 200; logout: HTTP 200.
- Login do Coordenador: HTTP 200; consulta do dashboard: valores conforme acima; logout: HTTP 200.
- Origem não confiável em escrita: HTTP 403.
- Backend: 16 testes aprovados, 0 falhas; executados pelo script configurado para `agendamento_espacos_test`.
- Smoke do backend: 1 teste aprovado, 0 falhas; banco isolado de testes.
- Frontend: 8 testes aprovados, 0 falhas.
- Build do frontend: concluído.
- Os testes não alteraram a base principal; após a suíte, ela permaneceu com 2 usuários, 5 espaços e 3 reservas.

## Observações

- O dump de backup está fora do repositório, com permissões restritas, e não deve ser adicionado ao Git.
- Nenhum commit foi realizado.
