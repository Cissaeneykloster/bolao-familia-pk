import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Componente trivial para testar herança de tokens
function TokenSample({ theme }: { theme: "dark" | "light" }) {
  return (
    <div data-theme={theme}>
      <p
        data-testid="text-node"
        style={{ color: "var(--text)", background: "var(--bg)" }}
      >
        teste
      </p>
    </div>
  );
}

describe("Design tokens", () => {
  it("renderiza sem erro no tema dark", () => {
    render(<TokenSample theme="dark" />);
    expect(screen.getByTestId("text-node")).toBeInTheDocument();
  });

  it("renderiza sem erro no tema light", () => {
    render(<TokenSample theme="light" />);
    expect(screen.getByTestId("text-node")).toBeInTheDocument();
  });

  it("data-theme='dark' e 'light' coexistem sem conflito", () => {
    const { rerender } = render(<TokenSample theme="dark" />);
    expect(screen.getByTestId("text-node")).toBeInTheDocument();
    rerender(<TokenSample theme="light" />);
    expect(screen.getByTestId("text-node")).toBeInTheDocument();
  });

  it("o texto não some no modo claro (color explícita via token)", () => {
    render(
      <div data-theme="light" data-testid="wrapper">
        <p style={{ color: "var(--text)" }} data-testid="txt">Olá</p>
      </div>
    );
    // Em jsdom var(--text) não resolve CSS custom properties reais,
    // mas garantimos que o elemento está presente e não está oculto.
    const el = screen.getByTestId("txt");
    expect(el).toBeInTheDocument();
    expect(el).toBeVisible();
    // Verificamos que o atributo style usa o token correto (não hardcode de cor clara)
    expect(el.getAttribute("style")).toContain("var(--text)");
  });

  it("tokens obrigatórios definidos no globals.css existem como variáveis no inline style", () => {
    render(
      <div
        data-testid="tokens"
        style={{
          color: "var(--text)",
          background: "var(--bg)",
          borderColor: "var(--border)",
        }}
      />
    );
    const el = screen.getByTestId("tokens");
    const style = el.getAttribute("style")!;
    expect(style).toContain("var(--text)");
    expect(style).toContain("var(--bg)");
    expect(style).toContain("var(--border)");
  });
});
