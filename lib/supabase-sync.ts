"use client";

/**
 * Funções de sincronização entre o store local (Zustand) e o Supabase.
 * Chamadas nas ações críticas do admin e no carregamento do app.
 */
import { supabase } from "./supabase";
import type { Participante } from "./mock-data";
import type { Match } from "./types";

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

/** Grava pontos de vários participantes de uma vez */
export async function upsertMatchPtsBatch(ptsMap: Record<string, number>) {
  const rows = Object.entries(ptsMap).map(([apelido, pts]) => ({
    apelido, pts, updated_at: nowBrasilia(),
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("match_pts").upsert(rows);
  if (error) console.error("[SB] upsertMatchPtsBatch:", error.message);
}

// ── Ajuste manual de pontos do admin (adminDelta) ─────────────────

/** Carrega os ajustes manuais de pontos → { apelido: delta } */
export async function loadAdminDeltas(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("admin_deltas").select("*");
  if (error) { console.error("[SB] loadAdminDeltas:", error.message); return {}; }
  return Object.fromEntries(
    (data ?? []).filter((r) => r.delta !== 0).map((r) => [r.apelido, r.delta])
  );
}

/** Grava/atualiza o ajuste manual de um participante (propaga via Realtime) */
export async function upsertAdminDelta(apelido: string, delta: number, grupoId = "") {
  const { error } = await supabase.from("admin_deltas").upsert({
    apelido, grupo_id: grupoId, delta, updated_at: nowBrasilia(),
  });
  if (error) console.error("[SB] upsertAdminDelta:", error.message);
}

// ── Desafio diário (sorteio do sistema + pontos) ──────────────────

export interface DailyDraw {
  area: string;
  itemIdx: number;
  descricao: string;
  pts: number;
  dateBrt: string;
}

/** Carrega o sorteio do dia de um grupo (ou null se ainda não houve) */
export async function loadDailyDraw(grupoId: string, dateBrt: string): Promise<DailyDraw | null> {
  const { data, error } = await supabase
    .from("daily_draws").select("*")
    .eq("grupo_id", grupoId).eq("date_brt", dateBrt).maybeSingle();
  if (error) { console.error("[SB] loadDailyDraw:", error.message); return null; }
  if (!data) return null;
  return { area: data.area, itemIdx: data.item_idx, descricao: data.descricao, pts: data.pts, dateBrt: data.date_brt };
}

/** Insere o sorteio do dia — idempotente: o 1º a gravar vence (não sobrescreve) */
export async function insertDailyDraw(d: {
  grupoId: string; dateBrt: string; area: string; itemIdx: number; descricao: string; pts: number;
}) {
  const { error } = await supabase.from("daily_draws").upsert({
    grupo_id: d.grupoId, date_brt: d.dateBrt, area: d.area,
    item_idx: d.itemIdx, descricao: d.descricao, pts: d.pts,
  }, { onConflict: "grupo_id,date_brt", ignoreDuplicates: true });
  if (error) console.error("[SB] insertDailyDraw:", error.message);
}

/** Soma dos pontos de desafios por participante → { apelido: total } */
export async function loadChallengePts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("challenge_done").select("apelido,pts");
  if (error) { console.error("[SB] loadChallengePts:", error.message); return {}; }
  const totals: Record<string, number> = {};
  for (const r of data ?? []) totals[r.apelido] = (totals[r.apelido] ?? 0) + r.pts;
  return totals;
}

/** Estado (done) do participante atual para a data informada (null = não marcou) */
export async function loadMyChallengeDone(apelido: string, dateBrt: string): Promise<boolean | null> {
  const { data, error } = await supabase.from("challenge_done").select("done")
    .eq("apelido", apelido).eq("date_brt", dateBrt).maybeSingle();
  if (error) { console.error("[SB] loadMyChallengeDone:", error.message); return null; }
  return data ? data.done : null;
}

/** Marca o desafio do dia do participante (done → +pts, não feito → −pts) */
export async function upsertChallengeDone(
  apelido: string, grupoId: string, dateBrt: string, done: boolean, pts: number,
) {
  const { error } = await supabase.from("challenge_done").upsert({
    apelido, grupo_id: grupoId, date_brt: dateBrt, done, pts, updated_at: nowBrasilia(),
  }, { onConflict: "apelido,date_brt" });
  if (error) console.error("[SB] upsertChallengeDone:", error.message);
}

/** Item do histórico de desafios do participante. */
export interface ChallengeHistoryItem {
  dateBrt: string;
  done: boolean;
  pts: number;
  area: string;      // categoria (para o código X.Y) — "" se o sorteio do dia não estiver no banco
  itemIdx: number;
  descricao: string;
}

/**
 * Histórico de desafios do participante (mais recente primeiro). Junta
 * `challenge_done` (o que ele marcou) com `daily_draws` (qual era o desafio
 * daquele dia, p/ código e descrição).
 */
export async function loadMyChallengeHistory(
  apelido: string, grupoId: string,
): Promise<ChallengeHistoryItem[]> {
  const { data: marcas, error } = await supabase
    .from("challenge_done").select("date_brt,done,pts")
    .eq("apelido", apelido).order("date_brt", { ascending: false });
  if (error) { console.error("[SB] loadMyChallengeHistory:", error.message); return []; }
  if (!marcas || marcas.length === 0) return [];

  const dates = marcas.map((r) => r.date_brt);
  const draws: Record<string, { area: string; itemIdx: number; descricao: string }> = {};
  if (grupoId) {
    const { data: dd } = await supabase
      .from("daily_draws").select("date_brt,area,item_idx,descricao")
      .eq("grupo_id", grupoId).in("date_brt", dates);
    for (const r of dd ?? []) draws[r.date_brt] = { area: r.area, itemIdx: r.item_idx, descricao: r.descricao };
  }

  return marcas.map((r) => {
    const d = draws[r.date_brt];
    return {
      dateBrt: r.date_brt, done: r.done, pts: r.pts,
      area: d?.area ?? "", itemIdx: d?.itemIdx ?? 0, descricao: d?.descricao ?? "",
    };
  });
}

// ── Palpites ──────────────────────────────────────────────────────

/** Carrega palpites do participante atual */
export async function loadGuesses(apelido: string): Promise<Record<string, { a: number; b: number }>> {
  const { data, error } = await supabase
    .from("guesses")
    .select("*")
    .eq("apelido", apelido);
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
  apelido: string,
  localGuesses: Record<string, { a: number; b: number }>,
  serverGuesses: Record<string, { a: number; b: number }>,
): Promise<number> {
  const rows = Object.entries(localGuesses)
    .filter(([matchId]) => !(matchId in serverGuesses))
    .map(([match_id, g]) => ({
      apelido, match_id, gols_a: g.a, gols_b: g.b, updated_at: nowBrasilia(),
    }));
  if (rows.length === 0) return 0;

  const { error } = await supabase
    .from("guesses")
    .upsert(rows, { onConflict: "apelido,match_id" });
  if (error) { console.error("[SB] backfillGuesses:", error.message); return 0; }
  return rows.length;
}

/** Salva ou atualiza um palpite */
export async function upsertGuess(apelido: string, matchId: string, a: number, b: number) {
  // onConflict é obrigatório: a PK é um UUID gerado, então sem ele o
  // re-save do mesmo jogo violaria o UNIQUE(apelido, match_id)
  const { error } = await supabase.from("guesses").upsert({
    apelido, match_id: matchId, gols_a: a, gols_b: b,
    updated_at: nowBrasilia(),
  }, { onConflict: "apelido,match_id" });
  if (error) console.error("[SB] upsertGuess:", error.message);
  return !error;
}

// ── Jogos (matches) ───────────────────────────────────────────────

/** Carrega todos os jogos do Supabase, ordenados, convertendo para o tipo Match */
export async function loadMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("ord", { ascending: true });
  if (error) { console.error("[SB] loadMatches:", error.message); return []; }

  return (data ?? []).map((r) => ({
    id: r.id,
    phase: r.phase,
    group: r.grupo,
    rodada: r.rodada ?? undefined,
    training: r.training,
    status: r.status,
    a: { name: r.team_a, flag: r.flag_a },
    b: { name: r.team_b, flag: r.flag_b },
    kickoff: r.kickoff ? new Date(r.kickoff).getTime() : undefined,
    label: r.label || undefined,
  })) as Match[];
}

/** Converte um Match do app para a linha do Supabase */
function matchToRow(m: Match, ord: number) {
  return {
    id: m.id,
    ord,
    phase: m.phase,
    grupo: m.group,
    rodada: m.rodada ?? null,
    training: m.training ?? false,
    status: m.status,
    team_a: m.a.name,
    flag_a: m.a.flag,
    team_b: m.b.name,
    flag_b: m.b.flag,
    kickoff: m.kickoff ? new Date(m.kickoff).toISOString() : null,
    label: m.label ?? "",
    updated_at: nowBrasilia(),
  };
}

/** Sobe TODOS os jogos para o Supabase (seed/sincronização em lote) */
export async function syncAllMatches(matches: Match[]): Promise<number> {
  const rows = matches.map((m, i) => matchToRow(m, i));
  if (rows.length === 0) return 0;
  const { error } = await supabase.from("matches").upsert(rows);
  if (error) { console.error("[SB] syncAllMatches:", error.message); return 0; }
  return rows.length;
}

/**
 * Libera jogos novos: sobe ao banco APENAS os jogos do seed que ainda não
 * existem na tabela `matches` (insert-only). Preserva as linhas existentes —
 * inclusive edições do admin (horário/label) — graças ao `ignoreDuplicates`.
 * Mantém o `ord` canônico do seed (índice em MATCHES). Retorna quantos subiram.
 */
export async function seedMissingMatches(
  localMatches: Match[],
  existingIds: Set<string>,
): Promise<number> {
  const rows = localMatches
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => !existingIds.has(m.id))
    .map(({ m, i }) => matchToRow(m, i));
  if (rows.length === 0) return 0;
  const { error } = await supabase
    .from("matches")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (error) { console.error("[SB] seedMissingMatches:", error.message); return 0; }
  return rows.length;
}

/** Atualiza/insere um jogo (admin edita data/hora/etc.) */
export async function upsertMatch(m: Match, ord = 0) {
  const { error } = await supabase.from("matches").upsert(matchToRow(m, ord));
  if (error) console.error("[SB] upsertMatch:", error.message);
}

// ── Previsão dos grupos ───────────────────────────────────────────

export interface GroupPredictionsData {
  predictions: Record<string, { first: string; second: string }>;
  saved: boolean;
}

/** Carrega as previsões de grupos do participante */
export async function loadGroupPredictions(apelido: string): Promise<GroupPredictionsData> {
  const { data, error } = await supabase
    .from("group_predictions")
    .select("*")
    .eq("apelido", apelido);
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
  apelido: string,
  predictions: Record<string, { first: string; second: string }>,
  saved: boolean,
) {
  const rows = Object.entries(predictions).map(([grupo_copa, p]) => ({
    apelido, grupo_copa, first_team: p.first, second_team: p.second, saved,
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("group_predictions").upsert(rows);
  if (error) console.error("[SB] upsertGroupPredictions:", error.message);
}
