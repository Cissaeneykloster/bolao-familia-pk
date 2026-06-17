/**
 * De-para entre os resultados da football-data.org (competição "WC") e os
 * jogos do app. Tudo aqui é PURO e testável — sem rede, sem Supabase.
 *
 * A API devolve seleções em inglês (+ um `tla` de 3 letras); o app guarda os
 * nomes em português. Casamos ambos a um CÓDIGO canônico (FIFA, 3 letras) e
 * comparamos pares de seleções. A orientação (mandante/visitante) pode diferir
 * entre API e app, então o placar é reorientado para o lado A/B do jogo.
 */
import type { Match } from "./types";

// ── Subconjunto do payload da football-data.org ───────────────────
export interface FdTeam {
  name?: string | null;
  tla?: string | null; // ex.: "BRA", "MEX"
}
export interface FdMatch {
  status: string; // queremos "FINISHED"
  utcDate: string; // ISO 8601
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: { fullTime: { home: number | null; away: number | null } };
}

/**
 * Nome (PT do app OU EN da API, em minúsculas) → código canônico.
 * Inclui as 54 seleções presentes no seed e as variações em inglês que a
 * football-data.org costuma usar. Chave sempre minúscula e sem acento no lookup.
 */
const NAME_TO_CODE: Record<string, string> = {
  // Português (app) ───────────────────────────────────────────────
  "alemanha": "GER", "argentina": "ARG", "argelia": "ALG", "arabia saudita": "KSA",
  "australia": "AUS", "brasil": "BRA", "belgica": "BEL", "bosnia-herz.": "BIH",
  "c. do marfim": "CIV", "cabo verde": "CPV", "canada": "CAN", "chile": "CHI",
  "colombia": "COL", "coreia do sul": "KOR", "croacia": "CRO", "curacao": "CUW",
  "eua": "USA", "egito": "EGY", "equador": "ECU", "escocia": "SCO",
  "eslovenia": "SVN", "espanha": "ESP", "franca": "FRA", "gana": "GHA",
  "guatemala": "GUA", "haiti": "HAI", "holanda": "NED", "inglaterra": "ENG",
  "iraque": "IRQ", "irlanda do norte": "NIR", "ira": "IRN", "islandia": "ISL",
  "japao": "JPN", "jordania": "JOR", "marrocos": "MAR", "mexico": "MEX",
  "noruega": "NOR", "nova zelandia": "NZL", "panama": "PAN", "paraguai": "PAR",
  "peru": "PER", "portugal": "POR", "qatar": "QAT", "rep. congo": "CGO",
  "rep. tcheca": "CZE", "senegal": "SEN", "suecia": "SWE", "suica": "SUI",
  "tunisia": "TUN", "turquia": "TUR", "uruguai": "URU", "uzbequistao": "UZB",
  "africa do sul": "RSA", "austria": "AUT",

  // Inglês (football-data.org) ─────────────────────────────────────
  "germany": "GER", "algeria": "ALG", "saudi arabia": "KSA", "australia ": "AUS",
  "brazil": "BRA", "belgium": "BEL", "bosnia and herzegovina": "BIH",
  "ivory coast": "CIV", "côte d'ivoire": "CIV", "cote d'ivoire": "CIV",
  "cape verde": "CPV", "canada ": "CAN",
  "colombia ": "COL", "south korea": "KOR", "korea republic": "KOR",
  "croatia": "CRO", "curaçao": "CUW", "united states": "USA", "usa ": "USA",
  "egypt": "EGY", "ecuador": "ECU", "scotland": "SCO", "slovenia": "SVN",
  "spain": "ESP", "france": "FRA", "ghana": "GHA", "netherlands": "NED",
  "england": "ENG", "iraq": "IRQ", "northern ireland": "NIR", "iran": "IRN",
  "ir iran": "IRN", "iceland": "ISL", "japan": "JPN", "jordan": "JOR",
  "morocco": "MAR", "mexico ": "MEX", "norway": "NOR", "new zealand": "NZL",
  "paraguay": "PAR", "peru ": "PER", "portugal ": "POR",
  "qatar ": "QAT", "republic of the congo": "CGO", "congo": "CGO",
  "czech republic": "CZE", "czechia": "CZE", "senegal ": "SEN", "sweden": "SWE",
  "switzerland": "SUI", "turkey": "TUR", "türkiye": "TUR",
  "uruguay": "URU", "uzbekistan": "UZB", "south africa": "RSA",
  "argentina ": "ARG", "chile ": "CHI", "guatemala ": "GUA", "haiti ": "HAI",
};

/**
 * Conserta `tla` da football-data.org que diferem do nosso código canônico.
 * (a maioria coincide; mapeamos só os divergentes conhecidos)
 */
const TLA_FIX: Record<string, string> = {
  SVK: "SVK", SLO: "SVN", // Eslovênia
  NLD: "NED", GER: "GER",
  POR: "POR", KOR: "KOR",
};

/** Remove acentos e baixa a caixa para o lookup do dicionário. */
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/** Código canônico a partir do nome (PT ou EN) — null se desconhecido. */
export function codeFromName(name: string | null | undefined): string | null {
  if (!name) return null;
  return NAME_TO_CODE[norm(name)] ?? null;
}

/** Código de uma seleção da API: usa `tla` (com correção) ou cai pro nome. */
export function codeFromApiTeam(team: FdTeam): string | null {
  if (team.tla && /^[A-Za-z]{3}$/.test(team.tla)) {
    const up = team.tla.toUpperCase();
    return TLA_FIX[up] ?? up;
  }
  return codeFromName(team.name);
}

/** Código de uma seleção do app (nome em português). */
export function codeFromAppTeam(name: string): string | null {
  return codeFromName(name);
}

/** Chave de par não-ordenado, ex.: "BRA|MEX" (ordem alfabética). */
function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

export interface MappedResult {
  matchId: string;
  sa: number;
  sb: number;
}
export interface MapOutcome {
  results: MappedResult[];
  /** Descrição dos jogos FINISHED da API que não casaram com nenhum jogo do app. */
  unmatched: string[];
}

/**
 * Casa os jogos FINISHED da API com os jogos do app e devolve o placar já
 * reorientado para o lado A/B de cada jogo. Casamento por par de seleções
 * (código canônico); empates de par (ex.: revanche grupo×mata-mata) são
 * desfeitos pela data de kickoff mais próxima da `utcDate` da API.
 */
export function mapApiResultsToMatches(
  apiMatches: FdMatch[],
  appMatches: Match[],
): MapOutcome {
  // Indexa os jogos do app por par de códigos
  const byPair = new Map<string, Match[]>();
  for (const m of appMatches) {
    if (m.training) continue;
    const ca = codeFromAppTeam(m.a.name);
    const cb = codeFromAppTeam(m.b.name);
    if (!ca || !cb) continue;
    const k = pairKey(ca, cb);
    (byPair.get(k) ?? byPair.set(k, []).get(k)!).push(m);
  }

  const results: MappedResult[] = [];
  const unmatched: string[] = [];
  const used = new Set<string>();

  for (const fd of apiMatches) {
    if (fd.status !== "FINISHED") continue;
    const home = fd.score.fullTime.home;
    const away = fd.score.fullTime.away;
    if (home == null || away == null) continue;

    const ch = codeFromApiTeam(fd.homeTeam);
    const caw = codeFromApiTeam(fd.awayTeam);
    if (!ch || !caw) {
      unmatched.push(`${fd.homeTeam.name ?? "?"} x ${fd.awayTeam.name ?? "?"} (código desconhecido)`);
      continue;
    }

    const candidates = (byPair.get(pairKey(ch, caw)) ?? []).filter((m) => !used.has(m.id));
    if (candidates.length === 0) {
      unmatched.push(`${fd.homeTeam.name ?? ch} x ${fd.awayTeam.name ?? caw}`);
      continue;
    }

    // Desempate: kickoff mais próximo da data da API
    const apiTs = Date.parse(fd.utcDate);
    const best = candidates.reduce((acc, m) =>
      Math.abs((m.kickoff ?? 0) - apiTs) < Math.abs((acc.kickoff ?? 0) - apiTs) ? m : acc,
    );

    // Reorienta o placar para o lado A/B do jogo do app
    const appA = codeFromAppTeam(best.a.name);
    const sameOrientation = appA === ch;
    results.push({
      matchId: best.id,
      sa: sameOrientation ? home : away,
      sb: sameOrientation ? away : home,
    });
    used.add(best.id);
  }

  return { results, unmatched };
}
