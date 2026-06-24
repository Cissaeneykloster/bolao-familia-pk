import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Supabase mockado: o upsert do palpite "confirma" sem rede (error: null)
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      upsert: () => Promise.resolve({ data: null, error: null }),
    }),
  },
}));

import { useBolao } from "@/lib/store";
import { PlacarInput } from "@/components/palpites/PlacarInput";
import { Breakdown } from "@/components/palpites/Breakdown";
import { breakdown } from "@/lib/scoring";
import type { Match } from "@/lib/types";

const upcoming: Match = {
  id: "m4", phase: "grupos", group: "Grupo D",
  a: { name: "Alemanha", flag: "🇩🇪" },
  b: { name: "Portugal", flag: "🇵🇹" },
  status: "upcoming", kickoff: Date.now() + 3_600_000, label: "amanhã 15h",
};

beforeEach(() => {
  useBolao.setState({ guesses: {}, palpite: "a", currentUserApelido: null, participantes: [] });
});

// ── PlacarInput ───────────────────────────────────────────────────
describe("PlacarInput", () => {
  it("inicia com 0 × 0", () => {
    render(<PlacarInput match={upcoming} />);
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });

  it("botão + incrementa o valor do time A", async () => {
    const user = userEvent.setup();
    render(<PlacarInput match={upcoming} />);
    const plusBtns = screen.getAllByRole("button", { name: "+" });
    await user.click(plusBtns[0]);
    await user.click(plusBtns[0]);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("não passa de 0 para baixo", async () => {
    const user = userEvent.setup();
    render(<PlacarInput match={upcoming} />);
    const minusBtns = screen.getAllByRole("button", { name: "−" });
    await user.click(minusBtns[0]);
    await user.click(minusBtns[0]);
    // Deve continuar com 0 (clamp)
    expect(useBolao.getState().guesses["m4"]?.a ?? 0).toBe(0);
  });

  it("salvar persiste no store e confirma o salvamento", async () => {
    const user = userEvent.setup();
    render(<PlacarInput match={upcoming} />);
    const plusBtns = screen.getAllByRole("button", { name: "+" });
    await user.click(plusBtns[0]); // a = 1
    await user.click(plusBtns[1]); // b = 1
    await user.click(screen.getByRole("button", { name: /salvar palpite/i }));
    expect(useBolao.getState().guesses["m4"]).toEqual({ a: 1, b: 1 });
    // saveGuess é assíncrono — espera o status real aparecer
    expect(await screen.findByText(/salvo/i)).toBeInTheDocument();
  });

  it("sem identificação avisa que ficou só no aparelho", async () => {
    useBolao.setState({ currentUserApelido: null });
    const user = userEvent.setup();
    render(<PlacarInput match={upcoming} />);
    await user.click(screen.getAllByRole("button", { name: "+" })[0]);
    await user.click(screen.getByRole("button", { name: /salvar palpite/i }));
    expect(await screen.findByText(/só neste aparelho/i)).toBeInTheDocument();
  });

  it("identificado: confirma '✅ Salvo!' (servidor confirmou)", async () => {
    useBolao.setState({ currentUserApelido: "Nino" });
    const user = userEvent.setup();
    render(<PlacarInput match={upcoming} />);
    await user.click(screen.getAllByRole("button", { name: "+" })[0]);
    await user.click(screen.getByRole("button", { name: /salvar palpite/i }));
    expect(await screen.findByText("✅ Salvo!")).toBeInTheDocument();
  });

  it("variação vertical (palpite=b) monta sem erro", () => {
    useBolao.setState({ palpite: "b" });
    render(<PlacarInput match={upcoming} />);
    expect(screen.getByRole("button", { name: /salvar/i })).toBeInTheDocument();
  });

  it("variação mínima (palpite=c) monta sem erro", () => {
    useBolao.setState({ palpite: "c" });
    render(<PlacarInput match={upcoming} />);
    expect(screen.getByRole("button", { name: /salvar/i })).toBeInTheDocument();
  });
});

// ── Breakdown ────────────────────────────────────────────────────
describe("Breakdown", () => {
  it("placar exato mostra +25 pts", () => {
    const bd = breakdown({ sa: 2, sb: 1 }, { a: 2, b: 1 });
    render(<Breakdown actual={{ sa: 2, sb: 1 }} guess={{ a: 2, b: 1 }} />);
    expect(bd.total).toBe(25);
    expect(screen.getByText(/\+25 pts/)).toBeInTheDocument();
  });

  it("errou tudo mostra +0 pts", () => {
    render(<Breakdown actual={{ sa: 1, sb: 0 }} guess={{ a: 0, b: 3 }} />);
    expect(screen.getByText(/\+0 pts/)).toBeInTheDocument();
  });

  it("cada critério tem ✅ ou ❌", () => {
    render(<Breakdown actual={{ sa: 2, sb: 1 }} guess={{ a: 2, b: 0 }} />);
    const checks = screen.getAllByText(/[✅❌]/);
    // 6 critérios
    expect(checks.length).toBeGreaterThanOrEqual(6);
  });

  it("modo compact renderiza sem erro", () => {
    render(<Breakdown actual={{ sa: 2, sb: 1 }} guess={{ a: 2, b: 1 }} compact />);
    expect(screen.getByText(/\+25 pts/)).toBeInTheDocument();
  });

  it("total do componente bate com a função pura", () => {
    const actual = { sa: 3, sb: 1 };
    const guess = { a: 3, b: 2 };
    const expected = breakdown(actual, guess).total; // 7
    render(<Breakdown actual={actual} guess={guess} />);
    expect(screen.getByText(new RegExp(`\\+${expected} pts`))).toBeInTheDocument();
  });
});
