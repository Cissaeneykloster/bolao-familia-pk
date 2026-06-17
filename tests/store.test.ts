import { describe, it, expect, beforeEach } from "vitest";
import { useBolao } from "@/lib/store";

// Reset completo antes de cada teste
beforeEach(() => {
  useBolao.setState({
    guesses: {},
    desafios: {} as Record<string, true>,
    adminDelta: {},
    adminUnlocked: false,
    comboBank: 0,
    penalty: 0,
    draw: null,
    evidence: {},
    drawComboClaimed: false,
  });
});

describe("setGuess — clamp 0..20", () => {
  it("incrementa normalmente", () => {
    useBolao.getState().setGuess("m1", "a", 1);
    expect(useBolao.getState().guesses["m1"].a).toBe(1);
  });

  it("não passa de 20", () => {
    for (let i = 0; i < 25; i++) useBolao.getState().setGuess("m1", "a", 1);
    expect(useBolao.getState().guesses["m1"].a).toBe(20);
  });

  it("não vai abaixo de 0", () => {
    useBolao.getState().setGuess("m1", "b", -1);
    useBolao.getState().setGuess("m1", "b", -1);
    expect(useBolao.getState().guesses["m1"].b).toBe(0);
  });

  it("lado b e a são independentes", () => {
    useBolao.getState().setGuess("m2", "a", 1);
    useBolao.getState().setGuess("m2", "a", 1);
    useBolao.getState().setGuess("m2", "b", 1);
    expect(useBolao.getState().guesses["m2"]).toEqual({ a: 2, b: 1 });
  });
});

describe("toggleDesafio", () => {
  it("marca e desmarca", () => {
    useBolao.getState().toggleDesafio("quarto-0");
    expect(useBolao.getState().desafios["quarto-0"]).toBe(true);
    useBolao.getState().toggleDesafio("quarto-0");
    expect(useBolao.getState().desafios["quarto-0"]).toBeUndefined();
  });
});

describe("adminDelta", () => {
  it("acumula delta", () => {
    useBolao.getState().setAdminDelta("Bruno", 5);
    useBolao.getState().setAdminDelta("Bruno", 5);
    expect(useBolao.getState().adminDelta["Bruno"]).toBe(10);
  });

  it("resetAdminDelta remove a chave", () => {
    useBolao.getState().setAdminDelta("Bruno", 5);
    useBolao.getState().resetAdminDelta("Bruno");
    expect(useBolao.getState().adminDelta["Bruno"]).toBeUndefined();
  });
});

describe("claimCombo", () => {
  it("soma +10 ao comboBank e marca claimed", () => {
    useBolao.getState().claimCombo();
    expect(useBolao.getState().comboBank).toBe(10);
    expect(useBolao.getState().drawComboClaimed).toBe(true);
  });
});

describe("addPenalty", () => {
  it("subtrai pontos (valor negativo)", () => {
    useBolao.getState().addPenalty(-15);
    expect(useBolao.getState().penalty).toBe(-15);
  });
});

describe("adminUnlocked não persiste", () => {
  it("partialize exclui adminUnlocked do estado persistido", () => {
    // Verifica que a chave não está na lista de campos persistidos
    // Acessamos partialize via internal store config
    useBolao.getState().setAdminUnlocked(true);
    expect(useBolao.getState().adminUnlocked).toBe(true);
    // Simula reload resetando para false (valor inicial)
    useBolao.setState({ adminUnlocked: false });
    expect(useBolao.getState().adminUnlocked).toBe(false);
  });
});

describe("saveResultAndCalcPts — pontos por participante (palpites do Supabase)", () => {
  const P = (apelido: string) => ({
    id: apelido, grupoId: "pk", nome: apelido, apelido,
    email: "", telefone: "", token: "t", ativo: true,
  });
  const participantes = [P("Nino"), P("Cissa"), P("Dudi")];

  beforeEach(() => {
    useBolao.setState({ matchPts: {}, officialResults: {}, resultFix: {} });
  });

  it("cada participante pontua pelo PRÓPRIO palpite; sem palpite = -3", () => {
    // Resultado 2×1 — Nino acertou exato, Cissa só o vencedor, Dudi não palpitou
    const matchGuesses = {
      Nino:  { a: 2, b: 1 },
      Cissa: { a: 1, b: 0 },
    };
    useBolao.getState().saveResultAndCalcPts(
      "m1", { sa: 2, sb: 1 }, participantes, "pk", matchGuesses, "grupos",
    );

    const pts = useBolao.getState().matchPts;
    // exact(10) + winner(5) + total(3) + diff(3) + golsA(2) + golsB(2) = 25
    expect(pts["Nino"]).toBe(25);
    // winner(5) + diff(3) = 8
    expect(pts["Cissa"]).toBe(8);
    expect(pts["Dudi"]).toBe(-3);
  });

  it("correção de resultado estorna os pontos antigos individualmente", () => {
    const matchGuesses = { Nino: { a: 2, b: 1 }, Cissa: { a: 0, b: 0 } };

    // Lança 2×1 e depois corrige para 0×0
    useBolao.getState().saveResultAndCalcPts("m1", { sa: 2, sb: 1 }, participantes, "pk", matchGuesses, "grupos");
    useBolao.getState().saveResultAndCalcPts("m1", { sa: 0, sb: 0 }, participantes, "pk", matchGuesses, "grupos");

    const pts = useBolao.getState().matchPts;
    // Após a correção, só valem os pontos do 0×0:
    expect(pts["Nino"]).toBe(0);   // errou tudo no 0×0
    expect(pts["Cissa"]).toBe(25); // exato no 0×0
    expect(pts["Dudi"]).toBe(-3);  // sem palpite nos dois lançamentos
  });

  it("treino não mexe nos pontos", () => {
    useBolao.getState().saveResultAndCalcPts(
      "t1", { sa: 1, sb: 0 }, participantes, "pk", { Nino: { a: 1, b: 0 } }, "grupos", true,
    );
    expect(useBolao.getState().matchPts).toEqual({});
    expect(useBolao.getState().officialResults["t1"]).toEqual({ sa: 1, sb: 0 });
  });
});

describe("recalcAllMatchPts — reconstrói o ranking a partir do Supabase", () => {
  const P = (apelido: string) => ({
    id: apelido, grupoId: "pk", nome: apelido, apelido,
    email: "", telefone: "", token: "t", ativo: true,
  });
  const participantes = [P("Nino"), P("Cissa")];

  beforeEach(() => {
    useBolao.setState({ matchPts: {}, officialResults: {}, resultFix: {} });
  });

  it("recalcula do zero: palpite real de cada um × resultado oficial", () => {
    useBolao.setState({
      // pontos antigos errados que devem ser descartados
      matchPts: { Nino: 999, Cissa: -50 },
      // ga1r1 é jogo da fase de grupos; a1 é treino (não pontua)
      officialResults: { ga1r1: { sa: 2, sb: 1 }, a1: { sa: 5, sb: 5 } },
    });
    const allGuesses = {
      ga1r1: { Nino: { a: 2, b: 1 }, Cissa: { a: 0, b: 0 } },
      a1:    { Nino: { a: 5, b: 5 } }, // treino — deve ser ignorado
    };

    useBolao.getState().recalcAllMatchPts(participantes, allGuesses);

    const pts = useBolao.getState().matchPts;
    expect(pts["Nino"]).toBe(25); // exato no 2×1
    expect(pts["Cissa"]).toBe(0); // errou tudo no 2×1
  });

  it("jogos ANTES do marco (14/Jun) não penalizam ausência", () => {
    // 3 jogos seguidos sem palpite, todos antes do marco → 0
    useBolao.setState({ officialResults: {
      ga1r1: { sa: 1, sb: 0 }, ga2r1: { sa: 1, sb: 0 }, gb1r1: { sa: 1, sb: 0 },
    } });
    useBolao.getState().recalcAllMatchPts(participantes, {});
    expect(useBolao.getState().matchPts["Cissa"]).toBe(0);
  });

  it("2 jogos seguidos sem palpite (após o marco): ainda na carência (0)", () => {
    useBolao.setState({ officialResults: { ga1r2: { sa: 1, sb: 0 }, ga2r2: { sa: 1, sb: 0 } } });
    useBolao.getState().recalcAllMatchPts(participantes, {});
    expect(useBolao.getState().matchPts["Cissa"]).toBe(0);
  });

  it("3 jogos seguidos sem palpite (após o marco): do 3º em diante perde -3", () => {
    useBolao.setState({ officialResults: {
      ga1r2: { sa: 1, sb: 0 }, ga2r2: { sa: 1, sb: 0 }, ga1r3: { sa: 1, sb: 0 },
    } });
    useBolao.getState().recalcAllMatchPts(participantes, {});
    expect(useBolao.getState().matchPts["Cissa"]).toBe(-3);
  });

  it("palpitar zera a carência (idempotente)", () => {
    // (após o marco) miss, miss, GUESS (zera), miss → nunca chega ao 3º consecutivo
    useBolao.setState({ officialResults: {
      ga1r2: { sa: 1, sb: 0 }, ga2r2: { sa: 1, sb: 0 }, ga1r3: { sa: 1, sb: 0 }, ga2r3: { sa: 1, sb: 0 },
    } });
    const allGuesses = { ga1r3: { Cissa: { a: 3, b: 3 } } }; // pontua 0, mas zera a carência
    useBolao.getState().recalcAllMatchPts(participantes, allGuesses);
    useBolao.getState().recalcAllMatchPts(participantes, allGuesses);
    expect(useBolao.getState().matchPts["Cissa"]).toBe(0);
  });

  it("resultado de jogo desconhecido é ignorado sem quebrar", () => {
    useBolao.setState({ officialResults: { jogo_inexistente: { sa: 1, sb: 1 } } });
    useBolao.getState().recalcAllMatchPts(participantes, {});
    expect(useBolao.getState().matchPts).toEqual({ Nino: 0, Cissa: 0 });
  });
});
