import { describe, it, expect } from "vitest";
import {
  rollDailyChallenge, challengeCode, AREA_NUMBER,
  isWindowOpen, getChallengeWindow, todayVancouver,
  resolvePendingDraw,
} from "./daily";
import { DESAFIO_CATS } from "./mock-data";

describe("rollDailyChallenge", () => {
  it("retorna um draw com area e itemIdx válidos", () => {
    const draw = rollDailyChallenge(DESAFIO_CATS, () => 0.5);
    const cat = DESAFIO_CATS.find((c) => c.id === draw.area);
    expect(cat).toBeDefined();
    expect(draw.itemIdx).toBeGreaterThanOrEqual(0);
    expect(draw.itemIdx).toBeLessThan(cat!.items.length);
    expect(draw.done).toBe(false);
  });

  it("sorteia da pool completa (pode sortear qualquer área)", () => {
    const areas = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const draw = rollDailyChallenge(DESAFIO_CATS);
      areas.add(draw.area);
    }
    expect(areas.size).toBeGreaterThan(1);
  });

  it("dateVancouver é uma data válida", () => {
    const draw = rollDailyChallenge(DESAFIO_CATS);
    expect(draw.dateVancouver).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("challengeCode", () => {
  it("quarto item 0 → '1.1'", () => expect(challengeCode("quarto", 0)).toBe("1.1"));
  it("quarto item 3 → '1.4'", () => expect(challengeCode("quarto", 3)).toBe("1.4"));
  it("servico item 1 → '3.2'", () => expect(challengeCode("servico", 1)).toBe("3.2"));
  it("saude item 3 → '5.4'", () => expect(challengeCode("saude", 3)).toBe("5.4"));
});

describe("AREA_NUMBER", () => {
  it("quarto = 1", () => expect(AREA_NUMBER.quarto).toBe(1));
  it("servico = 3", () => expect(AREA_NUMBER.servico).toBe(3));
  it("saude = 5", () => expect(AREA_NUMBER.saude).toBe(5));
});

describe("getChallengeWindow", () => {
  it("janela abre antes de fechar", () => {
    const { open, close } = getChallengeWindow("2026-06-11");
    expect(close).toBeGreaterThan(open);
  });

  it("janela tem ~23 horas", () => {
    const { open, close } = getChallengeWindow("2026-06-11");
    const hours = (close - open) / 3_600_000;
    expect(hours).toBeCloseTo(23, 0);
  });
});

describe("isWindowOpen", () => {
  it("fora da janela → false", () => {
    // 00:30 UTC = antes da abertura (01:00 Vancouver = 08:00 UTC)
    const earlyUTC = new Date("2026-06-11T00:30:00Z").getTime();
    expect(isWindowOpen("2026-06-11", earlyUTC)).toBe(false);
  });

  it("dentro da janela → true", () => {
    // 12:00 UTC = dentro da janela
    const midday = new Date("2026-06-11T12:00:00Z").getTime();
    expect(isWindowOpen("2026-06-11", midday)).toBe(true);
  });
});

describe("resolvePendingDraw", () => {
  it("null se não há draw", () => {
    expect(resolvePendingDraw(null, DESAFIO_CATS)).toBeNull();
  });

  it("retorna record quando a janela já fechou", () => {
    const pastDraw = {
      dateVancouver: "2026-06-01",
      area: "servico" as const,
      itemIdx: 0,
      done: true,
    };
    // Agora é muito depois — janela certamente fechada
    const futureNow = new Date("2026-07-01T12:00:00Z").getTime();
    const record = resolvePendingDraw(pastDraw, DESAFIO_CATS, futureNow);
    expect(record).not.toBeNull();
    expect(record!.done).toBe(true);
    expect(record!.pts).toBe(5); // serviço vale 5
    expect(record!.code).toBe("3.1");
  });

  it("pts negativo se não fez", () => {
    const pastDraw = {
      dateVancouver: "2026-06-01",
      area: "quarto" as const,
      itemIdx: 0,
      done: false,
    };
    const futureNow = new Date("2026-07-01T12:00:00Z").getTime();
    const record = resolvePendingDraw(pastDraw, DESAFIO_CATS, futureNow);
    expect(record!.pts).toBe(-3); // quarto vale 3, não fez → -3
  });
});
