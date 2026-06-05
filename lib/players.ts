/**
 * Converte os Participantes cadastrados pelo admin em Players para o ranking.
 * Enquanto não há Supabase, os pontos começam zerados e crescem
 * via adminDelta (ajustes manuais do admin após cada jogo).
 */
import type { Player } from "./types";
import type { Participante } from "./mock-data";

export function participantesToPlayers(
  participantes: Participante[],
  adminDelta: Record<string, number>
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

      // Pontos base = 0, ajustados pelo adminDelta
      const pts = adminDelta[p.apelido] ?? 0;

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
