import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock do cliente Supabase para inspecionar as chamadas REST
const upsertSpy = vi.fn((..._args: unknown[]) => Promise.resolve({ error: null }));
const eqSpy = vi.fn((..._args: unknown[]) => Promise.resolve({ data: [], error: null }));
const selectSpy = vi.fn(() => ({ eq: eqSpy }));
const fromSpy = vi.fn(() => ({ upsert: upsertSpy, select: selectSpy }));

vi.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: unknown[]) => fromSpy(...(args as [])) },
}));

import {
  upsertGuess, upsertGroupPredictions, backfillGuesses, nowBrasilia,
  loadGuesses, loadGroupPredictions, upsertMatchPtsBatch,
  type ParticipanteKey,
} from "@/lib/supabase-sync";
import type { Participante } from "@/lib/mock-data";

// Participante resolvido (Fase 2) e fallback só com apelido (legado)
const NEY: ParticipanteKey = { apelido: "Ney", participanteId: "p-ney", grupoId: "pk" };
const SO_APELIDO: ParticipanteKey = { apelido: "Ney" };

function participante(apelido: string, grupoId: string, id = `p-${apelido}`): Participante {
  return { id, grupoId, nome: apelido, apelido, email: "", telefone: "", token: "t", ativo: true };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("nowBrasilia", () => {
  it("converte o instante para o offset -03:00", () => {
    const utc = new Date("2026-06-12T15:30:00.000Z");
    expect(nowBrasilia(utc)).toBe("2026-06-12T12:30:00.000-03:00");
  });

  it("vira o dia corretamente perto da meia-noite UTC", () => {
    const utc = new Date("2026-06-12T01:00:00.000Z");
    expect(nowBrasilia(utc)).toBe("2026-06-11T22:00:00.000-03:00");
  });
});

describe("backfillGuesses", () => {
  it("sobe apenas os palpites que o servidor não tem (inclui encerrados)", async () => {
    const local = {
      m1: { a: 2, b: 1 }, // já existe no servidor
      m2: { a: 0, b: 0 }, // só local → sobe
      m3: { a: 3, b: 2 }, // só local (jogo encerrado) → sobe também
    };
    const server = { m1: { a: 2, b: 1 } };

    const count = await backfillGuesses({ apelido: "Nino" }, local, server);

    expect(count).toBe(2);
    expect(fromSpy).toHaveBeenCalledWith("guesses");
    expect(upsertSpy).toHaveBeenCalledWith(
      [
        expect.objectContaining({ apelido: "Nino", match_id: "m2", gols_a: 0, gols_b: 0 }),
        expect.objectContaining({ apelido: "Nino", match_id: "m3", gols_a: 3, gols_b: 2 }),
      ],
      { onConflict: "apelido,match_id" },
    );
  });

  it("participante resolvido: linhas carregam participante_id/grupo_id e o conflito muda de chave", async () => {
    await backfillGuesses(NEY, { m2: { a: 1, b: 0 } }, {});

    expect(upsertSpy).toHaveBeenCalledWith(
      [expect.objectContaining({ apelido: "Ney", participante_id: "p-ney", grupo_id: "pk", match_id: "m2" })],
      { onConflict: "participante_id,match_id" },
    );
  });

  it("não chama o Supabase quando não há nada a recuperar", async () => {
    const count = await backfillGuesses({ apelido: "Nino" }, { m1: { a: 1, b: 1 } }, { m1: { a: 1, b: 1 } });
    expect(count).toBe(0);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it("timestamps do backfill usam offset de Brasília", async () => {
    await backfillGuesses({ apelido: "Nino" }, { m2: { a: 1, b: 0 } }, {});
    const rows = upsertSpy.mock.calls[0][0] as unknown as Array<{ updated_at: string }>;
    expect(rows[0].updated_at).toMatch(/-03:00$/);
  });
});

describe("upsertGuess", () => {
  it("sem participante resolvido: chaveia por apelido+match_id (legado)", async () => {
    await upsertGuess(SO_APELIDO, "m1", 2, 1);

    expect(fromSpy).toHaveBeenCalledWith("guesses");
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        apelido: "Ney", match_id: "m1", gols_a: 2, gols_b: 1,
        updated_at: expect.stringMatching(/-03:00$/),
      }),
      { onConflict: "apelido,match_id" },
    );
    // sem resolução não envia colunas de identidade (não sobrescreve com NULL)
    const row = upsertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect("participante_id" in row).toBe(false);
  });

  it("participante resolvido: grava participante_id/grupo_id e chaveia por participante_id+match_id", async () => {
    await upsertGuess(NEY, "m1", 2, 1);

    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        apelido: "Ney", participante_id: "p-ney", grupo_id: "pk",
        match_id: "m1", gols_a: 2, gols_b: 1,
      }),
      { onConflict: "participante_id,match_id" },
    );
  });

  it("retorna true em sucesso e false em erro", async () => {
    expect(await upsertGuess(NEY, "m1", 2, 1)).toBe(true);

    upsertSpy.mockResolvedValueOnce({ error: { message: "boom" } } as never);
    expect(await upsertGuess(NEY, "m1", 2, 1)).toBe(false);
  });
});

describe("loadGuesses / loadGroupPredictions — filtro da leitura", () => {
  it("participante resolvido: filtra por participante_id", async () => {
    await loadGuesses(NEY);
    expect(fromSpy).toHaveBeenCalledWith("guesses");
    expect(eqSpy).toHaveBeenCalledWith("participante_id", "p-ney");

    await loadGroupPredictions(NEY);
    expect(fromSpy).toHaveBeenCalledWith("group_predictions");
    expect(eqSpy).toHaveBeenLastCalledWith("participante_id", "p-ney");
  });

  it("sem resolução: filtra por apelido (legado)", async () => {
    await loadGuesses(SO_APELIDO);
    expect(eqSpy).toHaveBeenCalledWith("apelido", "Ney");

    await loadGroupPredictions(SO_APELIDO);
    expect(eqSpy).toHaveBeenLastCalledWith("apelido", "Ney");
  });
});

describe("upsertGroupPredictions", () => {
  it("envia uma linha por grupo com o flag saved (legado, conflito na PK)", async () => {
    await upsertGroupPredictions(SO_APELIDO, {
      "Grupo A": { first: "BRA", second: "MEX" },
      "Grupo B": { first: "FRA", second: "CAN" },
    }, true);

    expect(fromSpy).toHaveBeenCalledWith("group_predictions");
    expect(upsertSpy).toHaveBeenCalledWith([
      { apelido: "Ney", grupo_copa: "Grupo A", first_team: "BRA", second_team: "MEX", saved: true },
      { apelido: "Ney", grupo_copa: "Grupo B", first_team: "FRA", second_team: "CAN", saved: true },
    ]);
  });

  it("participante resolvido: linhas com identidade e conflito por participante_id", async () => {
    await upsertGroupPredictions(NEY, {
      "Grupo A": { first: "BRA", second: "MEX" },
    }, false);

    expect(upsertSpy).toHaveBeenCalledWith(
      [expect.objectContaining({
        apelido: "Ney", participante_id: "p-ney", grupo_id: "pk",
        grupo_copa: "Grupo A", saved: false,
      })],
      { onConflict: "participante_id,grupo_copa" },
    );
  });

  it("não chama o Supabase com previsões vazias", async () => {
    await upsertGroupPredictions(NEY, {}, true);
    expect(upsertSpy).not.toHaveBeenCalled();
  });
});

describe("upsertMatchPtsBatch — grupo_id por apelido", () => {
  it("preenche grupo_id quando o apelido é inequívoco e omite quando é ambíguo", async () => {
    const parts = [
      participante("Ney", "pk"),
      participante("Cissa", "cissa"),
      // "Pedro" existe em dois grupos → ambíguo, fica sem grupo_id
      participante("Pedro", "pk", "p-pedro-pk"),
      participante("Pedro", "pedro", "p-pedro-en"),
    ];

    await upsertMatchPtsBatch({ Ney: 10, Cissa: 7, Pedro: 3 }, parts);

    expect(fromSpy).toHaveBeenCalledWith("match_pts");
    // dois lotes: com grupo resolvido e sem (não sobrescreve com NULL)
    expect(upsertSpy).toHaveBeenCalledTimes(2);
    expect(upsertSpy).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({ apelido: "Ney", pts: 10, grupo_id: "pk" }),
      expect.objectContaining({ apelido: "Cissa", pts: 7, grupo_id: "cissa" }),
    ]);
    expect(upsertSpy).toHaveBeenNthCalledWith(2, [
      expect.objectContaining({ apelido: "Pedro", pts: 3 }),
    ]);
    const semGrupo = (upsertSpy.mock.calls[1][0] as Record<string, unknown>[])[0];
    expect("grupo_id" in semGrupo).toBe(false);
  });

  it("sem participantes: mantém o comportamento antigo (só apelido)", async () => {
    await upsertMatchPtsBatch({ Ney: 5 });
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    expect(upsertSpy).toHaveBeenCalledWith([
      expect.objectContaining({ apelido: "Ney", pts: 5 }),
    ]);
  });

  it("mapa vazio não chama o Supabase", async () => {
    await upsertMatchPtsBatch({});
    expect(upsertSpy).not.toHaveBeenCalled();
  });
});
