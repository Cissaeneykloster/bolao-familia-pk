import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { useBolao } from "@/lib/store";
import { SorteioDoDia } from "@/components/desafios/SorteioDoDia";
import { todayVancouver } from "@/lib/daily";
import { ToastProvider } from "@/components/shell/Toast";
import { ConfettiProvider } from "@/components/shell/ConfettiCanvas";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ConfettiProvider>
      <ToastProvider>{children}</ToastProvider>
    </ConfettiProvider>
  );
}

// Mock canvas
beforeEach(() => {
  vi.useFakeTimers();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(), clearRect: vi.fn(), fillRect: vi.fn(),
    save: vi.fn(), restore: vi.fn(), translate: vi.fn(),
    rotate: vi.fn(), beginPath: vi.fn(), fill: vi.fn(),
  })) as any;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/jpeg;base64,xxx");
  useBolao.setState({
    draw: null,
    desafios: {} as Record<string, true>,
    evidence: {},
    comboBank: 0,
    drawComboClaimed: false,
    penalty: 0,
    challengeHistory: [],
    totalChallengePoints: 0,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ── Estado sem sorteio ─────────────────────────────────────────────
describe("SorteioDoDia — sem sorteio", () => {
  it("mostra o botão de sortear (janela aberta = 12h UTC)", () => {
    // 12:00 UTC = dentro da janela Vancouver (abre 08:00 UTC)
    vi.setSystemTime(new Date("2026-06-11T12:00:00Z"));
    render(<Wrapper><SorteioDoDia /></Wrapper>);
    expect(screen.getByRole("button", { name: /sortear desafio de hoje/i })).toBeInTheDocument();
  });

  it("mostra pontos acumulados zerados", () => {
    vi.setSystemTime(new Date("2026-06-11T12:00:00Z"));
    render(<Wrapper><SorteioDoDia /></Wrapper>);
    expect(screen.getByText("0 pts")).toBeInTheDocument();
  });
});

// ── Sortear e marcar ───────────────────────────────────────────────
describe("SorteioDoDia — sortear", () => {
  it("após clicar sortear, draw tem dateVancouver de hoje", async () => {
    vi.setSystemTime(new Date("2026-06-11T12:00:00Z"));
    render(<Wrapper><SorteioDoDia /></Wrapper>);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sortear desafio de hoje/i }));
    });
    const draw = useBolao.getState().draw;
    expect(draw).not.toBeNull();
    expect(draw!.dateVancouver).toBe(todayVancouver());
  });

  it("markChallengeDone atualiza o draw", () => {
    useBolao.setState({
      draw: {
        dateVancouver: todayVancouver(),
        area: "quarto",
        itemIdx: 0,
        done: false,
      },
    });
    useBolao.getState().markChallengeDone(true);
    expect(useBolao.getState().draw!.done).toBe(true);
  });
});

// ── resolveChallenge ──────────────────────────────────────────────
describe("resolveChallenge", () => {
  it("adiciona ao histórico e soma os pontos", () => {
    useBolao.getState().resolveChallenge({
      dateVancouver: "2026-06-11",
      area: "servico",
      itemIdx: 0,
      code: "3.1",
      descricao: "Ajudar alguém",
      done: true,
      pts: 5,
    });
    expect(useBolao.getState().totalChallengePoints).toBe(5);
    expect(useBolao.getState().challengeHistory).toHaveLength(1);
    expect(useBolao.getState().draw).toBeNull();
  });

  it("pontos negativos diminuem o total", () => {
    useBolao.getState().resolveChallenge({
      dateVancouver: "2026-06-11",
      area: "quarto",
      itemIdx: 0,
      code: "1.1",
      descricao: "Arrumar a cama",
      done: false,
      pts: -3,
    });
    expect(useBolao.getState().totalChallengePoints).toBe(-3);
  });
});

// ── Estado com sorteio ativo ──────────────────────────────────────
describe("SorteioDoDia — sorteio ativo (janela aberta)", () => {
  beforeEach(() => {
    // Janela aberta = 12:00 UTC = dentro da janela Vancouver
    vi.setSystemTime(new Date("2026-06-11T12:00:00Z"));
    useBolao.setState({
      draw: {
        dateVancouver: "2026-06-11",
        area: "quarto",
        itemIdx: 0,
        done: false,
      },
    });
  });

  it("mostra botão 'Marcar como feito' e 'Marcar como não feito'", () => {
    render(<Wrapper><SorteioDoDia /></Wrapper>);
    expect(screen.getByRole("button", { name: /marcar como feito/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /marcar como não feito/i })).toBeInTheDocument();
  });

  it("mostra o código 1.1 para quarto item 0", () => {
    render(<Wrapper><SorteioDoDia /></Wrapper>);
    expect(screen.getByText("1.1")).toBeInTheDocument();
  });

  it("clicar 'Marcar como feito' marca o draw como done=true", async () => {
    render(<Wrapper><SorteioDoDia /></Wrapper>);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /marcar como feito/i }));
    });
    expect(useBolao.getState().draw!.done).toBe(true);
  });
});
