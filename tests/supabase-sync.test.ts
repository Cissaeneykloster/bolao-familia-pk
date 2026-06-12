import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock do cliente Supabase para inspecionar as chamadas REST
const upsertSpy = vi.fn(() => Promise.resolve({ error: null }));
const fromSpy = vi.fn(() => ({ upsert: upsertSpy }));

vi.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: unknown[]) => fromSpy(...(args as [])) },
}));

import { upsertGuess, upsertGroupPredictions } from "@/lib/supabase-sync";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("upsertGuess", () => {
  it("usa onConflict apelido+match_id (PK é UUID — sem isso o re-save falha)", async () => {
    await upsertGuess("Ney", "m1", 2, 1);

    expect(fromSpy).toHaveBeenCalledWith("guesses");
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        apelido: "Ney", match_id: "m1", gols_a: 2, gols_b: 1,
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
