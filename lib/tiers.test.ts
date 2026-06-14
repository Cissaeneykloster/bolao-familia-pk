import { describe, it, expect } from "vitest";
import { tierForRank, TIERS } from "./tiers";

describe("tierForRank (quartis por percentil)", () => {
  it("8 participantes → 2 por tier", () => {
    const tiers = Array.from({ length: 8 }, (_, i) => tierForRank(i, 8));
    expect(tiers).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it("o 1º colocado fica no topo e o último na lanterna", () => {
    expect(tierForRank(0, 10)).toBe(0);
    expect(tierForRank(9, 10)).toBe(TIERS.length - 1);
  });

  it("total 0 não quebra", () => {
    expect(tierForRank(0, 0)).toBe(0);
  });

  it("nunca passa do último tier", () => {
    expect(tierForRank(3, 4)).toBe(3);
    expect(tierForRank(99, 100)).toBe(3);
  });
});
