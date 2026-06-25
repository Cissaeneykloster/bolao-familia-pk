/**
 * Sync automático de resultados da Copa: ESPN (scoreboard JSON, sem chave) → DB.
 *
 * Busca os jogos encerrados na ESPN, casa com os jogos do app (de-para por
 * código FIFA em `lib/results-api.ts`) e grava em `official_results` APENAS os
 * que ainda não têm placar — nunca sobrescreve. Assim, qualquer ajuste manual
 * do admin no painel PREVALECE (o sync não reverte). Em seguida recalcula
 * `match_pts` com a mesma regra do admin (`computeMatchPts` + `PENALTY_START_MS`).
 *
 * Chamado pelo Vercel Cron (vercel.json) e também pelo botão "Sincronizar agora"
 * do painel do admin. É idempotente e só preenche o que falta — seguro repetir.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (ou anon).
 * Opcional: ESPN_SCOREBOARD_URL (sobrescreve a URL da fonte).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MATCHES } from "@/lib/mock-data";
import { computeMatchPts, PENALTY_START_MS } from "@/lib/scoring";
import { parseEspn, mapResults, type EspnScoreboard } from "@/lib/results-api";
import type { Match } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ESPN_URL =
  process.env.ESPN_SCOREBOARD_URL ??
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

export async function GET(request: Request) {
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supaUrl || !supaKey) {
    return Response.json({ error: "missing Supabase env" }, { status: 500 });
  }
  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } });

  // 1. Placares encerrados na ESPN (aceita ?dates=YYYYMMDD[-YYYYMMDD])
  const dates = new URL(request.url).searchParams.get("dates");
  const url = dates ? `${ESPN_URL}?dates=${encodeURIComponent(dates)}` : ESPN_URL;
  let json: EspnScoreboard;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "bolao-familia-pk" },
      cache: "no-store",
    });
    if (!res.ok) return Response.json({ error: `espn ${res.status}` }, { status: 502 });
    json = (await res.json()) as EspnScoreboard;
  } catch (e) {
    return Response.json({ error: `fetch falhou: ${(e as Error).message}` }, { status: 502 });
  }

  // 2. Casa com os jogos do app
  const appMatches = await loadAppMatches(supabase);
  const { results, unmatched } = mapResults(parseEspn(json), appMatches);

  // 3. Resultados oficiais atuais — só preenchemos o que FALTA (não sobrescreve
  //    o que já existe, preservando ajustes manuais do admin)
  const { data: curRows } = await supabase.from("official_results").select("match_id,sa,sb");
  const current = new Map<string, { sa: number; sb: number }>(
    (curRows ?? []).map((r) => [r.match_id, { sa: r.sa, sb: r.sb }]),
  );
  const novos = results.filter((r) => !current.has(r.matchId));

  const now = new Date().toISOString();

  // Grava só os placares que faltam (preserva ajustes manuais do admin)
  if (novos.length > 0) {
    const { error: resErr } = await supabase.from("official_results").upsert(
      novos.map((r) => ({ match_id: r.matchId, sa: r.sa, sb: r.sb, updated_at: now })),
    );
    if (resErr) {
      return Response.json({ error: `upsert official_results: ${resErr.message}` }, { status: 500 });
    }
  }

  // 4. Recalcula match_pts SEMPRE (mesma regra do admin) — auto-corrige valores
  //    defasados no ranking mesmo quando não há resultado novo a aplicar
  const merged: Record<string, { sa: number; sb: number }> = {};
  for (const [id, sc] of current) merged[id] = sc;
  for (const r of novos) merged[r.matchId] = { sa: r.sa, sb: r.sb };

  const { data: parts } = await supabase.from("participantes").select("apelido,ativo,created_at");
  const ativos = (parts ?? [])
    .filter((p) => p.ativo)
    .map((p) => ({
      apelido: p.apelido as string,
      createdAt: p.created_at ? new Date(p.created_at as string).getTime() : undefined,
    }));

  // PostgREST corta em 1000 linhas/requisição — pagina até esgotar, senão o
  // ranking é recalculado com palpites parciais (ficaria subcontado)
  const allGuesses: Record<string, Record<string, { a: number; b: number }>> = {};
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data: gRows } = await supabase
      .from("guesses")
      .select("apelido,match_id,gols_a,gols_b")
      .range(from, from + PAGE - 1);
    for (const g of gRows ?? []) {
      (allGuesses[g.match_id] ??= {})[g.apelido] = { a: g.gols_a, b: g.gols_b };
    }
    if (!gRows || gRows.length < PAGE) break;
  }

  const pts = computeMatchPts(ativos, merged, allGuesses, appMatches, PENALTY_START_MS);
  const { error: ptsErr } = await supabase.from("match_pts").upsert(
    Object.entries(pts).map(([apelido, p]) => ({ apelido, pts: p, updated_at: now })),
  );
  if (ptsErr) {
    return Response.json({ error: `upsert match_pts: ${ptsErr.message}` }, { status: 500 });
  }

  return Response.json({
    ok: true, finished: results.length, applied: novos.length,
    recomputed: Object.keys(pts).length, unmatched,
  });
}

/** Carrega os jogos do app do banco; cai pro seed local se a tabela vazia. */
async function loadAppMatches(supabase: SupabaseClient): Promise<Match[]> {
  const { data } = await supabase.from("matches").select("*").order("ord", { ascending: true });
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
