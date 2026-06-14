/**
 * Converte os Participantes cadastrados pelo admin em Players para o ranking.
 * Pontos base = matchPts (partidas). O ajuste manual do admin (adminDelta) é
 * aplicado uma única vez em effPts/rankWithEff — NÃO deve ser somado aqui,
 * senão fica contado em dobro.
 */
import type { Player } from "./types";
import type { Participante } from "./mock-data";

export function participantesToPlayers(
  participantes: Participante[],
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

      // Base = pontos das partidas (adminDelta é aplicado em effPts)
      const pts = matchPts[p.apelido] ?? 0;

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
