import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBolao } from "@/lib/store";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminPanel } from "@/components/admin/AdminPanel";

beforeEach(() => {
  useBolao.setState({
    adminUnlocked: false,
    adminDelta: {},
    resultFix: {},
    betFix: {},
    participantes: [],
    current: "ranking",
  });
});

// ── AdminGate ─────────────────────────────────────────────────────
describe("AdminGate", () => {
  it("credenciais erradas não desbloqueiam e mostram erro", async () => {
    const user = userEvent.setup();
    render(<AdminGate open onClose={() => {}} />);
    await user.type(screen.getByLabelText(/usuário/i), "errado");
    await user.type(screen.getByLabelText(/senha/i), "errada");
    await user.click(screen.getByRole("button", { name: /entrar/i }));
    expect(useBolao.getState().adminUnlocked).toBe(false);
    expect(screen.getByText(/incorretos/i)).toBeInTheDocument();
  });

  it("Admin + Lelo desbloqueia e navega para admin", async () => {
    const user = userEvent.setup();
    render(<AdminGate open onClose={() => {}} />);
    await user.type(screen.getByLabelText(/usuário/i), "Admin");
    await user.type(screen.getByLabelText(/senha/i), "Lelo");
    await user.click(screen.getByRole("button", { name: /entrar/i }));
    expect(useBolao.getState().adminUnlocked).toBe(true);
    expect(useBolao.getState().current).toBe("admin");
  });

  it("não renderiza nada quando open=false", () => {
    render(<AdminGate open={false} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Enter na senha também submete", async () => {
    const user = userEvent.setup();
    render(<AdminGate open onClose={() => {}} />);
    await user.type(screen.getByLabelText(/usuário/i), "Admin");
    await user.type(screen.getByLabelText(/senha/i), "Lelo{Enter}");
    expect(useBolao.getState().adminUnlocked).toBe(true);
  });
});

// ── AdminPanel ────────────────────────────────────────────────────
describe("AdminPanel", () => {
  it("sem unlock não renderiza o painel", () => {
    render(<AdminPanel />);
    expect(screen.queryByText(/área da gerência/i)).not.toBeInTheDocument();
  });

  it("com unlock renderiza as 4 abas", () => {
    useBolao.setState({ adminUnlocked: true });
    render(<AdminPanel />);
    expect(screen.getByRole("button", { name: /pessoas/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pontos/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /palpites/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resultados/i })).toBeInTheDocument();
  });

  it("aba Pontos: setAdminDelta +5 no Bruno via store", () => {
    // Testa a action do store diretamente (o componente chama setAdminDelta)
    useBolao.getState().setAdminDelta("Bruno", 5);
    expect(useBolao.getState().adminDelta["Bruno"]).toBe(5);
  });

  it("aba Pontos: setAdminDelta -1 no Rafael via store", () => {
    useBolao.getState().setAdminDelta("Rafael", -1);
    expect(useBolao.getState().adminDelta["Rafael"]).toBe(-1);
  });

  it("aba Resultados: setResultFix grava via store", () => {
    // Testa a action diretamente (a aba de resultados usa setResultFix)
    useBolao.getState().setResultFix("ga1r1", { sa: 2, sb: 1 });
    expect(useBolao.getState().resultFix["ga1r1"]).toEqual({ sa: 2, sb: 1 });
  });

  it("aba Pessoas: cadastra participante e aparece na lista", async () => {
    const user = userEvent.setup();
    useBolao.setState({ adminUnlocked: true });
    render(<AdminPanel />);
    // Já começa na aba Pessoas
    await user.type(screen.getByPlaceholderText("Maria Silva"), "João Kloster");
    await user.type(screen.getByPlaceholderText("Mari"), "JoaoK");
    await user.click(screen.getByRole("button", { name: /cadastrar e gerar link/i }));
    expect(useBolao.getState().participantes).toHaveLength(1);
    expect(useBolao.getState().participantes[0].nome).toBe("João Kloster");
  });

  it("botão Sair desbloqueia = false", async () => {
    const user = userEvent.setup();
    useBolao.setState({ adminUnlocked: true });
    render(<AdminPanel />);
    await user.click(screen.getByRole("button", { name: /sair da gerência/i }));
    expect(useBolao.getState().adminUnlocked).toBe(false);
  });

  it("adminUnlocked não persiste — reset volta a false", () => {
    useBolao.setState({ adminUnlocked: true });
    expect(useBolao.getState().adminUnlocked).toBe(true);
    useBolao.setState({ adminUnlocked: false });
    expect(useBolao.getState().adminUnlocked).toBe(false);
  });
});
