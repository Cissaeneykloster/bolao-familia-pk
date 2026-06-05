import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useBolao } from "@/lib/store";
import { JogoCard } from "@/components/jogos/JogoCard";
import type { Match } from "@/lib/types";

const finished: Match = {
  id: "m1", phase: "grupos", group: "Grupo A",
  a: { name: "Brasil", flag: "🇧🇷" },
  b: { name: "Argentina", flag: "🇦🇷" },
  status: "finished", sa: 2, sb: 1,
  guess: { a: 2, b: 1 },
};

const live: Match = {
  ...finished, id: "m3", status: "live", minute: 47, sa: 1, sb: 1,
};

const upcoming: Match = {
  id: "m4", phase: "grupos", group: "Grupo D",
  a: { name: "Alemanha", flag: "🇩🇪" },
  b: { name: "Portugal", flag: "🇵🇹" },
  status: "upcoming", kickoff: Date.now() + 3_600_000, label: "amanhã 15h",
};

beforeEach(() => {
  useBolao.setState({ resultFix: {}, guesses: {}, card: "a" });
});

describe("JogoCard", () => {
  it("finished mostra o placar e badge ENCERRADO", () => {
    render(<JogoCard match={finished} />);
    expect(screen.getByText(/encerrado/i)).toBeInTheDocument();
    // placar 2 aparece (pode aparecer mais de uma vez)
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("live mostra o minuto e badge AO VIVO", () => {
    render(<JogoCard match={live} />);
    expect(screen.getByText(/ao vivo/i)).toBeInTheDocument();
    expect(screen.getByText(/47/)).toBeInTheDocument();
  });

  it("upcoming mostra botão Apostar agora", async () => {
    const user = userEvent.setup();
    render(<JogoCard match={upcoming} />);
    expect(screen.getByRole("button", { name: /apostar agora/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /apostar agora/i }));
    expect(useBolao.getState().current).toBe("palpites");
  });

  it("resultFix muda o placar exibido (5×0)", () => {
    useBolao.setState({ resultFix: { m1: { sa: 5, sb: 0 } } });
    render(<JogoCard match={finished} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("variação compacta (card=b) monta sem erro", () => {
    useBolao.setState({ card: "b" });
    render(<JogoCard match={finished} />);
    expect(screen.getByText(/encerrado/i)).toBeInTheDocument();
  });

  it("variação estádio (card=c) monta sem erro", () => {
    useBolao.setState({ card: "c" });
    render(<JogoCard match={live} />);
    expect(screen.getByText(/ao vivo/i)).toBeInTheDocument();
  });
});
