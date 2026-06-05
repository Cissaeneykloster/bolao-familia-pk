import { describe, it, expect } from "vitest";
import { fmtCountdown, feedAge } from "./format";

describe("feedAge", () => {
  it('0 → "agora"',          () => expect(feedAge(0)).toBe("agora"));
  it('45 → "45min atrás"',   () => expect(feedAge(45)).toBe("45min atrás"));
  it('120 → "2h atrás"',     () => expect(feedAge(120)).toBe("2h atrás"));
  it('59 → "59min atrás"',   () => expect(feedAge(59)).toBe("59min atrás"));
  it('60 → "1h atrás"',      () => expect(feedAge(60)).toBe("1h atrás"));
});

describe("fmtCountdown", () => {
  it("≤ 0 → fechado",                () => expect(fmtCountdown(0)).toBe("fechado"));
  it("negativo → fechado",            () => expect(fmtCountdown(-1000)).toBe("fechado"));
  it("30min → 0h 30m",               () => expect(fmtCountdown(30 * 60_000)).toBe("0h 30m"));
  it("90min → 1h 30m",               () => expect(fmtCountdown(90 * 60_000)).toBe("1h 30m"));
  it("24h exato → 1d",               () => expect(fmtCountdown(24 * 60 * 60_000)).toBe("1d"));
  it("36h → 1d 12h",                 () => expect(fmtCountdown(36 * 60 * 60_000)).toBe("1d 12h"));
});
