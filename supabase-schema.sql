-- ── BOLÃO FAMÍLIA PK — Schema Supabase ─────────────────────────
-- Execute este SQL no painel Supabase: SQL Editor → New query
-- (instalação nova; bancos existentes usam supabase/migrations/)

-- Exibe timestamps em horário de Brasília no painel e nas consultas
-- (timestamptz sempre guarda o instante; isto muda apenas a exibição)
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';

-- 1. Grupos (config que o app exibe: nome, emoji, idioma)
CREATE TABLE IF NOT EXISTS grupos (
  id         TEXT PRIMARY KEY,
  nome       TEXT NOT NULL,
  emoji      TEXT NOT NULL DEFAULT '⭐',
  lang       TEXT NOT NULL DEFAULT 'pt',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO grupos (id, nome, emoji, lang) VALUES
  ('pk',    'Família PK',     '⭐', 'pt'),
  ('cissa', 'Grupo da Cissa', '🌟', 'pt'),
  ('pedro', 'Pedro''s Group', '🔵', 'en')
ON CONFLICT (id) DO NOTHING;

-- 2. Participantes
CREATE TABLE IF NOT EXISTS participantes (
  id          TEXT PRIMARY KEY,
  grupo_id    TEXT NOT NULL,
  nome        TEXT NOT NULL,
  apelido     TEXT NOT NULL,
  email       TEXT,
  telefone    TEXT,
  token       TEXT NOT NULL,
  ativo       BOOLEAN DEFAULT true,
  user_id     UUID UNIQUE REFERENCES auth.users(id),  -- vínculo com o Auth (Fase 3)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Admins (preenchida na Fase 3, quando os admins virarem usuários Auth)
CREATE TABLE IF NOT EXISTS admins (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id),
  grupo_id   TEXT NOT NULL REFERENCES grupos(id),
  usuario    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Resultados oficiais (lançados pelo admin)
CREATE TABLE IF NOT EXISTS official_results (
  match_id    TEXT PRIMARY KEY,
  sa          INTEGER NOT NULL,
  sb          INTEGER NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Pontos das partidas por participante
CREATE TABLE IF NOT EXISTS match_pts (
  apelido     TEXT PRIMARY KEY,
  grupo_id    TEXT,
  pts         INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Palpites dos participantes
CREATE TABLE IF NOT EXISTS guesses (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  apelido         TEXT NOT NULL,
  participante_id TEXT REFERENCES participantes(id) ON DELETE SET NULL,
  grupo_id        TEXT,
  match_id        TEXT NOT NULL,
  gols_a          INTEGER NOT NULL,
  gols_b          INTEGER NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(apelido, match_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS guesses_participante_match_key
  ON guesses (participante_id, match_id);

-- 7. Previsão dos grupos (classificados)
CREATE TABLE IF NOT EXISTS group_predictions (
  apelido         TEXT NOT NULL,
  participante_id TEXT REFERENCES participantes(id) ON DELETE SET NULL,
  grupo_id        TEXT,
  grupo_copa      TEXT NOT NULL,
  first_team      TEXT NOT NULL DEFAULT '',
  second_team     TEXT NOT NULL DEFAULT '',
  saved           BOOLEAN DEFAULT false,
  PRIMARY KEY (apelido, grupo_copa)
);

CREATE UNIQUE INDEX IF NOT EXISTS group_predictions_participante_grupo_key
  ON group_predictions (participante_id, grupo_copa);

-- ── Habilitar Realtime ───────────────────────────────────────────
ALTER TABLE participantes    REPLICA IDENTITY FULL;
ALTER TABLE official_results REPLICA IDENTITY FULL;
ALTER TABLE match_pts        REPLICA IDENTITY FULL;
ALTER TABLE guesses          REPLICA IDENTITY FULL;

-- ── Políticas de acesso (Row Level Security) ─────────────────────
-- Permite leitura e escrita pública (autenticação fica no app).
-- As políticas restritivas por usuário entram na Fase 4.
ALTER TABLE participantes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_results  ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_pts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins            ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso_total" ON participantes    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON official_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON match_pts        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON guesses          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON group_predictions FOR ALL USING (true) WITH CHECK (true);

-- grupos: leitura pública; escrita só na Fase 4.
-- admins: NENHUMA policy de propósito — a chave anônima não lê nem
-- escreve; só a Edge Function (service role, Fase 3) acessa a tabela.
CREATE POLICY "leitura_publica" ON grupos FOR SELECT USING (true);
