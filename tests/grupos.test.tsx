import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setViewport } from "@/tests/setup";
import { GrupoTabela } from "@/components/grupos/GrupoTabela";
import { GROUPS } from "@/lib/mock-data";

const grupoA = GROUPS[0];

describe("GrupoTabela", () => {
  it("renderiza o nome do grupo", () => {
    render(<GrupoTabela group={grupoA} />);
    expect(screen.getByRole("button", { name: /grupo a/i })).toBeInTheDocument();
  });

  it("times aparecem na tabela", () => {
    render(<GrupoTabela group={grupoA} />);
    // Grupo A real: México, África do Sul, Coreia do Sul, Rep. Tcheca
    expect(screen.getByText("México")).toBeInTheDocument();
    expect(screen.getByText("África do Sul")).toBeInTheDocument();
  });

  it("expande ao clicar no cabeçalho e mostra 'classificam'", async () => {
    const user = userEvent.setup();
    render(<GrupoTabela group={grupoA} />);
    const btn = screen.getByRole("button", { name: /grupo a/i });
    await user.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(/classificam/i)).toBeInTheDocument();
  });

  it("colapsa ao clicar novamente", async () => {
    const user = userEvent.setup();
    render(<GrupoTabela group={grupoA} />);
    const btn = screen.getByRole("button", { name: /grupo a/i });
    await user.click(btn); // abre
    await user.click(btn); // fecha
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  it("palpite de classificação com predResult=wait mostra 'em aberto'", async () => {
    const user = userEvent.setup();
    render(<GrupoTabela group={grupoA} />);
    await user.click(screen.getByRole("button", { name: /grupo a/i }));
    // Todos os grupos começam com predResult="wait"
    expect(screen.getAllByText(/em aberto/i).length).toBeGreaterThan(0);
  });

  it("palpite de grupo B (wait) mostra 'em aberto'", async () => {
    const user = userEvent.setup();
    render(<GrupoTabela group={GROUPS[1]} />);
    await user.click(screen.getByRole("button", { name: /grupo b/i }));
    expect(screen.getAllByText(/em aberto/i).length).toBeGreaterThan(0);
  });

  it("colunas E e D aparecem no HTML (visibilidade controlada por CSS)", () => {
    setViewport(false); // mobile — CSS oculta, mas o elemento existe no DOM
    render(<GrupoTabela group={grupoA} />);
    // E e D existem no DOM (a ocultação é por CSS, não por renderização condicional)
    const headers = screen.getAllByRole("columnheader");
    const labels = headers.map((h) => h.textContent);
    expect(labels).toContain("E");
    expect(labels).toContain("D");
  });
});
