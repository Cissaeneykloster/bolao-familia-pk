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

/** Pontos ganhos com as previsões de grupos (10 pts por classificado acertado)
 *
 * `opts.provisional`:
 *  - false (padrão, OFICIAL): só pontua um grupo quando TODOS os seus jogos
 *    terminaram — antes disso os 2 classificados ainda podem mudar, então
 *    pontuar seria sobre uma tabela provisória (ver issue #51).
 *  - true (PRÉVIA da UI): pontua a partir do 1º jogo encerrado, para o
 *    participante ver o potencial. NUNCA usar no somatório do ranking.
 */
export function calcGroupPredictionPts(
  predictions: Record<string, { first: string; second: string }>,
  groups: Group[],
  allMatches: Match[],
  resultFix: Record<string, { sa: number; sb: number }>,
  opts: { provisional?: boolean } = {}
): { total: number; details: { group: string; pts: number; acertos: string[] }[] } {
  const details: { group: string; pts: number; acertos: string[] }[] = [];
  let total = 0;

  for (const group of groups) {
    const pred = predictions[group.name];
    if (!pred) {
      details.push({ group: group.name, pts: 0, acertos: [] });
      continue;
    }

    // Verifica quantos jogos do grupo já foram encerrados (todas as rodadas)
    const groupMatches = allMatches.filter(
      (m) => m.group === group.name && m.phase === "grupos"
    );
    const totalDoGrupo = groupMatches.length;
    const encerrados = groupMatches.filter((m) => !!resultFix[m.id]).length;

    // OFICIAL: classificados só são definitivos com o grupo 100% encerrado.
    // PRÉVIA: basta 1 jogo encerrado (tabela provisória).
    const pronto = opts.provisional
      ? encerrados > 0
      : totalDoGrupo > 0 && encerrados === totalDoGrupo;
    if (!pronto) {
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

/**
 * Pontos OFICIAIS de previsão de grupos por participante (apelido → total).
 * Usa a regra definitiva (só conta grupos encerrados). Alimenta o ranking.
 */
export function computeAllGroupPredictionPts(
  allPredictions: Record<string, Record<string, { first: string; second: string }>>,
  groups: Group[],
  allMatches: Match[],
  resultFix: Record<string, { sa: number; sb: number }>
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const apelido in allPredictions) {
    out[apelido] = calcGroupPredictionPts(
      allPredictions[apelido], groups, allMatches, resultFix
    ).total;
  }
  return out;
}

export function calcGroupStandings(
  group: Group,
  allMatches: Match[],
  resultFix: Record<string, { sa: number; sb: number }>
): GroupTeam[] {
  // Inicializa todos os times com estatísticas zeradas
  const stats: Record<string, GroupTeam> = {};
  const gf: Record<string, number> = {}; // gols pró (não está no GroupTeam — local p/ desempate)
  for (const team of group.teams) {
    stats[team.name] = { ...team, j: 0, v: 0, e: 0, d: 0, sg: 0, pts: 0 };
    gf[team.name] = 0;
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
    gf[nameA] += sa;
    gf[nameB] += sb;

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

  // Mini-tabela do confronto direto entre um conjunto de times empatados.
  const headToHead = (names: Set<string>) => {
    const mp: Record<string, { pts: number; sg: number; gf: number }> = {};
    for (const n of names) mp[n] = { pts: 0, sg: 0, gf: 0 };
    for (const match of groupMatches) {
      if (!names.has(match.a.name) || !names.has(match.b.name)) continue;
      const { sa, sb } = mScore(match, resultFix);
      mp[match.a.name].sg += sa - sb; mp[match.a.name].gf += sa;
      mp[match.b.name].sg += sb - sa; mp[match.b.name].gf += sb;
      if (sa > sb) mp[match.a.name].pts += 3;
      else if (sb > sa) mp[match.b.name].pts += 3;
      else { mp[match.a.name].pts += 1; mp[match.b.name].pts += 1; }
    }
    return mp;
  };

  // Critério geral (FIFA): pontos → saldo de gols → gols pró.
  const teams = Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.sg !== a.sg) return b.sg - a.sg;
    return gf[b.name] - gf[a.name];
  });

  // Desempate dos que ficaram iguais em (pts, sg, gols pró): confronto direto
  // (pts → sg → gols pró entre eles) → vitórias → nome (determinístico).
  const keyOf = (t: GroupTeam) => `${t.pts}|${t.sg}|${gf[t.name]}`;
  for (let i = 0; i < teams.length; ) {
    let j = i + 1;
    while (j < teams.length && keyOf(teams[j]) === keyOf(teams[i])) j++;
    if (j - i > 1) {
      const tied = teams.slice(i, j);
      const names = new Set(tied.map((t) => t.name));
      const mp = headToHead(names);
      tied.sort((a, b) => {
        if (mp[b.name].pts !== mp[a.name].pts) return mp[b.name].pts - mp[a.name].pts;
        if (mp[b.name].sg !== mp[a.name].sg) return mp[b.name].sg - mp[a.name].sg;
        if (mp[b.name].gf !== mp[a.name].gf) return mp[b.name].gf - mp[a.name].gf;
        if (b.v !== a.v) return b.v - a.v;
        return a.name.localeCompare(b.name);
      });
      for (let k = 0; k < tied.length; k++) teams[i + k] = tied[k];
    }
    i = j;
  }

  return teams;
}
