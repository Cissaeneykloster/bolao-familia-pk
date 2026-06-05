import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBolao } from "@/lib/store";
import { SorteioDoDia } from "@/components/desafios/SorteioDoDia";
import { todayStr } from "@/lib/daily";
import { ToastProvider } from "@/components/shell/Toast";
import { ConfettiProvider } from "@/components/shell/ConfettiCanvas";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ConfettiProvider>
      <ToastProvider>{children}</ToastProvider>
    </ConfettiProvider>
  );
}

// Mocks de canvas / Image para jsdom
beforeEach(() => {
  vi.useFakeTimers();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(), clearRect: vi.fn(), fillRect: vi.fn(),
    save: vi.fn(), restore: vi.fn(), translate: vi.fn(),
    rotate: vi.fn(), beginPath: vi.fn(), fill: vi.fn(),
  })) as any;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/jpeg;base64,xxx");
  Object.defineProperty(global, "Image", {
    writable: true,
    value: class {
      onload: (() => void) | null = null;
      width = 100; height = 80;
      set src(_v: string) { this.onload?.(); }
    },
  });
  useBolao.setState({
    draw: null,
    desafios: {} as Record<string, true>,
    evidence: {},
    comboBank: 0,
    drawComboClaimed: false,
    penalty: 0,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ── Estado 1: sem sorteio ─────────────────────────────────────────
describe("SorteioDoDia — sem sorteio", () => {
  it("mostra o botão de sortear e os stakes", () => {
    vi.useRealTimers(); // não precisa de fake timer aqui
    render(<Wrapper><SorteioDoDia /></Wrapper>);
    expect(screen.getByRole("button", { name: /sortear desafios de hoje/i })).toBeInTheDocument();
    expect(screen.getByText(/±5/)).toBeInTheDocument();
  });
});

// ── Sorteio ───────────────────────────────────────────────────────
describe("SorteioDoDia — sortear", () => {
  it("após sortear grava draw com 4 áreas", async () => {
    render(<Wrapper><SorteioDoDia /></Wrapper>);

    // Clique sem userEvent (evita conflito com fake timers)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sortear desafios de hoje/i }));
    });

    // Avança todos os timers (setIntervals + setTimeouts da animação)
    await act(async () => {
      vi.runAllTimers();
    });

    const draw = useBolao.getState().draw;
    expect(draw).not.toBeNull();
    expect(draw!.date).toBe(todayStr());
    expect(Object.keys(draw!.picks)).toHaveLength(4);
  }, 10_000);
});

// ── Estado 3: sorteio ativo ───────────────────────────────────────
describe("SorteioDoDia — estado ativo", () => {
  const activeDraw = {
    date: todayStr(),
    picks: { quarto: 0, servico: 0, intelectual: 0, saude: 0 },
  };

  beforeEach(() => {
    useBolao.setState({ draw: activeDraw });
  });

  it("mostra os botões 'Novo sorteio' e 'Encerrar o dia'", () => {
    vi.useRealTimers();
    render(<Wrapper><SorteioDoDia /></Wrapper>);
    expect(screen.getByRole("button", { name: /novo sorteio/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /encerrar o dia/i })).toBeInTheDocument();
  });

  it("mostra os 4 desafios sorteados (linha por área)", () => {
    vi.useRealTimers();
    render(<Wrapper><SorteioDoDia /></Wrapper>);
    // Cada área tem um botão de evidência (📸 Evidência ou ✅ Feito)
    const btns = screen.getAllByRole("button", { name: /evidência|foto|feito/i });
    expect(btns.length).toBeGreaterThanOrEqual(4);
  });

  it("progresso inicia em 0/4", () => {
    vi.useRealTimers();
    render(<Wrapper><SorteioDoDia /></Wrapper>);
    expect(screen.getByText("0/4")).toBeInTheDocument();
  });

  it("encerrar o dia sem evidências aplica penalidade de -15 e limpa o draw", async () => {
    render(<Wrapper><SorteioDoDia /></Wrapper>);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /encerrar o dia/i }));
    });

    expect(useBolao.getState().penalty).toBe(-15);
    expect(useBolao.getState().draw).toBeNull();
  }, 10_000);
});

// ── Combo +10 ─────────────────────────────────────────────────────
describe("Combo (funções puras via store)", () => {
  it("claimCombo soma +10 ao comboBank e marca claimed", () => {
    vi.useRealTimers();
    useBolao.getState().claimCombo();
    expect(useBolao.getState().comboBank).toBe(10);
    expect(useBolao.getState().drawComboClaimed).toBe(true);
  });

  it("shouldClaimCombo retorna true em 4/4 não reivindicado", async () => {
    const { shouldClaimCombo } = await import("@/lib/daily");
    expect(shouldClaimCombo(4, false)).toBe(true);
    expect(shouldClaimCombo(4, true)).toBe(false);
    expect(shouldClaimCombo(3, false)).toBe(false);
  });

  it("closeDayResult com 0 feitas retorna lost:15, missed:4", async () => {
    vi.useRealTimers();
    const { closeDayResult, todayStr: today } = await import("@/lib/daily");
    const { DESAFIO_CATS, DAILY_AREAS } = await import("@/lib/mock-data");
    const draw = { date: today(), picks: { quarto: 0, servico: 0, intelectual: 0, saude: 0 } };
    const r = closeDayResult(draw, {}, DAILY_AREAS, DESAFIO_CATS);
    expect(r).toEqual({ lost: 15, missed: 4 });
  });

  it("closeDayResult com 4 feitas retorna lost:0", async () => {
    vi.useRealTimers();
    const { closeDayResult, todayStr: today } = await import("@/lib/daily");
    const { DESAFIO_CATS, DAILY_AREAS } = await import("@/lib/mock-data");
    const draw = { date: today(), picks: { quarto: 0, servico: 0, intelectual: 0, saude: 0 } };
    const done = { "quarto-0": true, "servico-0": true, "intelectual-0": true, "saude-0": true } as Record<string, true>;
    expect(closeDayResult(draw, done, DAILY_AREAS, DESAFIO_CATS)).toEqual({ lost: 0, missed: 0 });
  });
});

// ── Evidência: upload ────────────────────────────────────────────
describe("Evidência — upload", () => {
  const activeDraw = {
    date: todayStr(),
    picks: { quarto: 0, servico: 0, intelectual: 0, saude: 0 },
  };

  beforeEach(() => {
    useBolao.setState({ draw: activeDraw });
  });

  it("enviar foto marca o desafio e guarda a miniatura", async () => {
    vi.useRealTimers();
    render(<Wrapper><SorteioDoDia /></Wrapper>);

    // Busca o input file diretamente (display:none, mas existe no DOM)
    const inputs = document.querySelectorAll<HTMLInputElement>("input[type='file']");
    expect(inputs.length).toBeGreaterThan(0);

    const file = new File(["x"], "foto.jpg", { type: "image/jpeg" });

    await act(async () => {
      Object.defineProperty(inputs[0], "files", { value: [file], configurable: true });
      fireEvent.change(inputs[0]);
    });

    // Espera a promise de resizeImage resolver (Image.onload é síncrono no mock)
    await act(async () => { await Promise.resolve(); });

    expect(useBolao.getState().desafios["quarto-0"]).toBe(true);
    expect(useBolao.getState().evidence["quarto-0"]).toMatch(/^data:image/);
  });

  it("se setEvidence lançar, salva só a conclusão (sem foto) e não quebra", async () => {
    vi.useRealTimers();

    // Mocka setEvidence para simular quota estourada
    const originalSetEvidence = useBolao.getState().setEvidence;
    useBolao.setState({
      setEvidence: () => { throw new DOMException("QuotaExceededError"); },
    });

    render(<Wrapper><SorteioDoDia /></Wrapper>);

    const inputs = document.querySelectorAll<HTMLInputElement>("input[type='file']");
    const file = new File(["x"], "f.jpg", { type: "image/jpeg" });

    await act(async () => {
      Object.defineProperty(inputs[0], "files", { value: [file], configurable: true });
      fireEvent.change(inputs[0]);
    });
    await act(async () => { await Promise.resolve(); });

    // Desafio marcado mesmo sem foto
    expect(useBolao.getState().desafios["quarto-0"]).toBe(true);
    // Foto não foi salva (setEvidence lançou)
    expect(useBolao.getState().evidence["quarto-0"]).toBeUndefined();

    // Restaura
    useBolao.setState({ setEvidence: originalSetEvidence });
  });
});
