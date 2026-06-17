/**
 * Sync automático de resultados da Copa (Vercel Cron → este Route Handler).
 *
 * Fluxo: busca os jogos FINISHED na football-data.org (competição "WC"),
 * casa com os jogos do app, grava os placares novos/alterados em
 * `official_results` e recalcula `match_pts` com a MESMA regra do admin
 * (`computeMatchPts` + `PENALTY_START_MS`). Propaga via Realtime/poll.
 *
 * Env necessárias (Vercel): FOOTBALL_DATA_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY) e, opcional mas
 * recomendado, CRON_SECRET (a Vercel envia `Authorization: Bearer <CRON_SECRET>`).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MATCHES } from "@/lib/mock-data";
import { computeMatchPts, PENALTY_START_MS } from "@/lib/scoring";
import { mapApiResultsToMatches, type FdMatch } from "@/lib/results-api";
import type { Match } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FD_URL =
  "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED";

export async function GET(request: Request) {
  // Proteção: se CRON_SECRET existir, exige o Bearer que a Vercel envia
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!apiKey || !supaUrl || !supaKey) {
    return Response.json(
      { error: "missing env: FOOTBALL_DATA_API_KEY / NEXT_PUBLIC_SUPABASE_URL / SUPABASE key" },
      { status: 500 },
    );
  }

  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } });

  // 1. Jogos FINISHED da Copa
  const res = await fetch(FD_URL, { headers: { "X-Auth-Token": apiKey } });
  if (!res.ok) {
    return Response.json(
      { error: `football-data ${res.status}`, detail: await res.text() },
      { status: 502 },
    );
  }
  const apiMatches: FdMatch[] = (await res.json())?.matches ?? [];

  // 2. Jogos do app (banco; cai pro seed se a tabela estiver vazia)
  const appMatches = await loadAppMatches(supabase);

  // 3. Casa os resultados (placar já reorientado pro lado A/B)
  const { results, unmatched } = mapApiResultsToMatches(apiMatches, appMatches);

  // 4. Diff contra os resultados oficiais atuais
  const { data: curRows } = await supabase
    .from("official_results")
    .select("match_id,sa,sb");
  const current = new Map<string, { sa: number; sb: number }>(
    (curRows ?? []).map((r) => [r.match_id, { sa: r.sa, sb: r.sb }]),
  );
  const changed = results.filter((r) => {
    const c = current.get(r.matchId);
    return !c || c.sa !== r.sa || c.sb !== r.sb;
  });

  if (changed.length === 0) {
    return Response.json({ ok: true, finished: results.length, applied: 0, unmatched });
  }

  const now = new Date().toISOString();

  // 5. Grava os resultados novos/alterados
  const { error: resErr } = await supabase.from("official_results").upsert(
    changed.map((r) => ({ match_id: r.matchId, sa: r.sa, sb: r.sb, updated_at: now })),
  );
  if (resErr) {
    return Response.json({ error: `upsert official_results: ${resErr.message}` }, { status: 500 });
  }

  // 6. Recalcula match_pts com a mesma regra do admin
  const merged: Record<string, { sa: number; sb: number }> = {};
  for (const [id, sc] of current) merged[id] = sc;
  for (const r of changed) merged[r.matchId] = { sa: r.sa, sb: r.sb };

  const { data: parts } = await supabase.from("participantes").select("apelido,ativo");
  const ativos = (parts ?? [])
    .filter((p) => p.ativo)
    .map((p) => ({ apelido: p.apelido as string }));

  const { data: gRows } = await supabase
    .from("guesses")
    .select("apelido,match_id,gols_a,gols_b");
  const allGuesses: Record<string, Record<string, { a: number; b: number }>> = {};
  for (const g of gRows ?? []) {
    (allGuesses[g.match_id] ??= {})[g.apelido] = { a: g.gols_a, b: g.gols_b };
  }

  const pts = computeMatchPts(ativos, merged, allGuesses, appMatches, PENALTY_START_MS);
  const { error: ptsErr } = await supabase.from("match_pts").upsert(
    Object.entries(pts).map(([apelido, p]) => ({ apelido, pts: p, updated_at: now })),
  );
  if (ptsErr) {
    return Response.json({ error: `upsert match_pts: ${ptsErr.message}` }, { status: 500 });
  }

  return Response.json({
    ok: true,
    finished: results.length,
    applied: changed.length,
    unmatched,
  });
}

/** Carrega os jogos do app do banco; cai pro seed local se a tabela vazia. */
async function loadAppMatches(supabase: SupabaseClient): Promise<Match[]> {
  const { data } = await supabase
    .from("matches")
    .select("*")
    .order("ord", { ascending: true });
  if (data && data.length > 0) {
    return data.map((r) => ({
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
  return MATCHES;
}
