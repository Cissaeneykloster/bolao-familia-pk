-- ── FASE 2 — Schema e fundações de identidade ────────────────────
-- Execute no painel Supabase (SQL Editor → New query) ANTES de fazer
-- o deploy do código desta fase. A migração é aditiva: o app já
-- publicado continua funcionando enquanto o deploy não acontece.
--
-- O que muda:
--   • participantes.user_id          → vínculo futuro com o Supabase Auth (Fase 3)
--   • grupos / admins                → config de grupo e admins saem do bundle (Fase 3)
--   • guesses / group_predictions    → ganham participante_id + grupo_id
--   • match_pts                      → ganha grupo_id
--     (hoje a chave é só o apelido, que colide entre grupos)
--
-- O que NÃO muda (deliberadamente — fica para a Fase 5, quando todos
-- os clientes antigos tiverem migrado):
--   • UNIQUE(apelido, match_id) em guesses, a PK de group_predictions
--     e a PK de match_pts continuam como estão — removê-las agora
--     quebraria o app já publicado.

-- 1) participantes → vínculo com o Supabase Auth (preenchido na Fase 3/5)
ALTER TABLE participantes
  ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id);

-- 2) grupos — config que hoje vive hardcoded em lib/mock-data.ts (ADMINS)
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

-- 3) admins — preenchida na Fase 3, quando os admins virarem usuários Auth
CREATE TABLE IF NOT EXISTS admins (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id),
  grupo_id   TEXT NOT NULL REFERENCES grupos(id),
  usuario    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) Novas chaves de identidade nas tabelas de dados
ALTER TABLE guesses
  ADD COLUMN IF NOT EXISTS participante_id TEXT REFERENCES participantes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS grupo_id        TEXT;

ALTER TABLE group_predictions
  ADD COLUMN IF NOT EXISTS participante_id TEXT REFERENCES participantes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS grupo_id        TEXT;

ALTER TABLE match_pts
  ADD COLUMN IF NOT EXISTS grupo_id TEXT;

-- Índices únicos pelas novas chaves (NULLs não colidem entre si, então
-- linhas antigas sem participante_id continuam válidas). São o alvo do
-- ON CONFLICT dos upserts do app a partir desta fase.
CREATE UNIQUE INDEX IF NOT EXISTS guesses_participante_match_key
  ON guesses (participante_id, match_id);
CREATE UNIQUE INDEX IF NOT EXISTS group_predictions_participante_grupo_key
  ON group_predictions (participante_id, grupo_copa);

-- 5) Backfill a partir do apelido — apenas onde o apelido é inequívoco
--    (um apelido presente em mais de um grupo não tem como ser atribuído;
--    essas linhas ficam com participante_id NULL e o app segue chaveando
--    por apelido até a limpeza da Fase 5)
WITH unicos AS (
  SELECT apelido, MIN(id) AS id, MIN(grupo_id) AS grupo_id
  FROM participantes
  GROUP BY apelido
  HAVING COUNT(*) = 1
)
UPDATE guesses g
SET participante_id = u.id, grupo_id = u.grupo_id
FROM unicos u
WHERE g.participante_id IS NULL AND g.apelido = u.apelido;

WITH unicos AS (
  SELECT apelido, MIN(id) AS id, MIN(grupo_id) AS grupo_id
  FROM participantes
  GROUP BY apelido
  HAVING COUNT(*) = 1
)
UPDATE group_predictions gp
SET participante_id = u.id, grupo_id = u.grupo_id
FROM unicos u
WHERE gp.participante_id IS NULL AND gp.apelido = u.apelido;

WITH unicos AS (
  SELECT apelido, MIN(grupo_id) AS grupo_id
  FROM participantes
  GROUP BY apelido
  HAVING COUNT(*) = 1
)
UPDATE match_pts mp
SET grupo_id = u.grupo_id
FROM unicos u
WHERE mp.grupo_id IS NULL AND mp.apelido = u.apelido;

-- 6) RLS das novas tabelas
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- grupos: leitura pública (config exibida no app); escrita só na Fase 4
DROP POLICY IF EXISTS "leitura_publica" ON grupos;
CREATE POLICY "leitura_publica" ON grupos FOR SELECT USING (true);

-- admins: NENHUMA policy de propósito — a chave anônima não lê nem
-- escreve; só a Edge Function (service role, Fase 3) acessa a tabela.
