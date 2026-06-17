import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock do cliente Supabase para inspecionar as chamadas REST
const upsertSpy = vi.fn((..._args: unknown[]) => Promise.resolve({ error: null }));
const fromSpy = vi.fn(() => ({ upsert: upsertSpy }));

vi.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: unknown[]) => fromSpy(...(args as [])) },
}));

import {
  upsertGuess, upsertGroupPredictions, backfillGuesses, nowBrasilia,
  seedMissingMatches,
} from "@/lib/supabase-sync";
import type { Match } from "@/lib/types";

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

    const count = await backfillGuesses("Nino", local, server);

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

  it("não chama o Supabase quando não há nada a recuperar", async () => {
    const count = await backfillGuesses("Nino", { m1: { a: 1, b: 1 } }, { m1: { a: 1, b: 1 } });
    expect(count).toBe(0);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it("timestamps do backfill usam offset de Brasília", async () => {
    await backfillGuesses("Nino", { m2: { a: 1, b: 0 } }, {});
    const rows = upsertSpy.mock.calls[0][0] as unknown as Array<{ updated_at: string }>;
    expect(rows[0].updated_at).toMatch(/-03:00$/);
  });
});

describe("upsertGuess", () => {
  it("usa onConflict apelido+match_id (PK é UUID — sem isso o re-save falha)", async () => {
    await upsertGuess("Ney", "m1", 2, 1);

    expect(fromSpy).toHaveBeenCalledWith("guesses");
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        apelido: "Ney", match_id: "m1", gols_a: 2, gols_b: 1,
        updated_at: expect.stringMatching(/-03:00$/),
      }),
      { onConflict: "apelido,match_id" },
    );
  });

  it("retorna true em sucesso e false em erro", async () => {
    expect(await upsertGuess("Ney", "m1", 2, 1)).toBe(true);

    upsertSpy.mockResolvedValueOnce({ error: { message: "boom" } } as never);
    expect(await upsertGuess("Ney", "m1", 2, 1)).toBe(false);
  });
});

describe("seedMissingMatches", () => {
  const mk = (id: string): Match => ({
    id, phase: "grupos", group: "Grupo A", status: "upcoming",
    a: { name: "BRA", flag: "🇧🇷" }, b: { name: "ARG", flag: "🇦🇷" },
    kickoff: Date.UTC(2026, 5, 18, 19), label: "18/Jun",
  });

  it("sobe apenas os jogos do seed que ainda não estão no banco (insert-only)", async () => {
    const local = [mk("g1"), mk("g2"), mk("g3")];
    const existing = new Set(["g1"]); // g2 e g3 são novos → liberam

    const count = await seedMissingMatches(local, existing);

    expect(count).toBe(2);
    expect(fromSpy).toHaveBeenCalledWith("matches");
    const [rows, opts] = upsertSpy.mock.calls[0] as unknown as [Array<{ id: string; ord: number }>, unknown];
    expect(rows.map((r) => r.id)).toEqual(["g2", "g3"]);
    // ord canônico = índice em MATCHES (preserva ordem do seed)
    expect(rows.map((r) => r.ord)).toEqual([1, 2]);
    expect(opts).toEqual({ onConflict: "id", ignoreDuplicates: true });
  });

  it("não chama o Supabase quando o banco já tem todos os jogos", async () => {
    const local = [mk("g1"), mk("g2")];
    const count = await seedMissingMatches(local, new Set(["g1", "g2"]));
    expect(count).toBe(0);
    expect(upsertSpy).not.toHaveBeenCalled();
  });
});

describe("upsertGroupPredictions", () => {
  it("envia uma linha por grupo com o flag saved", async () => {
    await upsertGroupPredictions("Ney", {
      "Grupo A": { first: "BRA", second: "MEX" },
      "Grupo B": { first: "FRA", second: "CAN" },
    }, true);

    expect(fromSpy).toHaveBeenCalledWith("group_predictions");
    expect(upsertSpy).toHaveBeenCalledWith([
      { apelido: "Ney", grupo_copa: "Grupo A", first_team: "BRA", second_team: "MEX", saved: true },
      { apelido: "Ney", grupo_copa: "Grupo B", first_team: "FRA", second_team: "CAN", saved: true },
    ]);
  });

  it("não chama o Supabase com previsões vazias", async () => {
    await upsertGroupPredictions("Ney", {}, true);
    expect(upsertSpy).not.toHaveBeenCalled();
  });
});
