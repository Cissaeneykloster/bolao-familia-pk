export type Trend = "up" | "down" | "flat";
export type Area = "quarto" | "casa" | "servico" | "intelectual" | "saude";
export type ScoringKey = "exact" | "winner" | "total" | "diff" | "golsA" | "golsB";

export interface Player {
  name: string;
  initials: string;
  pts: number;
  trend: Trend;
  exact: number;
  you?: boolean;
}

export interface Team { name: string; flag: string; }

export type MatchStatus = "finished" | "live" | "upcoming";

export interface Match {
  id: string;
  phase: "grupos" | "oitavas" | "final";
  group: string;
  a: Team;
  b: Team;
  status: MatchStatus;
  sa?: number;
  sb?: number;
  minute?: number;
  kickoff?: number;
  label?: string;
  guess?: { a: number; b: number };
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

export type FeedType = "exact" | "result" | "sent" | "winner";

export interface FeedEvent {
  type: FeedType;
  age: number;
  body: string;
  pts?: string;
  score?: { a: string; sa: number; sb: number; b: string };
  stats?: string[];
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

export interface Draw {
  date: string;
  picks: Partial<Record<Area, number>>;
}
