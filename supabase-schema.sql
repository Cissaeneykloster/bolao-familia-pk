-- ── BOLÃO FAMÍLIA PK — Schema Supabase ─────────────────────────
-- Execute este SQL no painel Supabase: SQL Editor → New query

-- 1. Participantes
CREATE TABLE IF NOT EXISTS participantes (
  id          TEXT PRIMARY KEY,
  grupo_id    TEXT NOT NULL,
  nome        TEXT NOT NULL,
  apelido     TEXT NOT NULL,
  email       TEXT,
  telefone    TEXT,
  token       TEXT NOT NULL,
  ativo       BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Resultados oficiais (lançados pelo admin)
CREATE TABLE IF NOT EXISTS official_results (
  match_id    TEXT PRIMARY KEY,
  sa          INTEGER NOT NULL,
  sb          INTEGER NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pontos das partidas por participante
CREATE TABLE IF NOT EXISTS match_pts (
  apelido     TEXT PRIMARY KEY,
  pts         INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Palpites dos participantes
CREATE TABLE IF NOT EXISTS guesses (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  apelido     TEXT NOT NULL,
  match_id    TEXT NOT NULL,
  gols_a      INTEGER NOT NULL,
  gols_b      INTEGER NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(apelido, match_id)
);

-- 5. Previsão dos grupos (classificados)
CREATE TABLE IF NOT EXISTS group_predictions (
  apelido     TEXT NOT NULL,
  grupo_copa  TEXT NOT NULL,
  first_team  TEXT NOT NULL DEFAULT '',
  second_team TEXT NOT NULL DEFAULT '',
  saved       BOOLEAN DEFAULT false,
  PRIMARY KEY (apelido, grupo_copa)
);

-- ── Habilitar Realtime ───────────────────────────────────────────
ALTER TABLE participantes    REPLICA IDENTITY FULL;
ALTER TABLE official_results REPLICA IDENTITY FULL;
ALTER TABLE match_pts        REPLICA IDENTITY FULL;
ALTER TABLE guesses          REPLICA IDENTITY FULL;

-- ── Políticas de acesso (Row Level Security) ─────────────────────
-- Permite leitura e escrita pública (autenticação fica no app)
ALTER TABLE participantes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_pts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso_total" ON participantes    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON official_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON match_pts        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON guesses          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON group_predictions FOR ALL USING (true) WITH CHECK (true);
