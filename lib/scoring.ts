import { SCORING, WINNER_PTS_BY_PHASE } from "./mock-data";
import type { Breakdown, Player, Match, DesafioCat } from "./types";

export const sign = (n: number): -1 | 0 | 1 =>
  n > 0 ? 1 : n < 0 ? -1 : 0;

/**
 * Calcula pontos de um palpite.
 * - Fase "grupos": regras normais (exact=10, winner=5, total=3, diff=3, golsA=2, golsB=2)
 * - Fases eliminatórias: vencedor vale mais (por fase), extras mantêm os mesmos valores
 */
export function breakdown(
  actual: { sa: number; sb: number },
  guess: { a: number; b: number },
  phase: Match["phase"] = "grupos"
): Breakdown {
  const isElim = phase !== "grupos";

  // Pontos do vencedor: na fase de grupos usa o SCORING padrão;
  // no mata-mata usa o multiplicador da fase
  const winnerBase = SCORING.find((r) => r.key === "winner")!.pts; // 5
  const winnerPts = isElim ? (WINNER_PTS_BY_PHASE[phase] ?? winnerBase) : winnerBase;

  const checks: Record<string, boolean> = {
    exact:  actual.sa === guess.a && actual.sb === guess.b,
    winner: sign(actual.sa - actual.sb) === sign(guess.a - guess.b),
    total:  actual.sa + actual.sb === guess.a + guess.b,
    diff:   actual.sa - actual.sb === guess.a - guess.b,
    golsA:  actual.sa === guess.a,
    golsB:  actual.sb === guess.b,
  };

  const rows = SCORING.map((r) => ({
    ...r,
    // Substitui pontos do vencedor se for mata-mata
    pts: r.key === "winner" ? winnerPts : r.pts,
    hit: checks[r.key],
  }));

  const total = rows.reduce((s, r) => s + (r.hit ? r.pts : 0), 0);
  return { rows, total };
}

export function mScore(
  m: Match,
  resultFix: Record<string, { sa: number; sb: number }>
) {
  const f = resultFix[m.id];
  return { sa: f ? f.sa : (m.sa ?? 0), sb: f ? f.sb : (m.sb ?? 0) };
}

export function catOf(itemId: string, cats: DesafioCat[]) {
  return cats.find((c) => itemId.startsWith(c.id + "-"));
}

export function bonusPts(
  desafios: Record<string, true>,
  cats: DesafioCat[],
  comboBank = 0,
  penalty = 0
): number {
  let s = 0;
  for (const id in desafios) {
    if (desafios[id]) {
      const c = catOf(id, cats);
      if (c) s += c.pts;
    }
  }
  return s + comboBank + penalty;
}

export function effPts(
  p: Player,
  adminDelta: Record<string, number>,
  bonus = 0
): number {
  return p.pts + (adminDelta[p.name] || 0) + (p.you ? bonus : 0);
}

export function rankWithEff(
  players: Player[],
  adminDelta: Record<string, number>,
  bonus = 0
): Player[] {
  return [...players].sort(
    (a, b) => effPts(b, adminDelta, bonus) - effPts(a, adminDelta, bonus)
  );
}

/** Pontuação máxima possível em um jogo (grupos) */
export const PONTUACAO_MAXIMA_GRUPOS = SCORING.reduce((s, r) => s + r.pts, 0); // 25

// ── Penalidade por ausência sequencial de palpites ────────────────
/** Jogos finalizados CONSECUTIVOS sem palpite tolerados antes de penalizar */
export const FREE_MISSES = 2;
/** Pontos perdidos por jogo sem palpite além da carência */
export const MISS_PENALTY = 3;
/**
 * Marco a partir do qual a penalidade de ausência passa a valer (00h BRT de
 * 14/Jun, quando a regra foi criada). Jogos com kickoff ANTERIOR a este
 * instante não penalizam ausência — só contam os pontos positivos.
 */
export const PENALTY_START_MS = new Date("2026-06-14T03:00:00Z").getTime(); // 14/Jun 00h BRT

/**
 * Recalcula os pontos de partidas de cada participante a partir dos
 * resultados oficiais + palpites reais.
 *
 * Regra de ausência (sequencial): contam-se os jogos finalizados CONSECUTIVOS
 * sem palpite. Os 2 primeiros são carência (0 pts); do 3º consecutivo em diante
 * perde MISS_PENALTY por jogo. Ao palpitar, a sequência zera e a carência
 * recomeça. Treinos não contam. Processa em ordem cronológica (kickoff).
 *
 * `penaltyFrom`: só penaliza ausência em jogos com kickoff >= esse instante
 * (jogos anteriores só somam pontos positivos). 0 = penaliza tudo.
 */
export function computeMatchPts(
  ativos: { apelido: string }[],
  officialResults: Record<string, { sa: number; sb: number }>,
  allGuesses: Record<string, Record<string, { a: number; b: number }>>,
  matches: Match[],
  penaltyFrom = 0,
): Record<string, number> {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const jogos = Object.keys(officialResults)
    .map((id) => byId.get(id))
    .filter((m): m is Match => !!m && !m.training)
    .sort((a, b) => (a.kickoff ?? 0) - (b.kickoff ?? 0));

  const pts: Record<string, number> = {};
  const streak: Record<string, number> = {};
  for (const p of ativos) { pts[p.apelido] = 0; streak[p.apelido] = 0; }

  for (const m of jogos) {
    const score = officialResults[m.id];
    const mg = allGuesses[m.id] ?? {};
    const penaliza = (m.kickoff ?? 0) >= penaltyFrom; // jogos antes do marco não punem ausência
    for (const p of ativos) {
      const g = mg[p.apelido];
      if (g) {
        pts[p.apelido] += breakdown(score, { a: g.a, b: g.b }, m.phase).total;
        if (penaliza) streak[p.apelido] = 0; // palpitou → zera a carência
      } else if (penaliza) {
        streak[p.apelido] += 1;
        if (streak[p.apelido] > FREE_MISSES) pts[p.apelido] -= MISS_PENALTY;
      }
    }
  }
  return pts;
}
