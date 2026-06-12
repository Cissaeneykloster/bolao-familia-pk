"use client";

/**
 * Funções de sincronização entre o store local (Zustand) e o Supabase.
 * Chamadas nas ações críticas do admin e no carregamento do app.
 */
import { supabase } from "./supabase";
import type { Participante } from "./mock-data";

// ── Identidade nas tabelas de dados (Fase 2) ─────────────────────
// `apelido` sozinho colide entre grupos. Com o participante resolvido
// (id + grupo), as linhas passam a ser chaveadas por participante_id e
// o apelido fica apenas para exibição. Sem resolução (ex.: participantes
// ainda não carregados), mantém o comportamento antigo por apelido.
export interface ParticipanteKey {
  apelido: string;
  participanteId?: string | null;
  grupoId?: string | null;
}

// Colunas de identidade do upsert — só entram quando o participante está
// resolvido (o PostgREST exige as mesmas colunas em todas as linhas)
function identityColumns(key: ParticipanteKey) {
  return key.participanteId
    ? { participante_id: key.participanteId, grupo_id: key.grupoId ?? null }
    : {};
}

function guessConflict(key: ParticipanteKey) {
  return key.participanteId ? "participante_id,match_id" : "apelido,match_id";
}

// ── Timestamp em horário de Brasília ─────────────────────────────
// Brasília não tem horário de verão desde 2019 → offset fixo -03:00.
// O Postgres guarda o mesmo instante; o offset explícito documenta o fuso.
export function nowBrasilia(now = new Date()): string {
  const brasilia = new Date(now.getTime() - 3 * 3_600_000);
  return brasilia.toISOString().replace("Z", "-03:00");
}

// ── Participantes ─────────────────────────────────────────────────

/** Carrega todos os participantes do Supabase → store */
export async function loadParticipantes(): Promise<Participante[]> {
  const { data, error } = await supabase
    .from("participantes")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) { console.error("[SB] loadParticipantes:", error.message); return []; }

  return (data ?? []).map((r) => ({
    id: r.id,
    grupoId: r.grupo_id,
    nome: r.nome,
    apelido: r.apelido,
    email: r.email ?? "",
    telefone: r.telefone ?? "",
    token: r.token,
    ativo: r.ativo,
    userId: r.user_id ?? null,
  }));
}

/** Grava um participante novo no Supabase */
export async function upsertParticipante(p: Participante) {
  const { error } = await supabase.from("participantes").upsert({
    id: p.id,
    grupo_id: p.grupoId,
    nome: p.nome,
    apelido: p.apelido,
    email: p.email || null,
    telefone: p.telefone || null,
    token: p.token,
    ativo: p.ativo,
  });
  if (error) console.error("[SB] upsertParticipante:", error.message);
}

/** Remove participante do Supabase */
export async function deleteParticipante(id: string) {
  const { error } = await supabase.from("participantes").delete().eq("id", id);
  if (error) console.error("[SB] deleteParticipante:", error.message);
}

/** Atualiza campos de um participante */
export async function updateParticipanteDb(id: string, data: Partial<Participante>) {
  const { error } = await supabase.from("participantes").update({
    nome: data.nome,
    email: data.email || null,
    telefone: data.telefone || null,
    ativo: data.ativo,
  }).eq("id", id);
  if (error) console.error("[SB] updateParticipante:", error.message);
}

// ── Resultados oficiais ───────────────────────────────────────────

/** Carrega todos os resultados oficiais */
export async function loadOfficialResults(): Promise<Record<string, { sa: number; sb: number }>> {
  const { data, error } = await supabase.from("official_results").select("*");
  if (error) { console.error("[SB] loadOfficialResults:", error.message); return {}; }

  return Object.fromEntries((data ?? []).map((r) => [r.match_id, { sa: r.sa, sb: r.sb }]));
}

/** Salva resultado oficial (upsert) */
export async function upsertOfficialResult(matchId: string, sa: number, sb: number) {
  const { error } = await supabase.from("official_results").upsert({
    match_id: matchId, sa, sb, updated_at: nowBrasilia(),
  });
  if (error) console.error("[SB] upsertOfficialResult:", error.message);
}

/** Sincroniza TODOS os resultados locais para o Supabase de uma vez */
export async function syncAllOfficialResults(results: Record<string, { sa: number; sb: number }>) {
  const rows = Object.entries(results).map(([match_id, { sa, sb }]) => ({
    match_id, sa, sb, updated_at: nowBrasilia(),
  }));
  if (rows.length === 0) return 0;
  const { error } = await supabase.from("official_results").upsert(rows);
  if (error) { console.error("[SB] syncAllOfficialResults:", error.message); return 0; }
  return rows.length;
}

// ── Pontos das partidas ───────────────────────────────────────────

/** Carrega pontos de todos os participantes */
export async function loadMatchPts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("match_pts").select("*");
  if (error) { console.error("[SB] loadMatchPts:", error.message); return {}; }

  return Object.fromEntries((data ?? []).map((r) => [r.apelido, r.pts]));
}

/** Atualiza pontos de um participante (upsert) */
export async function upsertMatchPts(apelido: string, pts: number) {
  const { error } = await supabase.from("match_pts").upsert({
    apelido, pts, updated_at: nowBrasilia(),
  });
  if (error) console.error("[SB] upsertMatchPts:", error.message);
}

/** Zera pontos de todos no Supabase */
export async function resetMatchPtsDb() {
  // Busca todos os apelidos e zera
  const { data } = await supabase.from("match_pts").select("apelido");
  if (!data || data.length === 0) return;
  const rows = data.map((r) => ({ apelido: r.apelido, pts: 0, updated_at: nowBrasilia() }));
  const { error } = await supabase.from("match_pts").upsert(rows);
  if (error) console.error("[SB] resetMatchPtsDb:", error.message);
}

// grupo_id por apelido — só para apelidos inequívocos entre grupos
// (o mesmo critério do backfill da migração da Fase 2)
function grupoPorApelido(participantes: Participante[]): Map<string, string | null> {
  const m = new Map<string, string | null>();
  for (const p of participantes) m.set(p.apelido, m.has(p.apelido) ? null : p.grupoId);
  return m;
}

/** Grava pontos de vários participantes de uma vez */
export async function upsertMatchPtsBatch(
  ptsMap: Record<string, number>,
  participantes: Participante[] = [],
) {
  const grupoDe = grupoPorApelido(participantes);
  const entries = Object.entries(ptsMap);
  // O upsert exige as mesmas colunas em todas as linhas → dois lotes,
  // para não sobrescrever com NULL um grupo_id já preenchido no banco
  const comGrupo = entries
    .filter(([apelido]) => grupoDe.get(apelido))
    .map(([apelido, pts]) => ({
      apelido, grupo_id: grupoDe.get(apelido), pts, updated_at: nowBrasilia(),
    }));
  const semGrupo = entries
    .filter(([apelido]) => !grupoDe.get(apelido))
    .map(([apelido, pts]) => ({ apelido, pts, updated_at: nowBrasilia() }));

  for (const rows of [comGrupo, semGrupo]) {
    if (rows.length === 0) continue;
    const { error } = await supabase.from("match_pts").upsert(rows);
    if (error) console.error("[SB] upsertMatchPtsBatch:", error.message);
  }
}

// ── Palpites ──────────────────────────────────────────────────────

/** Carrega palpites do participante atual */
export async function loadGuesses(key: ParticipanteKey): Promise<Record<string, { a: number; b: number }>> {
  const query = supabase.from("guesses").select("*");
  const { data, error } = await (key.participanteId
    ? query.eq("participante_id", key.participanteId)
    : query.eq("apelido", key.apelido));
  if (error) { console.error("[SB] loadGuesses:", error.message); return {}; }

  return Object.fromEntries((data ?? []).map((r) => [r.match_id, { a: r.gols_a, b: r.gols_b }]));
}

/** Todos os palpites (para cálculo de pontos pelo admin) */
export async function loadAllGuesses(): Promise<Record<string, Record<string, { a: number; b: number }>>> {
  const { data, error } = await supabase.from("guesses").select("*");
  if (error) { console.error("[SB] loadAllGuesses:", error.message); return {}; }

  // Resultado: { matchId: { apelido: { a, b } } }
  const result: Record<string, Record<string, { a: number; b: number }>> = {};
  for (const r of data ?? []) {
    if (!result[r.match_id]) result[r.match_id] = {};
    result[r.match_id][r.apelido] = { a: r.gols_a, b: r.gols_b };
  }
  return result;
}

/**
 * Recupera para o Supabase os palpites que existem apenas neste aparelho
 * (feitos antes da persistência entrar no ar). Sobe somente os jogos que o
 * servidor ainda não tem — inclusive encerrados — e retorna quantos subiram.
 */
export async function backfillGuesses(
  key: ParticipanteKey,
  localGuesses: Record<string, { a: number; b: number }>,
  serverGuesses: Record<string, { a: number; b: number }>,
): Promise<number> {
  const rows = Object.entries(localGuesses)
    .filter(([matchId]) => !(matchId in serverGuesses))
    .map(([match_id, g]) => ({
      apelido: key.apelido, ...identityColumns(key),
      match_id, gols_a: g.a, gols_b: g.b, updated_at: nowBrasilia(),
    }));
  if (rows.length === 0) return 0;

  const { error } = await supabase
    .from("guesses")
    .upsert(rows, { onConflict: guessConflict(key) });
  if (error) { console.error("[SB] backfillGuesses:", error.message); return 0; }
  return rows.length;
}

/** Salva ou atualiza um palpite */
export async function upsertGuess(key: ParticipanteKey, matchId: string, a: number, b: number) {
  // onConflict é obrigatório: a PK é um UUID gerado, então sem ele o
  // re-save do mesmo jogo violaria a chave única do palpite
  const { error } = await supabase.from("guesses").upsert({
    apelido: key.apelido, ...identityColumns(key),
    match_id: matchId, gols_a: a, gols_b: b,
    updated_at: nowBrasilia(),
  }, { onConflict: guessConflict(key) });
  if (error) console.error("[SB] upsertGuess:", error.message);
  return !error;
}

// ── Previsão dos grupos ───────────────────────────────────────────

export interface GroupPredictionsData {
  predictions: Record<string, { first: string; second: string }>;
  saved: boolean;
}

/** Carrega as previsões de grupos do participante */
export async function loadGroupPredictions(key: ParticipanteKey): Promise<GroupPredictionsData> {
  const query = supabase.from("group_predictions").select("*");
  const { data, error } = await (key.participanteId
    ? query.eq("participante_id", key.participanteId)
    : query.eq("apelido", key.apelido));
  if (error) {
    console.error("[SB] loadGroupPredictions:", error.message);
    return { predictions: {}, saved: false };
  }

  return {
    predictions: Object.fromEntries(
      (data ?? []).map((r) => [r.grupo_copa, { first: r.first_team, second: r.second_team }])
    ),
    saved: (data ?? []).some((r) => r.saved),
  };
}

/** Grava todas as previsões do participante de uma vez (upsert em lote) */
export async function upsertGroupPredictions(
  key: ParticipanteKey,
  predictions: Record<string, { first: string; second: string }>,
  saved: boolean,
) {
  const rows = Object.entries(predictions).map(([grupo_copa, p]) => ({
    apelido: key.apelido, ...identityColumns(key),
    grupo_copa, first_team: p.first, second_team: p.second, saved,
  }));
  if (rows.length === 0) return;
  // Sem participante resolvido o conflito cai na PK (apelido, grupo_copa)
  const { error } = key.participanteId
    ? await supabase.from("group_predictions").upsert(rows, { onConflict: "participante_id,grupo_copa" })
    : await supabase.from("group_predictions").upsert(rows);
  if (error) console.error("[SB] upsertGroupPredictions:", error.message);
}
