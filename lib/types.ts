export type Trend = "up" | "down" | "flat";
export type Area = "quarto" | "casa" | "servico" | "intelectual" | "saude";
export type ScoringKey = "exact" | "winner" | "total" | "diff" | "golsA" | "golsB";

export interface Player {
  name: string;
  initials: string;
  pts: number;
  trend: Trend;
  exact: number;
  winners?: number;   // acertos de vencedor (p/ desempate — §5 do regulamento)
  you?: boolean;
}

export interface Team { name: string; flag: string; }

export type MatchStatus = "finished" | "live" | "upcoming";

export type MatchPhase =
  | "amistoso" | "grupos" | "oitavas" | "quartas" | "semi" | "terceiro" | "final";

export interface Match {
  id: string;
  phase: MatchPhase;
  group: string;
  a: Team;
  b: Team;
  status: MatchStatus;
  sa?: number;
  sb?: number;
  minute?: number;
  kickoff?: number;   // timestamp ms (horário de Brasília)
  label?: string;
  guess?: { a: number; b: number };
  training?: boolean; // amistoso de treino — nunca fecha, não conta ranking
  rodada?: 1 | 2 | 3; // rodada dentro da fase de grupos
}

export interface ScoringRule { key: ScoringKey; label: string; pts: number; }
export interface ScoredRule extends ScoringRule { hit: boolean; }
export interface Breakdown { rows: ScoredRule[]; total: number; }

export interface GroupTeam {
  name: string; flag: string;
  j: number; v: number; e: number; d: number; sg: number; pts: number;
}

export interface Group {
  name: string;
  teams: GroupTeam[];
  pred: { first: string; second: string };
  predResult: "ok" | "wait";
  predPts: number;
  games: { t: string }[];
}

export type FeedType = "exact" | "result" | "sent" | "winner" | "challenge" | "announcement";

export interface FeedEvent {
  id: string;           // uuid para identificação única
  type: FeedType;
  timestamp: number;    // Date.now() quando ocorreu
  body: string;
  pts?: string;
  score?: { a: string; sa: number; sb: number; b: string };
  stats?: string[];
  emoji?: string;       // para anúncios personalizados
}

export interface DesafioCat {
  id: Area;
  icon: string;
  name: string;
  pts: number;
  items: string[];
}

export interface LockedBet {
  id: string;
  user: string;
  initials: string;
  matchId: string;
  match: string;
  a: number;
  b: number;
}

/** Desafio diário — 1 sorteio por dia, referência Vancouver (PDT UTC-7) */
export interface Draw {
  dateVancouver: string;   // "2026-06-11" no calendário de Vancouver
  area: Area;
  itemIdx: number;         // índice no array items[] da categoria
  done: boolean;           // marcado como feito
}

/** Histórico de desafios encerrados */
export interface ChallengeRecord {
  dateVancouver: string;
  area: Area;
  itemIdx: number;
  code: string;            // ex: "1.4"
  descricao: string;
  done: boolean;
  pts: number;             // positivo se feito, negativo se não
}
