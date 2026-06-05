import { describe, it, expect } from "vitest";
import { sign, breakdown, mScore, bonusPts, effPts, rankWithEff } from "./scoring";
import { DESAFIO_CATS } from "./mock-data";
import type { Player } from "./types";

// Jogadores de teste locais (não dependem do RANKING mockado)
const PLAYERS: Player[] = [
  { name: "Rafael",  initials: "RF", pts: 241, trend: "flat", exact: 8, you: true },
  { name: "Marcos",  initials: "MC", pts: 187, trend: "up",   exact: 5 },
  { name: "Bruno",   initials: "BR", pts: 65,  trend: "flat", exact: 0 },
];

describe("sign", () => {
  it("retorna -1, 0, 1", () => {
    expect(sign(3)).toBe(1);
    expect(sign(-2)).toBe(-1);
    expect(sign(0)).toBe(0);
  });
});

describe("breakdown", () => {
  it("crava o placar exato = 25", () =>
    expect(breakdown({ sa: 2, sb: 1 }, { a: 2, b: 1 }).total).toBe(25));

  it("vencedor + total certos = 8", () =>
    expect(breakdown({ sa: 2, sb: 1 }, { a: 3, b: 0 }).total).toBe(8));

  it("empate previsto e ocorrido (winner+diff) = 8", () =>
    expect(breakdown({ sa: 0, sb: 0 }, { a: 1, b: 1 }).total).toBe(8));

  it("só total de gols = 3", () =>
    expect(breakdown({ sa: 2, sb: 1 }, { a: 1, b: 2 }).total).toBe(3));

  it("vencedor + golsA = 7", () =>
    expect(breakdown({ sa: 3, sb: 1 }, { a: 3, b: 2 }).total).toBe(7));

  it("tudo errado = 0", () =>
    expect(breakdown({ sa: 1, sb: 0 }, { a: 0, b: 3 }).total).toBe(0));

  it("flags individuais coerentes", () => {
    const r = breakdown({ sa: 2, sb: 1 }, { a: 2, b: 1 });
    expect(r.rows.every((x) => x.hit)).toBe(true);
  });

  it("mata-mata: vencedor em oitavas = 27", () => {
    const r = breakdown({ sa: 1, sb: 0 }, { a: 1, b: 0 }, "oitavas");
    const vRow = r.rows.find((x) => x.key === "winner")!;
    expect(vRow.pts).toBe(27);
    expect(vRow.hit).toBe(true);
  });

  it("mata-mata: vencedor na final = 57", () => {
    const r = breakdown({ sa: 2, sb: 1 }, { a: 2, b: 1 }, "final");
    const vRow = r.rows.find((x) => x.key === "winner")!;
    expect(vRow.pts).toBe(57);
  });
});

describe("mScore", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = { id: "m1", sa: 2, sb: 1 } as any;

  it("sem fix retorna o original", () =>
    expect(mScore(m, {})).toEqual({ sa: 2, sb: 1 }));

  it("com fix retorna o corrigido", () =>
    expect(mScore(m, { m1: { sa: 5, sb: 0 } })).toEqual({ sa: 5, sb: 0 }));
});

describe("bonusPts", () => {
  it("vazio = 0", () =>
    expect(bonusPts({}, DESAFIO_CATS)).toBe(0));

  it("1 de servico = 5", () =>
    expect(bonusPts({ "servico-0": true }, DESAFIO_CATS)).toBe(5));

  it("soma combo e penalidade", () =>
    expect(bonusPts({ "quarto-0": true }, DESAFIO_CATS, 10, -15)).toBe(3 + 10 - 15));
});

describe("effPts / rankWithEff", () => {
  it("usuário soma o bônus; outros não", () => {
    const me = PLAYERS.find((p) => p.you)!;
    const other = PLAYERS.find((p) => !p.you)!;
    expect(effPts(me, {}, 20)).toBe(me.pts + 20);
    expect(effPts(other, {}, 20)).toBe(other.pts);
  });

  it("adminDelta gigante leva o último ao topo", () => {
    const last = PLAYERS[PLAYERS.length - 1];
    const ranked = rankWithEff(PLAYERS, { [last.name]: 999 });
    expect(ranked[0].name).toBe(last.name);
  });
});
