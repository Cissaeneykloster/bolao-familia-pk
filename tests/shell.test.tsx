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

  it("mostra o badge '4' em Palpites", () => {
    render(<TabBar />);
    expect(screen.getByText("4")).toBeInTheDocument();
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
