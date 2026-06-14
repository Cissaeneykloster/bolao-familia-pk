import { describe, it, expect } from "vitest";
import { participantesToPlayers } from "./players";
import { effPts } from "./scoring";
import type { Participante } from "./mock-data";

const part = (apelido: string): Participante => ({
  id: apelido, grupoId: "pk", nome: apelido, apelido,
  email: "", telefone: "", token: "t", ativo: true,
});

describe("participantesToPlayers", () => {
  it("usa matchPts como base e NÃO soma adminDelta (evita contagem dupla)", () => {
    const players = participantesToPlayers([part("Ney")], { Ney: 30 });
    expect(players[0].pts).toBe(30); // apenas matchPts
  });

  it("adminDelta é aplicado uma única vez, via effPts", () => {
    const players = participantesToPlayers([part("Ney")], { Ney: 30 });
    // ajuste manual de +5 → 35 (e não 40, que seria a contagem dupla)
    expect(effPts(players[0], { Ney: 5 })).toBe(35);
  });

  it("ignora participantes inativos", () => {
    const inativo: Participante = { ...part("Ze"), ativo: false };
    const players = participantesToPlayers([part("Ney"), inativo], { Ney: 10, Ze: 99 });
    expect(players.map((p) => p.name)).toEqual(["Ney"]);
  });
});
