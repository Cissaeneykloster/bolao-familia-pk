/**
 * De-para entre resultados de uma fonte externa (ESPN) e os jogos do app.
 * Tudo aqui é PURO e testável — sem rede, sem Supabase.
 *
 * A fonte traz seleções em inglês (+ às vezes uma sigla); o app guarda nomes em
 * português. Casamos ambos a um CÓDIGO canônico (FIFA, 3 letras) e comparamos
 * pares de seleções. A orientação (mandante/visitante) pode diferir entre a
 * fonte e o app, então o placar é reorientado para o lado A/B do jogo.
 */
import type { Match } from "./types";

// ── Resultado externo normalizado (independente da fonte) ─────────
export interface ExtTeam {
  name?: string | null;
  code?: string | null; // sigla de 3 letras, se houver
}
export interface ExtMatch {
  finished: boolean;
  dateMs: number;
  home: ExtTeam;
  away: ExtTeam;
  homeScore: number | null;
  awayScore: number | null;
}

/**
 * Nome (PT do app OU EN da fonte, em minúsculas e sem acento) → código canônico.
 * Cobre as 54 seleções do seed e variações comuns em inglês.
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

  // Inglês (ESPN displayName e variações) ──────────────────────────
  "germany": "GER", "algeria": "ALG", "saudi arabia": "KSA",
  "brazil": "BRA", "belgium": "BEL", "bosnia and herzegovina": "BIH",
  "ivory coast": "CIV", "cote d'ivoire": "CIV",
  "cape verde": "CPV", "canada ": "CAN",
  "south korea": "KOR", "korea republic": "KOR",
  "croatia": "CRO", "curacao ": "CUW", "united states": "USA", "usa ": "USA",
  "egypt": "EGY", "ecuador": "ECU", "scotland": "SCO", "slovenia": "SVN",
  "spain": "ESP", "france": "FRA", "ghana": "GHA", "netherlands": "NED",
  "england": "ENG", "iraq": "IRQ", "northern ireland": "NIR", "iran": "IRN",
  "ir iran": "IRN", "iceland": "ISL", "japan": "JPN", "jordan": "JOR",
  "morocco": "MAR", "mexico ": "MEX", "norway": "NOR", "new zealand": "NZL",
  "paraguay": "PAR", "peru ": "PER", "portugal ": "POR",
  "qatar ": "QAT", "republic of the congo": "CGO", "congo": "CGO",
  "czech republic": "CZE", "czechia": "CZE", "senegal ": "SEN", "sweden": "SWE",
  "switzerland": "SUI", "turkey": "TUR", "turkiye": "TUR",
  "uruguay": "URU", "uzbekistan": "UZB", "south africa": "RSA",
};

/** Conserta siglas da fonte que diferem do nosso código canônico. */
const CODE_FIX: Record<string, string> = {
  SLO: "SVN", // Eslovênia (ESPN às vezes usa SLO)
  NLD: "NED",
  TUN: "TUN",
};

/** Remove acentos e baixa a caixa para o lookup do dicionário. */
function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

/** Código canônico a partir do nome (PT ou EN) — null se desconhecido. */
export function codeFromName(name: string | null | undefined): string | null {
  if (!name) return null;
  return NAME_TO_CODE[norm(name)] ?? null;
}

/** Código de uma seleção da fonte: usa a sigla (com correção) ou cai pro nome. */
export function codeFromExtTeam(team: ExtTeam): string | null {
  if (team.code && /^[A-Za-z]{3}$/.test(team.code)) {
    const up = team.code.toUpperCase();
    return CODE_FIX[up] ?? up;
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
  /** Jogos encerrados da fonte que não casaram com nenhum jogo do app. */
  unmatched: string[];
}

/**
 * Casa os jogos encerrados da fonte com os jogos do app e devolve o placar já
 * reorientado para o lado A/B de cada jogo. Casamento por par de seleções
 * (código canônico); empates de par (ex.: revanche grupo×mata-mata) são
 * desfeitos pela data mais próxima.
 */
export function mapResults(ext: ExtMatch[], appMatches: Match[]): MapOutcome {
  const byPair = new Map<string, Match[]>();
  for (const m of appMatches) {
    if (m.training) continue;
    const ca = codeFromAppTeam(m.a.name);
    const cb = codeFromAppTeam(m.b.name);
    if (!ca || !cb) continue;
    const k = pairKey(ca, cb);
    const arr = byPair.get(k) ?? [];
    arr.push(m);
    byPair.set(k, arr);
  }

  const results: MappedResult[] = [];
  const unmatched: string[] = [];
  const used = new Set<string>();

  for (const e of ext) {
    if (!e.finished || e.homeScore == null || e.awayScore == null) continue;

    const ch = codeFromExtTeam(e.home);
    const caw = codeFromExtTeam(e.away);
    if (!ch || !caw) {
      unmatched.push(`${e.home.name ?? "?"} x ${e.away.name ?? "?"} (código desconhecido)`);
      continue;
    }

    const candidates = (byPair.get(pairKey(ch, caw)) ?? []).filter((m) => !used.has(m.id));
    if (candidates.length === 0) {
      unmatched.push(`${e.home.name ?? ch} x ${e.away.name ?? caw}`);
      continue;
    }

    const best = candidates.reduce((acc, m) =>
      Math.abs((m.kickoff ?? 0) - e.dateMs) < Math.abs((acc.kickoff ?? 0) - e.dateMs) ? m : acc,
    );

    const appA = codeFromAppTeam(best.a.name);
    const sameOrientation = appA === ch;
    results.push({
      matchId: best.id,
      sa: sameOrientation ? e.homeScore : e.awayScore,
      sb: sameOrientation ? e.awayScore : e.homeScore,
    });
    used.add(best.id);
  }

  return { results, unmatched };
}

// ── Adaptador ESPN (scoreboard JSON) ──────────────────────────────
export interface EspnScoreboard {
  events?: Array<{
    date?: string;
    status?: { type?: { state?: string; completed?: boolean } };
    competitions?: Array<{
      competitors?: Array<{
        homeAway?: string;
        score?: string | number | null;
        team?: { displayName?: string; shortDisplayName?: string; abbreviation?: string };
      }>;
    }>;
  }>;
}

/** Converte o scoreboard da ESPN para o formato normalizado ExtMatch[]. */
export function parseEspn(json: EspnScoreboard): ExtMatch[] {
  const out: ExtMatch[] = [];
  for (const ev of json.events ?? []) {
    const comp = ev.competitions?.[0];
    const cs = comp?.competitors ?? [];
    const home = cs.find((c) => c.homeAway === "home") ?? cs[0];
    const away = cs.find((c) => c.homeAway === "away") ?? cs[1];
    if (!home || !away) continue;

    const t = ev.status?.type;
    const finished = t?.state === "post" || t?.completed === true;
    const num = (s: unknown): number | null => {
      const n = typeof s === "number" ? s : parseInt(String(s ?? ""), 10);
      return Number.isFinite(n) ? n : null;
    };

    out.push({
      finished,
      dateMs: ev.date ? Date.parse(ev.date) : 0,
      home: { name: home.team?.displayName, code: home.team?.abbreviation },
      away: { name: away.team?.displayName, code: away.team?.abbreviation },
      homeScore: num(home.score),
      awayScore: num(away.score),
    });
  }
  return out;
}
