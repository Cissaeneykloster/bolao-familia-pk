/**
 * Calcula a classificação de um grupo dinamicamente
 * a partir dos jogos já encerrados (com resultado).
 */
import type { Match, GroupTeam, Group } from "./types";
import { mScore } from "./scoring";

export function calcGroupStandings(
  group: Group,
  allMatches: Match[],
  resultFix: Record<string, { sa: number; sb: number }>
): GroupTeam[] {
  // Inicializa todos os times com estatísticas zeradas
  const stats: Record<string, GroupTeam> = {};
  for (const team of group.teams) {
    stats[team.name] = { ...team, j: 0, v: 0, e: 0, d: 0, sg: 0, pts: 0 };
  }

  // Filtra apenas os jogos deste grupo que já foram encerrados
  const groupMatches = allMatches.filter(
    (m) => m.group === group.name && m.phase === "grupos" && m.status === "finished"
  );

  for (const match of groupMatches) {
    const { sa, sb } = mScore(match, resultFix);
    const nameA = match.a.name;
    const nameB = match.b.name;

    if (!stats[nameA] || !stats[nameB]) continue;

    // Atualiza jogos disputados
    stats[nameA].j += 1;
    stats[nameB].j += 1;

    // Gols
    stats[nameA].sg += sa - sb;
    stats[nameB].sg += sb - sa;

    if (sa > sb) {
      // Time A venceu
      stats[nameA].v += 1; stats[nameA].pts += 3;
      stats[nameB].d += 1;
    } else if (sb > sa) {
      // Time B venceu
      stats[nameB].v += 1; stats[nameB].pts += 3;
      stats[nameA].d += 1;
    } else {
      // Empate
      stats[nameA].e += 1; stats[nameA].pts += 1;
      stats[nameB].e += 1; stats[nameB].pts += 1;
    }
  }

  // Ordena: pts → sg → vitórias
  return Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.sg !== a.sg) return b.sg - a.sg;
    return b.v - a.v;
  });
}
