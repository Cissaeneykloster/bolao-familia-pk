import { describe, it, expect } from "vitest";
import { participantesToPlayers, apelidoKey, canonicalApelido, apelidoEmUso } from "./players";
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

  it("soma a previsão de grupos à base (partidas + desafios + previsão)", () => {
    const players = participantesToPlayers(
      [part("Ney")], { Ney: 30 }, { Ney: 9 }, { Ney: 20 },
    );
    expect(players[0].pts).toBe(59); // 30 + 9 + 20
  });

  it("propaga exact/winners do matchStats (desempate)", () => {
    const players = participantesToPlayers(
      [part("Ney")], { Ney: 30 }, {}, {}, { Ney: { exact: 3, winners: 7 } },
    );
    expect(players[0].exact).toBe(3);
    expect(players[0].winners).toBe(7);
  });
});

describe("apelidoKey — normaliza para comparação", () => {
  it("ignora acento, maiúscula e espaços nas pontas", () => {
    expect(apelidoKey("Raíssa")).toBe(apelidoKey("Raissa"));
    expect(apelidoKey("Marcella")).toBe(apelidoKey("marcella"));
    expect(apelidoKey("  JPPK  ")).toBe(apelidoKey("JPPK"));
    expect(apelidoKey("Helô")).toBe("helo");
  });
});

describe("canonicalApelido — resolve para a grafia cadastrada", () => {
  const parts = [part("Raissa"), part("marcella"), part("JPPK")];

  it("devolve a grafia canônica do participante (acento/maiúscula)", () => {
    expect(canonicalApelido("Raíssa", parts)).toBe("Raissa");
    expect(canonicalApelido("Marcella", parts)).toBe("marcella");
    expect(canonicalApelido(" jppk ", parts)).toBe("JPPK");
  });

  it("sem correspondência, devolve o apelido só com trim", () => {
    expect(canonicalApelido("  Novato  ", parts)).toBe("Novato");
  });
});

describe("apelidoEmUso — impede apelido duplicado entre grupos (#49)", () => {
  const lista = [
    { id: "1", apelido: "Ney" },     // grupo pk
    { id: "2", apelido: "Cissa" },   // grupo cissa
  ];

  it("detecta duplicata normalizada em qualquer grupo", () => {
    expect(apelidoEmUso("ney", lista)).toBe(true);     // mesmo nome, caixa diferente
    expect(apelidoEmUso("Císsa", lista)).toBe(true);   // outro grupo + acento
    expect(apelidoEmUso("Novato", lista)).toBe(false);
  });

  it("ignora o próprio participante na edição", () => {
    expect(apelidoEmUso("Ney", lista, "1")).toBe(false); // é ele mesmo
    expect(apelidoEmUso("Ney", lista, "2")).toBe(true);  // colide com outro id
  });
});
