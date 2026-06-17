import { describe, it, expect } from "vitest";
import {
  codeFromName, codeFromApiTeam, mapApiResultsToMatches,
  type FdMatch,
} from "@/lib/results-api";
import type { Match } from "@/lib/types";

const mk = (id: string, aName: string, bName: string, kickoffIso: string, extra: Partial<Match> = {}): Match => ({
  id, phase: "grupos", group: "G", status: "upcoming",
  a: { name: aName, flag: "" }, b: { name: bName, flag: "" },
  kickoff: Date.parse(kickoffIso), ...extra,
});

const fd = (home: string, away: string, sh: number | null, sa: number | null, utc: string, tlaH?: string, tlaA?: string, status = "FINISHED"): FdMatch => ({
  status, utcDate: utc,
  homeTeam: { name: home, tla: tlaH }, awayTeam: { name: away, tla: tlaA },
  score: { fullTime: { home: sh, away: sa } },
});

describe("codeFromName", () => {
  it("normaliza nomes em português (com acento) e inglês para o mesmo código", () => {
    expect(codeFromName("África do Sul")).toBe("RSA");
    expect(codeFromName("South Africa")).toBe("RSA");
    expect(codeFromName("Rep. Tcheca")).toBe("CZE");
    expect(codeFromName("Czechia")).toBe("CZE");
    expect(codeFromName("Czech Republic")).toBe("CZE");
  });
  it("retorna null para desconhecido", () => {
    expect(codeFromName("Atlântida")).toBeNull();
    expect(codeFromName("")).toBeNull();
  });
});

describe("codeFromApiTeam", () => {
  it("prefere o tla quando presente", () => {
    expect(codeFromApiTeam({ name: "qualquer", tla: "BRA" })).toBe("BRA");
  });
  it("corrige tla divergente (SLO → SVN)", () => {
    expect(codeFromApiTeam({ name: "Slovenia", tla: "SLO" })).toBe("SVN");
  });
  it("cai pro nome quando não há tla", () => {
    expect(codeFromApiTeam({ name: "Mexico" })).toBe("MEX");
  });
});

describe("mapApiResultsToMatches", () => {
  it("casa por par de seleções e reorienta o placar pro lado A/B do app", () => {
    // App: A=Rep. Tcheca, B=África do Sul. API: South Africa(home) 1 x 2 Czech
    const app = [mk("ga1r2", "Rep. Tcheca", "África do Sul", "2026-06-18T16:00:00Z")];
    const api = [fd("South Africa", "Czech Republic", 1, 2, "2026-06-18T16:00:00Z", "RSA", "CZE")];
    const { results, unmatched } = mapApiResultsToMatches(api, app);
    expect(unmatched).toEqual([]);
    expect(results).toEqual([{ matchId: "ga1r2", sa: 2, sb: 1 }]); // Tcheca=A=2, RSA=B=1
  });

  it("mantém a orientação quando A do app == mandante da API", () => {
    const app = [mk("m", "México", "Coreia do Sul", "2026-06-18T22:00:00Z")];
    const api = [fd("Mexico", "South Korea", 3, 0, "2026-06-18T22:00:00Z", "MEX", "KOR")];
    expect(mapApiResultsToMatches(api, app).results).toEqual([{ matchId: "m", sa: 3, sb: 0 }]);
  });

  it("ignora jogos não-FINISHED e sem placar", () => {
    const app = [mk("m", "Brasil", "Argentina", "2026-06-20T20:00:00Z")];
    const api = [
      fd("Brazil", "Argentina", null, null, "2026-06-20T20:00:00Z", "BRA", "ARG", "IN_PLAY"),
      fd("Brazil", "Argentina", null, null, "2026-06-20T20:00:00Z", "BRA", "ARG", "FINISHED"),
    ];
    expect(mapApiResultsToMatches(api, app).results).toEqual([]);
  });

  it("ignora treinos do app", () => {
    const app = [mk("t", "Brasil", "Argentina", "2026-06-07T14:00:00Z", { training: true, phase: "amistoso" })];
    const api = [fd("Brazil", "Argentina", 2, 1, "2026-06-07T14:00:00Z", "BRA", "ARG")];
    const { results, unmatched } = mapApiResultsToMatches(api, app);
    expect(results).toEqual([]);
    expect(unmatched.length).toBe(1); // não casou (treino fora do índice)
  });

  it("reporta jogos da API que não casam com nenhum jogo do app", () => {
    const app = [mk("m", "Brasil", "Argentina", "2026-06-20T20:00:00Z")];
    const api = [fd("Spain", "Portugal", 1, 1, "2026-06-20T20:00:00Z", "ESP", "POR")];
    const { results, unmatched } = mapApiResultsToMatches(api, app);
    expect(results).toEqual([]);
    expect(unmatched).toEqual(["Spain x Portugal"]);
  });

  it("desempata par repetido pela data de kickoff mais próxima", () => {
    // Mesmo par em dois jogos (ex.: grupo e revanche) — escolhe o mais próximo da data da API
    const app = [
      mk("grupo", "Brasil", "Argentina", "2026-06-12T20:00:00Z"),
      mk("final", "Brasil", "Argentina", "2026-07-19T20:00:00Z", { phase: "final" }),
    ];
    const api = [fd("Brazil", "Argentina", 0, 1, "2026-07-19T20:00:00Z", "BRA", "ARG")];
    expect(mapApiResultsToMatches(api, app).results).toEqual([{ matchId: "final", sa: 0, sb: 1 }]);
  });
});
