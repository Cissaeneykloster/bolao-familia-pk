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
