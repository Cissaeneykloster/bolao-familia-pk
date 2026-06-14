import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mocka a camada de sync para observar as chamadas feitas pelo store
vi.mock("@/lib/supabase-sync", () => ({
  upsertGuess: vi.fn(),
  upsertGroupPredictions: vi.fn(),
}));

import { useBolao } from "@/lib/store";
import { upsertGuess, upsertGroupPredictions } from "@/lib/supabase-sync";

beforeEach(() => {
  vi.clearAllMocks();
  useBolao.setState({
    guesses: {},
    officialResults: {},
    currentUserApelido: null,
    groupPredictions: {},
    groupPredictionsSaved: false,
    groupPredictionsSavedAt: null,
  });
});

// ── saveGuess → Supabase ──────────────────────────────────────────

describe("saveGuess — persistência no Supabase", () => {
  it("grava no Supabase quando o participante está identificado", () => {
    useBolao.setState({ currentUserApelido: "Ney", guesses: { m1: { a: 2, b: 1 } } });
    useBolao.getState().saveGuess("m1");
    expect(upsertGuess).toHaveBeenCalledWith("Ney", "m1", 2, 1);
  });

  it("NÃO grava quando o participante não está identificado", () => {
    useBolao.setState({ guesses: { m1: { a: 2, b: 1 } } });
    useBolao.getState().saveGuess("m1");
    expect(upsertGuess).not.toHaveBeenCalled();
  });

  it("NÃO grava quando não existe palpite para o jogo", () => {
    useBolao.setState({ currentUserApelido: "Ney" });
    useBolao.getState().saveGuess("m1");
    expect(upsertGuess).not.toHaveBeenCalled();
  });
});

// ── saveGroupPredictions → Supabase ───────────────────────────────

describe("saveGroupPredictions — persistência no Supabase", () => {
  const preds = {
    "Grupo A": { first: "BRA", second: "MEX" },
    "Grupo B": { first: "FRA", second: "CAN" },
  };

  it("grava todas as previsões com saved=true quando identificado", () => {
    useBolao.setState({ currentUserApelido: "Ney", groupPredictions: preds });
    useBolao.getState().saveGroupPredictions();
    expect(upsertGroupPredictions).toHaveBeenCalledWith("Ney", preds, true);
    expect(useBolao.getState().groupPredictionsSaved).toBe(true);
  });

  it("trava localmente mesmo sem identificação (sem chamada ao Supabase)", () => {
    useBolao.setState({ groupPredictions: preds });
    useBolao.getState().saveGroupPredictions();
    expect(upsertGroupPredictions).not.toHaveBeenCalled();
    expect(useBolao.getState().groupPredictionsSaved).toBe(true);
  });
});

// ── mergeGuesses — servidor × local ───────────────────────────────

describe("mergeGuesses — regras de merge", () => {
  it("servidor vence em jogo travado (resultado oficial lançado)", () => {
    useBolao.setState({
      guesses: { m1: { a: 0, b: 0 } },
      officialResults: { m1: { sa: 2, sb: 1 } },
    });
    useBolao.getState().mergeGuesses({ m1: { a: 2, b: 1 } });
    expect(useBolao.getState().guesses["m1"]).toEqual({ a: 2, b: 1 });
  });

  it("local vence em rascunho de jogo não travado", () => {
    useBolao.setState({ guesses: { m1: { a: 3, b: 0 } } });
    useBolao.getState().mergeGuesses({ m1: { a: 1, b: 1 } });
    expect(useBolao.getState().guesses["m1"]).toEqual({ a: 3, b: 0 });
  });

  it("servidor preenche jogos sem palpite local (aparelho novo)", () => {
    useBolao.getState().mergeGuesses({ m1: { a: 1, b: 1 }, m2: { a: 0, b: 2 } });
    expect(useBolao.getState().guesses).toEqual({
      m1: { a: 1, b: 1 },
      m2: { a: 0, b: 2 },
    });
  });
});

// ── mergeGroupPredictions — servidor × local ──────────────────────

describe("mergeGroupPredictions — regras de merge", () => {
  const serverPreds = { "Grupo A": { first: "BRA", second: "MEX" } };

  it("servidor travado (saved=true) sobrescreve o local", () => {
    useBolao.setState({
      groupPredictions: { "Grupo A": { first: "MEX", second: "BRA" } },
    });
    useBolao.getState().mergeGroupPredictions(serverPreds, true);
    const s = useBolao.getState();
    expect(s.groupPredictions).toEqual(serverPreds);
    expect(s.groupPredictionsSaved).toBe(true);
  });

  it("rascunho do servidor não sobrescreve rascunho local", () => {
    useBolao.setState({
      groupPredictions: { "Grupo A": { first: "MEX", second: "BRA" } },
    });
    useBolao.getState().mergeGroupPredictions(serverPreds, false);
    expect(useBolao.getState().groupPredictions["Grupo A"]).toEqual({
      first: "MEX", second: "BRA",
    });
    expect(useBolao.getState().groupPredictionsSaved).toBe(false);
  });

  it("rascunho do servidor preenche grupos vazios no local", () => {
    useBolao.getState().mergeGroupPredictions(serverPreds, false);
    expect(useBolao.getState().groupPredictions).toEqual(serverPreds);
  });

  it("local já travado ignora rascunho do servidor", () => {
    useBolao.setState({
      groupPredictions: { "Grupo A": { first: "MEX", second: "BRA" } },
      groupPredictionsSaved: true,
    });
    useBolao.getState().mergeGroupPredictions(serverPreds, false);
    expect(useBolao.getState().groupPredictions["Grupo A"]).toEqual({
      first: "MEX", second: "BRA",
    });
  });
});

// ── Trava de palpite no kickoff ───────────────────────────────────

import { isMatchLocked, isMatchGuessLocked } from "@/lib/standings";
import { MATCHES, EXTRA_MS_AFTER_KICKOFF } from "@/lib/mock-data";

describe("isMatchLocked — palpite trava quando a partida começa", () => {
  const kickoff = new Date("2026-06-20T16:00:00-03:00").getTime();

  it("antes do kickoff: liberado", () => {
    expect(isMatchLocked({ kickoff }, kickoff - 1000)).toBe(false);
  });

  it("dentro da tolerância de 5 min: ainda liberado", () => {
    expect(isMatchLocked({ kickoff }, kickoff + EXTRA_MS_AFTER_KICKOFF - 1)).toBe(false);
  });

  it("após kickoff + tolerância: travado", () => {
    expect(isMatchLocked({ kickoff }, kickoff + EXTRA_MS_AFTER_KICKOFF)).toBe(true);
  });

  it("treino nunca trava por horário", () => {
    expect(isMatchLocked({ kickoff, training: true }, kickoff + 999_999_999)).toBe(false);
  });

  it("jogo sem kickoff não trava", () => {
    expect(isMatchLocked({}, Date.now())).toBe(false);
  });
});

describe("isMatchGuessLocked — período de graça (+10 dias)", () => {
  const kickoff = new Date("2026-06-20T16:00:00-03:00").getTime(); // antes do prazo (21/Jun)

  it("dentro do prazo: liberado mesmo após o kickoff", () => {
    expect(isMatchGuessLocked({ kickoff }, kickoff + EXTRA_MS_AFTER_KICKOFF)).toBe(false);
  });

  it("após o prazo, partida iniciada: travado", () => {
    const lateKickoff = new Date("2026-06-25T19:00:00-03:00").getTime();
    expect(isMatchGuessLocked({ kickoff: lateKickoff }, lateKickoff + EXTRA_MS_AFTER_KICKOFF)).toBe(true);
  });

  it("após o prazo, antes do kickoff: liberado", () => {
    const lateKickoff = new Date("2026-06-25T19:00:00-03:00").getTime();
    expect(isMatchGuessLocked({ kickoff: lateKickoff }, lateKickoff - 1000)).toBe(false);
  });
});

describe("saveGuess — trava de palpite (período de graça + kickoff)", () => {
  const DURING = new Date("2026-06-14T12:00:00Z"); // dentro do prazo (+10 dias)
  const AFTER = new Date("2026-06-26T12:00:00Z");   // após o prazo (21/Jun)
  const started = MATCHES.find((m) => !m.training && m.kickoff && m.kickoff < DURING.getTime());
  const future = MATCHES.find((m) => !m.training && m.kickoff && m.kickoff > AFTER.getTime());

  afterEach(() => vi.useRealTimers());

  it("dentro do prazo: grava mesmo em jogo já iniciado", () => {
    vi.useFakeTimers(); vi.setSystemTime(DURING);
    expect(started, "esperava um jogo já iniciado no calendário").toBeDefined();
    useBolao.setState({ currentUserApelido: "Nino", guesses: { [started!.id]: { a: 1, b: 0 } } });
    useBolao.getState().saveGuess(started!.id);
    expect(upsertGuess).toHaveBeenCalled();
  });

  it("após o prazo: não grava jogo já iniciado", () => {
    vi.useFakeTimers(); vi.setSystemTime(AFTER);
    expect(started).toBeDefined();
    useBolao.setState({ currentUserApelido: "Nino", guesses: { [started!.id]: { a: 1, b: 0 } } });
    useBolao.getState().saveGuess(started!.id);
    expect(upsertGuess).not.toHaveBeenCalled();
  });

  it("após o prazo, jogo futuro: grava normalmente", () => {
    vi.useFakeTimers(); vi.setSystemTime(AFTER);
    expect(future, "esperava um jogo futuro no calendário").toBeDefined();
    useBolao.setState({ currentUserApelido: "Nino", guesses: { [future!.id]: { a: 2, b: 2 } } });
    useBolao.getState().saveGuess(future!.id);
    expect(upsertGuess).toHaveBeenCalledWith("Nino", future!.id, 2, 2);
  });
});
