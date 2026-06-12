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
    currentGrupoId: null,
    participantes: [],
    groupPredictions: {},
    groupPredictionsSaved: false,
    groupPredictionsSavedAt: null,
  });
});

// Chave enviada ao Supabase quando só o apelido é conhecido
const soApelido = (apelido: string) => ({ apelido, participanteId: null, grupoId: null });

// ── saveGuess → Supabase ──────────────────────────────────────────

describe("saveGuess — persistência no Supabase", () => {
  it("grava no Supabase quando o participante está identificado", () => {
    useBolao.setState({ currentUserApelido: "Ney", guesses: { m1: { a: 2, b: 1 } } });
    useBolao.getState().saveGuess("m1");
    expect(upsertGuess).toHaveBeenCalledWith(soApelido("Ney"), "m1", 2, 1);
  });

  it("participante resolvido na lista: grava com participante_id e grupo", () => {
    useBolao.setState({
      currentUserApelido: "Ney",
      currentGrupoId: "pk",
      participantes: [
        { id: "p1", grupoId: "pk", nome: "Ney", apelido: "Ney", email: "", telefone: "", token: "t", ativo: true },
      ],
      guesses: { m1: { a: 2, b: 1 } },
    });
    useBolao.getState().saveGuess("m1");
    expect(upsertGuess).toHaveBeenCalledWith(
      { apelido: "Ney", participanteId: "p1", grupoId: "pk" }, "m1", 2, 1,
    );
  });

  it("apelido repetido entre grupos sem grupo ativo: cai no modo legado (só apelido)", () => {
    useBolao.setState({
      currentUserApelido: "Ney",
      currentGrupoId: null,
      participantes: [
        { id: "p1", grupoId: "pk", nome: "Ney", apelido: "Ney", email: "", telefone: "", token: "t", ativo: true },
        { id: "p2", grupoId: "cissa", nome: "Ney", apelido: "Ney", email: "", telefone: "", token: "t", ativo: true },
      ],
      guesses: { m1: { a: 2, b: 1 } },
    });
    useBolao.getState().saveGuess("m1");
    expect(upsertGuess).toHaveBeenCalledWith(soApelido("Ney"), "m1", 2, 1);
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
    expect(upsertGroupPredictions).toHaveBeenCalledWith(soApelido("Ney"), preds, true);
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

import { isMatchLocked } from "@/lib/standings";
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

describe("saveGuess — respeita a trava do kickoff", () => {
  it("partida já iniciada: não grava nem local nem no Supabase", () => {
    const past = MATCHES.find(
      (m) => !m.training && m.kickoff && m.kickoff + EXTRA_MS_AFTER_KICKOFF < Date.now(),
    );
    expect(past, "esperava ao menos um jogo já iniciado no calendário").toBeDefined();

    useBolao.setState({ currentUserApelido: "Nino", guesses: { [past!.id]: { a: 1, b: 0 } } });
    useBolao.getState().saveGuess(past!.id);
    expect(upsertGuess).not.toHaveBeenCalled();
  });

  it("partida futura: grava normalmente", () => {
    const future = MATCHES.find((m) => !m.training && m.kickoff && m.kickoff > Date.now() + 60_000);
    expect(future, "esperava ao menos um jogo futuro no calendário").toBeDefined();

    useBolao.setState({ currentUserApelido: "Nino", guesses: { [future!.id]: { a: 2, b: 2 } } });
    useBolao.getState().saveGuess(future!.id);
    expect(upsertGuess).toHaveBeenCalledWith(soApelido("Nino"), future!.id, 2, 2);
  });
});
