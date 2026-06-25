import { describe, it, expect } from "vitest";
import { calcGroupStandings, calcGroupPredictionPts, computeAllGroupPredictionPts } from "./standings";
import { GROUPS, MATCHES } from "./mock-data";
import type { Group, GroupTeam, Match } from "./types";

describe("calcGroupStandings — usa o resultado lançado, não o status do jogo", () => {
  const grupoA = GROUPS[0]; // México, África do Sul, Coreia do Sul, Rep. Tcheca
  const jogo = MATCHES.find((m) => m.group === "Grupo A" && m.phase === "grupos")!; // ga1r1: México × África do Sul

  it("sem resultado: tabela zerada", () => {
    const t = calcGroupStandings(grupoA, MATCHES, {});
    expect(t.every((x) => x.j === 0 && x.pts === 0)).toBe(true);
  });

  it("com resultado lançado: computa a vitória mesmo com status 'upcoming'", () => {
    const t = calcGroupStandings(grupoA, MATCHES, { [jogo.id]: { sa: 2, sb: 0 } });
    const vencedor = t.find((x) => x.name === jogo.a.name)!;
    const perdedor = t.find((x) => x.name === jogo.b.name)!;
    expect(vencedor.j).toBe(1);
    expect(vencedor.pts).toBe(3);
    expect(vencedor.sg).toBe(2);
    expect(perdedor.pts).toBe(0);
  });
});

// ── Previsão dos grupos: ranking só conta grupo encerrado (#45/#51) ──────
const mkTeam = (name: string): GroupTeam =>
  ({ name, flag: "", j: 0, v: 0, e: 0, d: 0, sg: 0, pts: 0 });
const GX: Group = {
  name: "GX",
  teams: [mkTeam("A"), mkTeam("B"), mkTeam("C"), mkTeam("D")],
  pred: { first: "", second: "" },
  predResult: "wait",
  predPts: 0,
  games: [],
};
const mkMatch = (id: string, a: string, b: string): Match =>
  ({ id, phase: "grupos", group: "GX", a: { name: a, flag: "" }, b: { name: b, flag: "" }, status: "upcoming" });
// 2 jogos = grupo "encerrado" quando ambos têm resultado
const MX: Match[] = [mkMatch("gx1", "A", "C"), mkMatch("gx2", "B", "D")];
const FULL = { gx1: { sa: 2, sb: 0 }, gx2: { sa: 1, sb: 0 } }; // A e B classificam
const PARCIAL = { gx1: { sa: 2, sb: 0 } };                     // só 1 dos 2 jogos

describe("calcGroupPredictionPts — grupo parcial não pontua no oficial (#51)", () => {
  const pred = { GX: { first: "A", second: "B" } };

  it("grupo parcial: OFICIAL não pontua (0)", () => {
    expect(calcGroupPredictionPts(pred, [GX], MX, PARCIAL).total).toBe(0);
  });

  it("grupo parcial: PRÉVIA pontua sobre a tabela provisória", () => {
    expect(calcGroupPredictionPts(pred, [GX], MX, PARCIAL, { provisional: true }).total)
      .toBeGreaterThan(0);
  });

  it("grupo encerrado: OFICIAL pontua os 2 classificados (2×10)", () => {
    expect(calcGroupPredictionPts(pred, [GX], MX, FULL).total).toBe(20);
  });

  it("sem previsão do grupo → 0", () => {
    expect(calcGroupPredictionPts({}, [GX], MX, FULL).total).toBe(0);
  });
});

describe("computeAllGroupPredictionPts — pontos oficiais por participante (#45)", () => {
  it("agrega por apelido, só com o grupo encerrado", () => {
    const all = {
      Ney:   { GX: { first: "A", second: "B" } }, // ambos classificam
      Cissa: { GX: { first: "C", second: "D" } }, // nenhum classifica
    };
    const pts = computeAllGroupPredictionPts(all, [GX], MX, FULL);
    expect(pts.Ney).toBe(20);
    expect(pts.Cissa).toBe(0);
  });

  it("grupo não encerrado → 0 para todos", () => {
    const all = { Ney: { GX: { first: "A", second: "B" } } };
    expect(computeAllGroupPredictionPts(all, [GX], MX, PARCIAL).Ney).toBe(0);
  });
});

// ── Desempate da classificação de grupo: gols pró e confronto direto (#52) ──
describe("calcGroupStandings — desempate por gols pró e confronto direto", () => {
  const grp = (name: string, names: string[]): Group => ({
    name, teams: names.map(mkTeam),
    pred: { first: "", second: "" }, predResult: "wait", predPts: 0, games: [],
  });
  const M = (id: string, group: string, a: string, b: string): Match =>
    ({ id, phase: "grupos", group, a: { name: a, flag: "" }, b: { name: b, flag: "" }, status: "finished" });

  it("gols pró desempata quando pts e saldo empatam", () => {
    const G = grp("GP", ["A", "B", "C", "D"]);
    const matches = [M("p1", "GP", "A", "C"), M("p2", "GP", "B", "D")];
    const res = { p1: { sa: 3, sb: 1 }, p2: { sa: 2, sb: 0 } };
    // A e B: pts3, sg+2; gols pró A=3 > B=2 → A na frente. C(gf1) > D(gf0).
    expect(calcGroupStandings(G, matches, res).map((t) => t.name)).toEqual(["A", "B", "C", "D"]);
  });

  it("confronto direto desempata com pts, saldo e gols pró iguais", () => {
    // Ordem [B,A,...]: sem confronto direto o empate cairia em B,A (inserção).
    const G = grp("HH", ["B", "A", "C", "D"]);
    const matches = [
      M("h1", "HH", "A", "B"), // A 2×1 B
      M("h2", "HH", "A", "C"), // A 0×1 C
      M("h3", "HH", "B", "D"), // B 1×0 D
    ];
    const res = { h1: { sa: 2, sb: 1 }, h2: { sa: 0, sb: 1 }, h3: { sa: 1, sb: 0 } };
    // C(3,+1,1) lidera; A e B empatam (3,0,2) → A venceu B no confronto direto.
    expect(calcGroupStandings(G, matches, res).map((t) => t.name)).toEqual(["C", "A", "B", "D"]);
  });
});
