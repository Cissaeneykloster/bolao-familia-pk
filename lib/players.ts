/**
 * Converte os Participantes cadastrados pelo admin em Players para o ranking.
 * Pontos = matchPts (partidas) + adminDelta (ajuste manual)
 */
import type { Player } from "./types";
import type { Participante } from "./mock-data";

export function participantesToPlayers(
  participantes: Participante[],
  adminDelta: Record<string, number>,
  matchPts: Record<string, number> = {}
): Player[] {
  return participantes
    .filter((p) => p.ativo)
    .map((p) => {
      const initials = p.apelido
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      // Total = pontos das partidas + ajuste manual do admin
      const pts = (matchPts[p.apelido] ?? 0) + (adminDelta[p.apelido] ?? 0);

      return {
        name: p.apelido,
        initials,
        pts,
        trend: "flat" as const,
        exact: 0,
        you: false,
      };
    })
    .sort((a, b) => b.pts - a.pts);
}
