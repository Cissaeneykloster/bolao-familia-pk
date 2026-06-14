/**
 * Recalcula TODOS os pontos de partidas (match_pts) no Supabase aplicando a
 * regra de ausência sequencial (carência de 2 jogos). Uso:
 *   npx tsx scripts/recalc-points.ts
 */
import { MATCHES } from "../lib/mock-data";
import { computeMatchPts } from "../lib/scoring";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / KEY no ambiente.");
  process.exit(1);
}

async function get(path: string) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    headers: { apikey: KEY!, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  const participantes = (await get("participantes?select=apelido,ativo")) as { apelido: string; ativo: boolean }[];
  const official = (await get("official_results?select=match_id,sa,sb")) as { match_id: string; sa: number; sb: number }[];
  const guessesRows = (await get("guesses?select=apelido,match_id,gols_a,gols_b")) as { apelido: string; match_id: string; gols_a: number; gols_b: number }[];

  const ativos = participantes.filter((p) => p.ativo).map((p) => ({ apelido: p.apelido }));

  const officialResults: Record<string, { sa: number; sb: number }> = {};
  for (const r of official) officialResults[r.match_id] = { sa: r.sa, sb: r.sb };

  const allGuesses: Record<string, Record<string, { a: number; b: number }>> = {};
  for (const g of guessesRows) {
    (allGuesses[g.match_id] ??= {})[g.apelido] = { a: g.gols_a, b: g.gols_b };
  }

  const pts = computeMatchPts(ativos, officialResults, allGuesses, MATCHES);

  console.log(`Ativos: ${ativos.length} · resultados oficiais: ${Object.keys(officialResults).length}`);
  console.log("Pontos recalculados:", pts);

  const rows = Object.entries(pts).map(([apelido, p]) => ({
    apelido, pts: p, updated_at: new Date().toISOString(),
  }));
  if (rows.length === 0) { console.log("Nada a atualizar."); return; }

  const res = await fetch(`${URL}/rest/v1/match_pts`, {
    method: "POST",
    headers: {
      apikey: KEY!, Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  console.log(`match_pts upsert: HTTP ${res.status} (${rows.length} linha(s))`);
  if (!res.ok) { console.error(await res.text()); process.exit(1); }
}

main();
