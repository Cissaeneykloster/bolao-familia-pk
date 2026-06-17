import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
  pts: number;
  updated_at: string;
}

export interface DbGuess {
  id: string;
  apelido: string;
  match_id: string;
  gols_a: number;
  gols_b: number;
  updated_at: string;
}

export interface DbGroupPrediction {
  apelido: string;
  grupo_copa: string;
  first_team: string;
  second_team: string;
  saved: boolean;
}

export interface DbAdminDelta {
  apelido: string;
  grupo_id: string;
  delta: number;
  updated_at: string;
}

export interface DbMatch {
  id: string;
  ord: number;
  phase: string;
  grupo: string;
  rodada: number | null;
  training: boolean;
  status: string;
  team_a: string;
  flag_a: string;
  team_b: string;
  flag_b: string;
  kickoff: string | null;
  label: string;
  updated_at: string;
}
