import { describe, it, expect } from "vitest";
import { sign, breakdown, mScore, bonusPts, effPts, rankWithEff, computeMatchStats, computeMatchPts } from "./scoring";
import { DESAFIO_CATS } from "./mock-data";
import type { Player, Match } from "./types";

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

describe("empate computa o 'Vencedor' (5 pts)", () => {
  const winnerRow = (r: ReturnType<typeof breakdown>) =>
    r.rows.find((x) => x.key === "winner")!;

  it("empate previsto e ocorrido marca o vencedor com 5 pts", () => {
    const r = breakdown({ sa: 0, sb: 0 }, { a: 2, b: 2 });
    expect(winnerRow(r).hit).toBe(true);
    expect(winnerRow(r).pts).toBe(5);
  });

  it("empate exato inclui os 5 do vencedor (placar exato = 25)", () => {
    const r = breakdown({ sa: 1, sb: 1 }, { a: 1, b: 1 });
    expect(winnerRow(r).hit).toBe(true);
    expect(r.total).toBe(25);
  });

  it("empate real, mas palpite de vitória NÃO marca vencedor", () => {
    expect(winnerRow(breakdown({ sa: 1, sb: 1 }, { a: 2, b: 1 })).hit).toBe(false);
  });

  it("vitória real, mas palpite de empate NÃO marca vencedor", () => {
    expect(winnerRow(breakdown({ sa: 2, sb: 1 }, { a: 1, b: 1 })).hit).toBe(false);
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

// ── Desempate (#46): contadores e ordenação ──────────────────────
describe("computeMatchStats — contadores de desempate", () => {
  const mkM = (id: string, training = false): Match => ({
    id, phase: "grupos", group: "G",
    a: { name: "A", flag: "" }, b: { name: "B", flag: "" },
    status: "finished", training,
  });
  const matches = [mkM("m1"), mkM("m2"), mkM("t1", true)];
  const official = { m1: { sa: 2, sb: 1 }, m2: { sa: 0, sb: 0 }, t1: { sa: 5, sb: 5 } };
  const guesses = {
    m1: { Ney: { a: 2, b: 1 }, Cissa: { a: 1, b: 0 } }, // Ney exato; Cissa só vencedor
    m2: { Ney: { a: 0, b: 0 }, Cissa: { a: 1, b: 2 } }, // Ney exato (empate); Cissa errou
    t1: { Ney: { a: 5, b: 5 } },                        // treino — ignorado
  };
  const stats = computeMatchStats(official, guesses, matches);

  it("conta placares exatos (treino ignorado)", () => {
    expect(stats.Ney.exact).toBe(2);
    expect(stats.Cissa.exact).toBe(0);
  });

  it("conta vencedores (inclui os exatos)", () => {
    expect(stats.Ney.winners).toBe(2);
    expect(stats.Cissa.winners).toBe(1); // só m1
  });
});

describe("rankWithEff — desempate por exatos e depois vencedores (§5)", () => {
  const P = (name: string, pts: number, exact: number, winners: number): Player =>
    ({ name, initials: name.slice(0, 2).toUpperCase(), pts, trend: "flat", exact, winners });

  it("mesmos pontos: mais placares exatos primeiro", () => {
    const r = rankWithEff([P("A", 50, 1, 3), P("B", 50, 4, 3)], {});
    expect(r[0].name).toBe("B");
  });

  it("empate em pontos e exatos: mais vencedores primeiro", () => {
    const r = rankWithEff([P("A", 50, 2, 1), P("B", 50, 2, 5)], {});
    expect(r[0].name).toBe("B");
  });

  it("pontos diferentes ignoram o desempate", () => {
    const r = rankWithEff([P("A", 60, 0, 0), P("B", 50, 9, 9)], {});
    expect(r[0].name).toBe("A");
  });
});

describe("computeMatchPts — não penaliza jogos antes do ingresso (#48)", () => {
  const M = (id: string, kickoff: number): Match => ({
    id, phase: "grupos", group: "G",
    a: { name: "A", flag: "" }, b: { name: "B", flag: "" },
    status: "finished", kickoff,
  });
  // 6 jogos encerrados; ninguém palpitou. penaltyFrom=0 → todos puníveis.
  const matches = [M("g1", 100), M("g2", 200), M("g3", 300), M("g4", 400), M("g5", 500), M("g6", 600)];
  const official = Object.fromEntries(matches.map((m) => [m.id, { sa: 1, sb: 0 }]));

  it("quem entrou cedo perde do 5º jogo seguido sem palpite em diante", () => {
    const pts = computeMatchPts([{ apelido: "Early", createdAt: 0 }], official, {}, matches, 0);
    expect(pts["Early"]).toBe(-6); // 6 ausências: 5ª e 6ª = -3 cada
  });

  it("quem entrou depois só conta ausência a partir do ingresso", () => {
    // createdAt 350 → conta só g4/g5/g6 (3 ausências, dentro da carência de 4)
    const pts = computeMatchPts([{ apelido: "Late", createdAt: 350 }], official, {}, matches, 0);
    expect(pts["Late"]).toBe(0);
  });
});
