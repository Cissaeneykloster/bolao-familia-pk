import { describe, it, expect } from "vitest";
import {
  codeFromName, codeFromExtTeam, mapResults, parseEspn,
  type ExtMatch, type EspnScoreboard,
} from "@/lib/results-api";
import type { Match } from "@/lib/types";

const mk = (id: string, aName: string, bName: string, kickoffIso: string, extra: Partial<Match> = {}): Match => ({
  id, phase: "grupos", group: "G", status: "upcoming",
  a: { name: aName, flag: "" }, b: { name: bName, flag: "" },
  kickoff: Date.parse(kickoffIso), ...extra,
});

const ext = (home: string, away: string, hs: number | null, as: number | null, iso: string, ch?: string, ca?: string, finished = true): ExtMatch => ({
  finished, dateMs: Date.parse(iso),
  home: { name: home, code: ch }, away: { name: away, code: ca },
  homeScore: hs, awayScore: as,
});

describe("codeFromName", () => {
  it("normaliza PT (com acento) e EN para o mesmo código", () => {
    expect(codeFromName("África do Sul")).toBe("RSA");
    expect(codeFromName("South Africa")).toBe("RSA");
    expect(codeFromName("Rep. Tcheca")).toBe("CZE");
    expect(codeFromName("Czechia")).toBe("CZE");
  });
  it("retorna null para desconhecido/vazio", () => {
    expect(codeFromName("Atlântida")).toBeNull();
    expect(codeFromName("")).toBeNull();
  });
});

describe("codeFromExtTeam", () => {
  it("prefere a sigla quando presente", () => {
    expect(codeFromExtTeam({ name: "qualquer", code: "BRA" })).toBe("BRA");
  });
  it("corrige sigla divergente (SLO → SVN)", () => {
    expect(codeFromExtTeam({ name: "Slovenia", code: "SLO" })).toBe("SVN");
  });
  it("cai pro nome quando não há sigla", () => {
    expect(codeFromExtTeam({ name: "Mexico" })).toBe("MEX");
  });
});

describe("mapResults", () => {
  it("casa por par e reorienta o placar pro lado A/B do app", () => {
    const app = [mk("ga1r2", "Rep. Tcheca", "África do Sul", "2026-06-18T16:00:00Z")];
    const src = [ext("South Africa", "Czech Republic", 1, 2, "2026-06-18T16:00:00Z", "RSA", "CZE")];
    const { results, unmatched } = mapResults(src, app);
    expect(unmatched).toEqual([]);
    expect(results).toEqual([{ matchId: "ga1r2", sa: 2, sb: 1 }]); // Tcheca=A=2, RSA=B=1
  });

  it("mantém orientação quando A do app == mandante da fonte", () => {
    const app = [mk("m", "México", "Coreia do Sul", "2026-06-18T22:00:00Z")];
    const src = [ext("Mexico", "South Korea", 3, 0, "2026-06-18T22:00:00Z", "MEX", "KOR")];
    expect(mapResults(src, app).results).toEqual([{ matchId: "m", sa: 3, sb: 0 }]);
  });

  it("ignora não-encerrados e sem placar", () => {
    const app = [mk("m", "Brasil", "Argentina", "2026-06-20T20:00:00Z")];
    const src = [
      ext("Brazil", "Argentina", null, null, "2026-06-20T20:00:00Z", "BRA", "ARG", false),
      ext("Brazil", "Argentina", null, null, "2026-06-20T20:00:00Z", "BRA", "ARG", true),
    ];
    expect(mapResults(src, app).results).toEqual([]);
  });

  it("ignora treinos do app e reporta não-casados", () => {
    const app = [mk("t", "Brasil", "Argentina", "2026-06-07T14:00:00Z", { training: true, phase: "amistoso" })];
    const src = [ext("Brazil", "Argentina", 2, 1, "2026-06-07T14:00:00Z", "BRA", "ARG")];
    const { results, unmatched } = mapResults(src, app);
    expect(results).toEqual([]);
    expect(unmatched.length).toBe(1);
  });

  it("desempata par repetido pela data mais próxima", () => {
    const app = [
      mk("grupo", "Brasil", "Argentina", "2026-06-12T20:00:00Z"),
      mk("final", "Brasil", "Argentina", "2026-07-19T20:00:00Z", { phase: "final" }),
    ];
    const src = [ext("Brazil", "Argentina", 0, 1, "2026-07-19T20:00:00Z", "BRA", "ARG")];
    expect(mapResults(src, app).results).toEqual([{ matchId: "final", sa: 0, sb: 1 }]);
  });
});

describe("parseEspn", () => {
  const sample: EspnScoreboard = {
    events: [
      {
        date: "2026-06-18T16:00Z",
        status: { type: { state: "post", completed: true } },
        competitions: [{
          competitors: [
            { homeAway: "home", score: "1", team: { displayName: "South Africa", abbreviation: "RSA" } },
            { homeAway: "away", score: "2", team: { displayName: "Czech Republic", abbreviation: "CZE" } },
          ],
        }],
      },
      {
        date: "2026-06-18T22:00Z",
        status: { type: { state: "in", completed: false } },
        competitions: [{
          competitors: [
            { homeAway: "home", score: "0", team: { displayName: "Mexico", abbreviation: "MEX" } },
            { homeAway: "away", score: "0", team: { displayName: "South Korea", abbreviation: "KOR" } },
          ],
        }],
      },
    ],
  };

  it("extrai mandante/visitante, placar e flag de encerrado", () => {
    const parsed = parseEspn(sample);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      finished: true, homeScore: 1, awayScore: 2,
      home: { name: "South Africa", code: "RSA" },
      away: { name: "Czech Republic", code: "CZE" },
    });
    expect(parsed[1].finished).toBe(false);
  });

  it("end-to-end: parseEspn + mapResults só aplica o jogo encerrado", () => {
    const app = [
      mk("ga1r2", "Rep. Tcheca", "África do Sul", "2026-06-18T16:00:00Z"),
      mk("ga2r2", "México", "Coreia do Sul", "2026-06-18T22:00:00Z"),
    ];
    const { results } = mapResults(parseEspn(sample), app);
    expect(results).toEqual([{ matchId: "ga1r2", sa: 2, sb: 1 }]);
  });

  it("tolera payload vazio/sem competidores", () => {
    expect(parseEspn({})).toEqual([]);
    expect(parseEspn({ events: [{ competitions: [{ competitors: [] }] }] })).toEqual([]);
  });
});
