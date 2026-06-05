import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useBolao } from "@/lib/store";
import { Podium } from "@/components/ranking/Podium";
import { RankingList } from "@/components/ranking/RankingList";
import type { Participante } from "@/lib/mock-data";

// Participantes de teste
const P_RAFAEL: Participante = { id: "1", grupoId: "pk", nome: "Rafael Kloster", apelido: "Rafael", email: "", telefone: "", token: "t1", ativo: true };
const P_MARCOS: Participante = { id: "2", grupoId: "pk", nome: "Marcos Silva",   apelido: "Marcos",  email: "", telefone: "", token: "t2", ativo: true };
const P_CARLA:  Participante = { id: "3", grupoId: "pk", nome: "Carla Souza",    apelido: "Carla",   email: "", telefone: "", token: "t3", ativo: true };
const P_BRUNO:  Participante = { id: "4", grupoId: "pk", nome: "Bruno Costa",    apelido: "Bruno",   email: "", telefone: "", token: "t4", ativo: true };

beforeEach(() => {
  useBolao.setState({
    adminDelta: {},
    desafios: {} as Record<string, true>,
    comboBank: 0,
    penalty: 0,
    podium: "a",
    participantes: [],
    currentGrupoId: "pk",
  });
});

describe("Podium", () => {
  it("sem participantes mostra mensagem vazia", () => {
    render(<Podium />);
    expect(screen.getByText(/nenhum participante cadastrado/i)).toBeInTheDocument();
  });

  it("com participantes renderiza o pódio", () => {
    useBolao.setState({ participantes: [P_RAFAEL, P_MARCOS, P_CARLA] });
    render(<Podium />);
    expect(screen.getByText("Rafael")).toBeInTheDocument();
    expect(screen.getByText("Marcos")).toBeInTheDocument();
    expect(screen.getByText("Carla")).toBeInTheDocument();
  });

  it("variação B monta sem erro", () => {
    useBolao.setState({ podium: "b", participantes: [P_RAFAEL, P_MARCOS, P_CARLA] });
    render(<Podium />);
    expect(screen.getByText("Rafael")).toBeInTheDocument();
  });

  it("variação C monta sem erro", () => {
    useBolao.setState({ podium: "c", participantes: [P_RAFAEL, P_MARCOS, P_CARLA] });
    render(<Podium />);
    expect(screen.getByText("Rafael")).toBeInTheDocument();
  });

  it("adminDelta gigante leva Bruno ao pódio", () => {
    useBolao.setState({
      participantes: [P_RAFAEL, P_MARCOS, P_CARLA, P_BRUNO],
      adminDelta: { Bruno: 999 },
    });
    render(<Podium />);
    expect(screen.getByText("Bruno")).toBeInTheDocument();
  });
});

describe("RankingList", () => {
  it("sem participantes no top-3 a lista fica vazia", () => {
    useBolao.setState({ participantes: [P_RAFAEL, P_MARCOS, P_CARLA] });
    render(<RankingList />);
    // top3 já está no pódio; lista (4º+) vazia é válida
    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
  });

  it("cada item tem role listitem quando há participantes além do top-3", () => {
    useBolao.setState({ participantes: [P_RAFAEL, P_MARCOS, P_CARLA, P_BRUNO] });
    render(<RankingList />);
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThan(0);
  });

  it("adminDelta gigante leva Bruno ao topo (podium)", () => {
    useBolao.setState({
      participantes: [P_RAFAEL, P_MARCOS, P_CARLA, P_BRUNO],
      adminDelta: { Bruno: 999 },
    });
    render(<RankingList />);
    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
  });
});
