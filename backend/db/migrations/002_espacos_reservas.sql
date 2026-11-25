DO $$ BEGIN
  CREATE TYPE situacao_reserva AS ENUM ('Pendente', 'Aprovada', 'Recusada', 'Cancelada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS espacos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL CHECK (length(trim(nome)) > 0),
  capacidade INTEGER NOT NULL CHECK (capacidade > 0),
  descricao TEXT,
  localizacao_predio VARCHAR(255) NOT NULL CHECK (length(trim(localizacao_predio)) > 0),
  horario_funcionamento_inicio TIME NOT NULL DEFAULT TIME '07:00',
  horario_funcionamento_fim TIME NOT NULL DEFAULT TIME '22:00',
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (horario_funcionamento_inicio = TIME '07:00' AND horario_funcionamento_fim = TIME '22:00')
);

CREATE TABLE IF NOT EXISTS reservas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  espaco_id INTEGER NOT NULL REFERENCES espacos(id) ON DELETE RESTRICT,
  data DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  finalidade TEXT NOT NULL CHECK (length(trim(finalidade)) > 0),
  situacao situacao_reserva NOT NULL DEFAULT 'Pendente',
  justificativa_recusa TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (horario_fim > horario_inicio),
  CHECK (EXTRACT(SECOND FROM horario_inicio) = 0 AND EXTRACT(SECOND FROM horario_fim) = 0),
  CHECK (horario_inicio >= TIME '07:00' AND horario_fim <= TIME '22:00'),
  CHECK (EXTRACT(EPOCH FROM (horario_fim - horario_inicio)) = 3000),
  CHECK (MOD(EXTRACT(EPOCH FROM (horario_inicio - TIME '07:00'))::INTEGER, 3000) = 0),
  CHECK ((situacao = 'Recusada' AND length(trim(COALESCE(justificativa_recusa, ''))) > 0)
      OR (situacao <> 'Recusada' AND justificativa_recusa IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_espacos_ativos_nome ON espacos (lower(nome)) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reservas_espaco_data_situacao ON reservas (espaco_id, data, situacao);
CREATE INDEX IF NOT EXISTS idx_reservas_usuario_data ON reservas (usuario_id, data);
CREATE INDEX IF NOT EXISTS idx_reservas_situacao ON reservas (situacao);
