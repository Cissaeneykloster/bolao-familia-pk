import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useBolao } from "@/lib/store";
import { SorteioDoDia } from "@/components/desafios/SorteioDoDia";
import { todayBrasilia } from "@/lib/daily";
import { ToastProvider } from "@/components/shell/Toast";
import { ConfettiProvider } from "@/components/shell/ConfettiCanvas";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ConfettiProvider>
      <ToastProvider>{children}</ToastProvider>
    </ConfettiProvider>
  );
}

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(), clearRect: vi.fn(), fillRect: vi.fn(),
    save: vi.fn(), restore: vi.fn(), translate: vi.fn(),
    rotate: vi.fn(), beginPath: vi.fn(), fill: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any;
  useBolao.setState({
    dailyDraw: null,
    myChallengeDone: null,
    challengePts: {},
    currentUserApelido: "Ney",
    currentGrupoId: "pk",
    desafioCatsByGroup: {},
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SorteioDoDia — sorteio do sistema", () => {
  it("sem sorteio do dia: mostra o cartão 'Desafio do Dia'", () => {
    useBolao.setState({ dailyDraw: null });
    render(<Wrapper><SorteioDoDia /></Wrapper>);
    expect(screen.getByText(/Desafio do Dia/i)).toBeInTheDocument();
  });

  it("com sorteio do dia: mostra a descrição e os botões Fiz / Não fiz", () => {
    useBolao.setState({
      dailyDraw: { area: "quarto", itemIdx: 0, descricao: "Arrumar a cama antes das 9h", pts: 3, dateBrt: todayBrasilia() },
    });
    render(<Wrapper><SorteioDoDia /></Wrapper>);
    expect(screen.getByText(/Arrumar a cama antes das 9h/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /marcar como feito/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /marcar como não feito/i })).toBeInTheDocument();
  });

  it("exibe os pontos de desafios do usuário (entram no ranking)", () => {
    useBolao.setState({ challengePts: { Ney: 9 }, currentUserApelido: "Ney" });
    render(<Wrapper><SorteioDoDia /></Wrapper>);
    expect(screen.getByText(/\+9 pts/)).toBeInTheDocument();
  });

  it("sorteio de um dia anterior não aparece como o de hoje", () => {
    useBolao.setState({
      dailyDraw: { area: "quarto", itemIdx: 0, descricao: "Desafio velho", pts: 3, dateBrt: "2020-01-01" },
    });
    render(<Wrapper><SorteioDoDia /></Wrapper>);
    expect(screen.queryByText(/Desafio velho/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Desafio do Dia/i)).toBeInTheDocument();
  });
});
