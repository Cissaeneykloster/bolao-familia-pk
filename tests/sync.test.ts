import { describe, it, expect, beforeEach, vi } from "vitest";

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
