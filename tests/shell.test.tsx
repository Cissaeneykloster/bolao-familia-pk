import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBolao } from "@/lib/store";
import { TabBar } from "@/components/shell/TabBar";
import { Header } from "@/components/shell/Header";
import { setViewport } from "@/tests/setup";

beforeEach(() => {
  useBolao.setState({
    current: "ranking",
    desafios: {} as Record<string, true>,
    comboBank: 0,
    penalty: 0,
    adminUnlocked: false,
    participantes: [],
  });
});

// ── TabBar ────────────────────────────────────────────────────────
describe("TabBar", () => {
  it("renderiza as 7 abas sem a aba Admin", () => {
    render(<TabBar />);
    ["Ranking", "Jogos", "Palpites", "Grupos", "Desafios", "Feed", "Regras"].forEach((label) => {
      expect(screen.getByRole("button", { name: new RegExp(label, "i") })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /gerência|admin/i })).not.toBeInTheDocument();
  });

  it("badge de Palpites conta jogos abertos sem palpite", () => {
    const future = Date.now() + 7 * 24 * 3600_000; // não travado pelo kickoff
    useBolao.setState({
      matches: [
        { id: "m1", phase: "grupos", group: "A", status: "upcoming", a: { name: "X", flag: "" }, b: { name: "Y", flag: "" }, kickoff: future },
        { id: "m2", phase: "grupos", group: "A", status: "upcoming", a: { name: "X", flag: "" }, b: { name: "Y", flag: "" }, kickoff: future },
      ],
      guesses: {},
      officialResults: {},
    });
    render(<TabBar />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("badge de Palpites some quando todos os jogos abertos já têm palpite", () => {
    const future = Date.now() + 7 * 24 * 3600_000;
    useBolao.setState({
      matches: [
        { id: "m1", phase: "grupos", group: "A", status: "upcoming", a: { name: "X", flag: "" }, b: { name: "Y", flag: "" }, kickoff: future },
      ],
      guesses: { m1: { a: 1, b: 0 } },
      officialResults: {},
    });
    render(<TabBar />);
    expect(screen.queryByLabelText(/palpites pendentes/i)).not.toBeInTheDocument();
  });

  it("clicar numa aba muda a screen no store", async () => {
    const user = userEvent.setup();
    render(<TabBar />);
    await user.click(screen.getByRole("button", { name: /jogos/i }));
    expect(useBolao.getState().current).toBe("jogos");
  });

  it("clicar em Feed muda para feed", async () => {
    const user = userEvent.setup();
    render(<TabBar />);
    await user.click(screen.getByRole("button", { name: /feed/i }));
    expect(useBolao.getState().current).toBe("feed");
  });
});

// ── Header ────────────────────────────────────────────────────────
describe("Header", () => {
  it("sem grupo definido mostra 'Sem grupo'", () => {
    useBolao.setState({ currentGrupoId: null });
    render(<Header />);
    expect(screen.getByText(/sem grupo/i)).toBeInTheDocument();
  });

  it("com apelido definido mostra o nome do usuário", () => {
    useBolao.setState({
      currentGrupoId: "pk",
      currentUserApelido: "Ney",
    });
    render(<Header />);
    expect(screen.getByText("Ney")).toBeInTheDocument();
  });

  it("renderiza o header sem erros", () => {
    render(<Header />);
    // O badge AO VIVO depende dos jogos mockados; apenas verifica que renderiza
    expect(screen.getByText("BOLÃO")).toBeInTheDocument();
  });
});

// ── Responsividade ────────────────────────────────────────────────
describe("Responsividade via matchMedia mock", () => {
  it("TabBar monta no mobile (375px)", () => {
    setViewport(false);
    render(<TabBar />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("TabBar monta no desktop (≥860px)", () => {
    setViewport(true);
    render(<TabBar />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
