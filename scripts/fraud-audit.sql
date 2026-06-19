-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  BOLÃO FAMÍLIA PK — Auditoria de fraude (resultados x palpites)        ║
-- ╠══════════════════════════════════════════════════════════════════════╣
-- ║  Como usar: cole cada bloco no SQL Editor do Supabase (projeto que     ║
-- ║  hospeda o bolão) e rode UM por vez. Tudo é SOMENTE LEITURA (SELECT).  ║
-- ║                                                                        ║
-- ║  Fuso: todos os instantes são exibidos em horário de Brasília          ║
-- ║  (America/Sao_Paulo, UTC-3). O Postgres guarda o instante absoluto;    ║
-- ║  `AT TIME ZONE 'America/Sao_Paulo'` só muda a EXIBIÇÃO.                ║
-- ║                                                                        ║
-- ║  ⚠ Limitação importante: as tabelas guardam só o ÚLTIMO `updated_at`   ║
-- ║  de cada linha — não há histórico. Logo, dá pra ver QUANDO foi a       ║
-- ║  última alteração, mas não as alterações intermediárias. Para capturar ║
-- ║  "resultado mudou enquanto o jogo acontecia" de forma definitiva,      ║
-- ║  instale a trigger de auditoria do bloco [A] (passa a valer dali pra   ║
-- ║  frente).                                                              ║
-- ╚══════════════════════════════════════════════════════════════════════╝


-- ────────────────────────────────────────────────────────────────────────
-- [0] Sanidade: confirme o fuso do banco e o volume de dados
-- ────────────────────────────────────────────────────────────────────────
SELECT current_setting('TIMEZONE')                                   AS tz_banco,
       (now() AT TIME ZONE 'America/Sao_Paulo')                      AS agora_brt,
       (SELECT count(*) FROM matches  WHERE training = false)        AS jogos,
       (SELECT count(*) FROM matches  WHERE kickoff IS NOT NULL)     AS jogos_com_horario,
       (SELECT count(*) FROM official_results)                       AS resultados_oficiais,
       (SELECT count(*) FROM guesses)                                AS palpites;


-- ────────────────────────────────────────────────────────────────────────
-- [1] 🔴 PALPITES alterados APÓS o início do jogo
--     (registrou/mudou o palpite com a bola rolando — ou já encerrado)
--     Esse é o indício mais direto de trapaça do participante.
-- ────────────────────────────────────────────────────────────────────────
SELECT
  g.apelido,
  g.match_id,
  m.label,
  m.team_a || ' x ' || m.team_b                                       AS jogo,
  g.gols_a || 'x' || g.gols_b                                         AS palpite,
  (m.kickoff   AT TIME ZONE 'America/Sao_Paulo')                      AS kickoff_brt,
  (g.updated_at AT TIME ZONE 'America/Sao_Paulo')                     AS palpite_em_brt,
  round(extract(epoch FROM (g.updated_at - m.kickoff)) / 60.0, 1)     AS min_apos_inicio,
  CASE
    WHEN g.updated_at > m.kickoff + interval '180 minutes' THEN 'APÓS O FIM (inequívoco)'
    ELSE 'DURANTE / LOGO APÓS O JOGO'
  END                                                                 AS classificacao
FROM guesses g
JOIN matches m ON m.id = g.match_id
WHERE m.kickoff IS NOT NULL
  AND m.training = false
  AND g.updated_at > m.kickoff
ORDER BY (g.updated_at - m.kickoff) DESC;


-- ────────────────────────────────────────────────────────────────────────
-- [2] 🔴🔴 PROVA FORTE: palpite mexido após o início E cravando EXATAMENTE
--     o placar oficial. Mudar a aposta depois do jogo começar e acertar o
--     placar na mosca é o padrão clássico de fraude.
-- ────────────────────────────────────────────────────────────────────────
SELECT
  g.apelido,
  m.label,
  m.team_a || ' x ' || m.team_b                                       AS jogo,
  g.gols_a || 'x' || g.gols_b                                         AS palpite,
  o.sa     || 'x' || o.sb                                             AS resultado_oficial,
  (m.kickoff    AT TIME ZONE 'America/Sao_Paulo')                     AS kickoff_brt,
  (g.updated_at AT TIME ZONE 'America/Sao_Paulo')                     AS palpite_em_brt,
  (o.updated_at AT TIME ZONE 'America/Sao_Paulo')                     AS resultado_em_brt,
  round(extract(epoch FROM (g.updated_at - m.kickoff)) / 60.0, 1)     AS min_apos_inicio
FROM guesses g
JOIN matches m          ON m.id = g.match_id
JOIN official_results o ON o.match_id = g.match_id
WHERE m.kickoff IS NOT NULL
  AND m.training = false
  AND g.updated_at > m.kickoff          -- palpite alterado com o jogo já começado
  AND g.gols_a = o.sa AND g.gols_b = o.sb  -- cravou o placar oficial na mosca
ORDER BY g.updated_at DESC;


-- ────────────────────────────────────────────────────────────────────────
-- [3] 🔴🔴 Palpite alterado DEPOIS que o resultado oficial foi lançado
--     (copiou o gabarito). Independe do horário do jogo: se o palpite mudou
--     depois do placar oficial existir, e bate com ele, é cópia do resultado.
-- ────────────────────────────────────────────────────────────────────────
SELECT
  g.apelido,
  m.label,
  m.team_a || ' x ' || m.team_b                                       AS jogo,
  g.gols_a || 'x' || g.gols_b                                         AS palpite,
  o.sa     || 'x' || o.sb                                             AS resultado_oficial,
  (o.updated_at AT TIME ZONE 'America/Sao_Paulo')                     AS resultado_em_brt,
  (g.updated_at AT TIME ZONE 'America/Sao_Paulo')                     AS palpite_em_brt,
  round(extract(epoch FROM (g.updated_at - o.updated_at)) / 60.0, 1)  AS min_apos_resultado,
  (g.gols_a = o.sa AND g.gols_b = o.sb)                               AS bate_com_oficial
FROM guesses g
JOIN matches m          ON m.id = g.match_id
JOIN official_results o ON o.match_id = g.match_id
WHERE m.training = false
  AND g.updated_at > o.updated_at       -- palpite escrito DEPOIS do placar oficial
ORDER BY bate_com_oficial DESC, g.updated_at DESC;


-- ────────────────────────────────────────────────────────────────────────
-- [4] 🟠 RESULTADO OFICIAL lançado ANTES do início do jogo
--     Não existe placar legítimo antes do apito inicial → resultado de teste,
--     erro grave ou manipulação. Sempre investigar.
-- ────────────────────────────────────────────────────────────────────────
SELECT
  m.label,
  m.team_a || ' x ' || m.team_b                                       AS jogo,
  o.sa || 'x' || o.sb                                                 AS resultado_oficial,
  (m.kickoff    AT TIME ZONE 'America/Sao_Paulo')                     AS kickoff_brt,
  (o.updated_at AT TIME ZONE 'America/Sao_Paulo')                     AS resultado_em_brt,
  round(extract(epoch FROM (m.kickoff - o.updated_at)) / 60.0, 1)     AS min_antes_do_inicio
FROM official_results o
JOIN matches m ON m.id = o.match_id
WHERE m.kickoff IS NOT NULL
  AND m.training = false
  AND o.updated_at < m.kickoff
ORDER BY (m.kickoff - o.updated_at) DESC;


-- ────────────────────────────────────────────────────────────────────────
-- [5] 🟠 RESULTADO OFICIAL lançado DURANTE o jogo (antes do apito final)
--     Janela: do kickoff até ~110 min depois (fase de grupos). O sync da ESPN
--     roda 1x/dia (cron) e só preenche jogos ENCERRADOS, então um placar
--     gravado dentro da janela do jogo veio de lançamento MANUAL do admin.
--     Cruze com o bloco [6] para ver palpites mexidos no mesmo intervalo.
-- ────────────────────────────────────────────────────────────────────────
SELECT
  m.label,
  m.team_a || ' x ' || m.team_b                                       AS jogo,
  o.sa || 'x' || o.sb                                                 AS resultado_oficial,
  (m.kickoff    AT TIME ZONE 'America/Sao_Paulo')                     AS kickoff_brt,
  (o.updated_at AT TIME ZONE 'America/Sao_Paulo')                     AS resultado_em_brt,
  round(extract(epoch FROM (o.updated_at - m.kickoff)) / 60.0, 1)     AS min_apos_inicio
FROM official_results o
JOIN matches m ON m.id = o.match_id
WHERE m.kickoff IS NOT NULL
  AND m.training = false
  AND o.updated_at >  m.kickoff
  AND o.updated_at <  m.kickoff + interval '110 minutes'
ORDER BY m.kickoff;


-- ────────────────────────────────────────────────────────────────────────
-- [6] 🔴 CRUZAMENTO: palpites alterados PERTO do momento em que o resultado
--     oficial daquele jogo foi gravado (±15 min). Pega o caso de alguém
--     lançar/mexer o placar e, na mesma janela, "ajustar" o próprio palpite.
-- ────────────────────────────────────────────────────────────────────────
SELECT
  g.apelido,
  m.label,
  m.team_a || ' x ' || m.team_b                                       AS jogo,
  g.gols_a || 'x' || g.gols_b                                         AS palpite,
  o.sa     || 'x' || o.sb                                             AS resultado_oficial,
  (o.updated_at AT TIME ZONE 'America/Sao_Paulo')                     AS resultado_em_brt,
  (g.updated_at AT TIME ZONE 'America/Sao_Paulo')                     AS palpite_em_brt,
  round(extract(epoch FROM (g.updated_at - o.updated_at)) / 60.0, 1)  AS min_palpite_vs_resultado,
  (g.gols_a = o.sa AND g.gols_b = o.sb)                               AS bate_com_oficial
FROM guesses g
JOIN official_results o ON o.match_id = g.match_id
JOIN matches m          ON m.id = g.match_id
WHERE m.training = false
  AND abs(extract(epoch FROM (g.updated_at - o.updated_at))) <= 15 * 60
ORDER BY bate_com_oficial DESC, abs(extract(epoch FROM (g.updated_at - o.updated_at)));


-- ────────────────────────────────────────────────────────────────────────
-- [7] 🟡 RESULTADO OFICIAL corrigido tarde (mais de 24 h após o kickoff)
--     Correção legítima é possível, mas toda alteração tardia de placar deve
--     ser revisada — especialmente se mudou a pontuação de alguém no ranking.
-- ────────────────────────────────────────────────────────────────────────
SELECT
  m.label,
  m.team_a || ' x ' || m.team_b                                       AS jogo,
  o.sa || 'x' || o.sb                                                 AS resultado_oficial,
  (m.kickoff    AT TIME ZONE 'America/Sao_Paulo')                     AS kickoff_brt,
  (o.updated_at AT TIME ZONE 'America/Sao_Paulo')                     AS resultado_em_brt,
  round(extract(epoch FROM (o.updated_at - m.kickoff)) / 3600.0, 1)   AS horas_apos_kickoff
FROM official_results o
JOIN matches m ON m.id = o.match_id
WHERE m.kickoff IS NOT NULL
  AND m.training = false
  AND o.updated_at > m.kickoff + interval '24 hours'
ORDER BY (o.updated_at - m.kickoff) DESC;


-- ────────────────────────────────────────────────────────────────────────
-- [8] 📊 PLACAR DE SUSPEITOS: ranking de participantes por nº de palpites
--     alterados após o início do jogo (e quantos cravaram o oficial).
-- ────────────────────────────────────────────────────────────────────────
SELECT
  g.apelido,
  count(*)                                                            AS palpites_apos_inicio,
  count(*) FILTER (
    WHERE o.match_id IS NOT NULL AND g.gols_a = o.sa AND g.gols_b = o.sb
  )                                                                   AS cravou_o_oficial,
  max(g.updated_at AT TIME ZONE 'America/Sao_Paulo')                  AS ultima_ocorrencia_brt
FROM guesses g
JOIN matches m            ON m.id = g.match_id
LEFT JOIN official_results o ON o.match_id = g.match_id
WHERE m.kickoff IS NOT NULL
  AND m.training = false
  AND g.updated_at > m.kickoff
GROUP BY g.apelido
ORDER BY cravou_o_oficial DESC, palpites_apos_inicio DESC;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  [A] TRILHA DE AUDITORIA (instale para detectar mudanças FUTURAS)      ║
-- ║                                                                        ║
-- ║  Sem isto, só sobrevive o último `updated_at` de cada linha. Com a     ║
-- ║  trigger abaixo, TODA escrita em official_results e guesses passa a    ║
-- ║  ser registrada com o horário do servidor — aí "resultado mudou        ║
-- ║  durante o jogo" e "palpite alterado N vezes" ficam 100% rastreáveis.  ║
-- ║  Rode UMA vez (é DDL — cria tabela/funções/triggers).                  ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- CREATE TABLE IF NOT EXISTS audit_log (
--   id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   tabela     TEXT        NOT NULL,
--   operacao   TEXT        NOT NULL,           -- INSERT | UPDATE | DELETE
--   chave      TEXT,                           -- match_id / apelido
--   valor_old  JSONB,
--   valor_new  JSONB,
--   feito_em   TIMESTAMPTZ NOT NULL DEFAULT now()  -- horário do SERVIDOR (confiável)
-- );
--
-- CREATE OR REPLACE FUNCTION fn_audit() RETURNS trigger AS $$
-- BEGIN
--   INSERT INTO audit_log(tabela, operacao, chave, valor_old, valor_new)
--   VALUES (
--     TG_TABLE_NAME,
--     TG_OP,
--     COALESCE(NEW.match_id, OLD.match_id, NEW.apelido, OLD.apelido),
--     CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,
--     CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END
--   );
--   RETURN COALESCE(NEW, OLD);
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER trg_audit_official_results
--   AFTER INSERT OR UPDATE OR DELETE ON official_results
--   FOR EACH ROW EXECUTE FUNCTION fn_audit();
--
-- CREATE TRIGGER trg_audit_guesses
--   AFTER INSERT OR UPDATE OR DELETE ON guesses
--   FOR EACH ROW EXECUTE FUNCTION fn_audit();
--
-- -- Depois de instalada, esta consulta mostra o histórico completo de um jogo:
-- -- SELECT operacao, chave, valor_old, valor_new,
-- --        (feito_em AT TIME ZONE 'America/Sao_Paulo') AS feito_em_brt
-- -- FROM audit_log WHERE chave = '<match_id>' ORDER BY feito_em;
