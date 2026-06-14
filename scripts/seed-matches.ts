/**
 * Seed da tabela `matches` no Supabase a partir do seed local (MATCHES).
 * Uso: npx tsx scripts/seed-matches.ts
 * Upsert idempotente (merge-duplicates) — seguro rodar várias vezes.
 */
import { MATCHES } from "../lib/mock-data";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / KEY no ambiente.");
  process.exit(1);
}

const rows = MATCHES.map((m, i) => ({
  id: m.id,
  ord: i,
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
}));

async function main() {
  const res = await fetch(`${URL}/rest/v1/matches`, {
    method: "POST",
    headers: {
      apikey: KEY!,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  console.log(`HTTP ${res.status} — ${rows.length} jogos enviados`);
  if (!res.ok) {
    console.error(await res.text());
    process.exit(1);
  }
}

main();
