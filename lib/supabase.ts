import { createClient } from "@supabase/supabase-js";

// Fallback para ambientes sem as env vars (ex.: preview do Vercel sem
// config, build local): o createClient lança no escopo do módulo e
// derruba o prerender. Com o placeholder o build passa e as chamadas
// apenas falham em runtime (já logadas nas funções de sync).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("[SB] NEXT_PUBLIC_SUPABASE_URL ausente — sincronização desativada");
}

export const supabase = createClient(url, key);

// ── Tipos das tabelas ─────────────────────────────────────────────

export interface DbParticipante {
  id: string;
  grupo_id: string;
  nome: string;
  apelido: string;
  email: string | null;
  telefone: string | null;
  token: string;
  ativo: boolean;
  user_id: string | null;   // vínculo com o Supabase Auth (Fase 3)
  created_at: string;
}

export interface DbOfficialResult {
  match_id: string;
  sa: number;
  sb: number;
  updated_at: string;
}

export interface DbMatchPts {
  apelido: string;
  grupo_id: string | null;
  pts: number;
  updated_at: string;
}

export interface DbGuess {
  id: string;
  apelido: string;
  participante_id: string | null;
  grupo_id: string | null;
  match_id: string;
  gols_a: number;
  gols_b: number;
  updated_at: string;
}

export interface DbGroupPrediction {
  apelido: string;
  participante_id: string | null;
  grupo_id: string | null;
  grupo_copa: string;
  first_team: string;
  second_team: string;
  saved: boolean;
}
