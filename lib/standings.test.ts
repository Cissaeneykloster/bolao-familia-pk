import { describe, it, expect } from "vitest";
import { calcGroupStandings } from "./standings";
import { GROUPS, MATCHES } from "./mock-data";

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
