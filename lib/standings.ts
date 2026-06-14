/**
 * Calcula a classificação de um grupo dinamicamente
 * a partir dos jogos já encerrados (com resultado).
 */
import type { Match, GroupTeam, Group } from "./types";
import { mScore } from "./scoring";
import { EXTRA_MS_AFTER_KICKOFF } from "./mock-data";

/** Timestamp do kickoff do primeiro jogo da Copa */
export const COPA_FIRST_KICKOFF_MS = new Date("2026-06-11T19:00:00Z").getTime(); // 11/Jun 16h BRT = 19h UTC

/**
 * Prazo final para enviar/editar a Previsão dos Grupos.
 * Estendido para +10 dias após o kickoff original, dando mais tempo ao pessoal palpitar.
 */
export const GROUP_PREDICTIONS_DEADLINE_MS =
  COPA_FIRST_KICKOFF_MS + 10 * 24 * 60 * 60 * 1000; // 21/Jun 16h BRT

/**
 * Verifica se as previsões dos grupos estão travadas.
 * Até o prazo (GROUP_PREDICTIONS_DEADLINE_MS) TODOS podem editar — inclusive
 * quem já preencheu/salvou. Só trava de fato quando o prazo encerra.
 */
export function arePredictionsLocked(_saved: boolean, now = Date.now()): boolean {
  return now >= GROUP_PREDICTIONS_DEADLINE_MS;
}

/**
 * Palpite travado: a partida já começou (kickoff + tolerância de 5 min).
 * Treinos nunca travam por horário; jogo sem kickoff não trava.
 */
export function isMatchLocked(
  match: Pick<Match, "kickoff" | "training">,
  now = Date.now(),
): boolean {
  if (match.training || !match.kickoff) return false;
  return now >= match.kickoff + EXTRA_MS_AFTER_KICKOFF;
}

/** Pontos ganhos com as previsões de grupos (10 pts por classificado acertado) */
export function calcGroupPredictionPts(
  predictions: Record<string, { first: string; second: string }>,
  groups: Group[],
  allMatches: Match[],
  resultFix: Record<string, { sa: number; sb: number }>
): { total: number; details: { group: string; pts: number; acertos: string[] }[] } {
  const details: { group: string; pts: number; acertos: string[] }[] = [];
  let total = 0;

  for (const group of groups) {
    const pred = predictions[group.name];
    if (!pred) {
      details.push({ group: group.name, pts: 0, acertos: [] });
      continue;
    }

    // Verifica se já há jogos suficientes encerrados (todas as rodadas do grupo)
    const groupMatches = allMatches.filter(
      (m) => m.group === group.name && m.phase === "grupos"
    );
    const encerrados = groupMatches.filter((m) => !!resultFix[m.id]).length;

    // Só calcula se ao menos 1 jogo foi encerrado
    if (encerrados === 0) {
      details.push({ group: group.name, pts: 0, acertos: [] });
      continue;
    }

    const standings = calcGroupStandings(group, allMatches, resultFix);
    const classifiedNames = standings.slice(0, 2).map((t) => t.name);

    const acertos: string[] = [];
    if (classifiedNames.includes(pred.first)) acertos.push(pred.first);
    if (classifiedNames.includes(pred.second) && pred.second !== pred.first) {
      acertos.push(pred.second);
    }

    const pts = acertos.length * 10;
    total += pts;
    details.push({ group: group.name, pts, acertos });
  }

  return { total, details };
}

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

  // "Encerrado" = tem resultado oficial lançado (o status do jogo não muda sozinho)
  const groupMatches = allMatches.filter(
    (m) => m.group === group.name && m.phase === "grupos" && !!resultFix[m.id]
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
