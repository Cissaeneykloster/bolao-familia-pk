import { describe, it, expect } from "vitest";
import {
  rollDraw, drawnId, dailyDoneCount, closeDayResult,
  shouldClaimCombo, activeDraw, todayStr,
} from "./daily";
import { DESAFIO_CATS, DAILY_AREAS } from "./mock-data";
import type { Area } from "./types";

const AREAS = DAILY_AREAS as Area[];

describe("rollDraw", () => {
  it("sorteia 1 índice válido por área", () => {
    const draw = rollDraw(DESAFIO_CATS, AREAS, () => 0.5);
    for (const a of AREAS) {
      const c = DESAFIO_CATS.find((x) => x.id === a)!;
      expect(draw.picks[a]).toBeGreaterThanOrEqual(0);
      expect(draw.picks[a]!).toBeLessThan(c.items.length);
    }
    expect(draw.date).toBe(todayStr());
  });
});

describe("activeDraw", () => {
  it("ignora sorteio de outro dia", () => {
    expect(activeDraw({ date: "2000-01-01", picks: {} })).toBeNull();
  });

  it("retorna o draw do dia atual", () => {
    const draw = { date: todayStr(), picks: {} };
    expect(activeDraw(draw)).toBe(draw);
  });
});

describe("dailyDoneCount + closeDayResult", () => {
  const draw = {
    date: todayStr(),
    picks: { quarto: 0, servico: 0, intelectual: 0, saude: 0 },
  };

  it("0 feitas → perde 15 (3+5+4+3), missed 4", () => {
    const r = closeDayResult(draw, {}, AREAS, DESAFIO_CATS);
    expect(r).toEqual({ lost: 15, missed: 4 });
    expect(dailyDoneCount(draw, {}, AREAS)).toBe(0);
  });

  it("4 feitas → perde 0", () => {
    const done = {
      "quarto-0": true,
      "servico-0": true,
      "intelectual-0": true,
      "saude-0": true,
    } as Record<string, true>;
    expect(closeDayResult(draw, done, AREAS, DESAFIO_CATS)).toEqual({ lost: 0, missed: 0 });
    expect(dailyDoneCount(draw, done, AREAS)).toBe(4);
  });
});

describe("drawnId", () => {
  it("retorna null se draw for null", () => {
    expect(drawnId(null, "quarto")).toBeNull();
  });

  it("retorna o id correto", () => {
    const draw = { date: todayStr(), picks: { quarto: 2 } };
    expect(drawnId(draw, "quarto")).toBe("quarto-2");
  });
});

describe("shouldClaimCombo", () => {
  it("4/4 e não reivindicado", () =>
    expect(shouldClaimCombo(4, false)).toBe(true));

  it("4/4 já reivindicado", () =>
    expect(shouldClaimCombo(4, true)).toBe(false));

  it("3/4", () =>
    expect(shouldClaimCombo(3, false)).toBe(false));
});
