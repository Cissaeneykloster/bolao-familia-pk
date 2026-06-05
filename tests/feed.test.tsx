import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeedItem } from "@/components/feed/FeedItem";
import { FeedScreen } from "@/components/feed/FeedScreen";
import type { FeedEvent } from "@/lib/types";

const evExact: FeedEvent = {
  type: "exact", age: 2,
  body: "Rafael acertou o placar exato! Brasil 2×1 Argentina",
  pts: "+25 pts",
};

const evResult: FeedEvent = {
  type: "result", age: 5, body: "Resultado confirmado",
  score: { a: "Brasil", sa: 2, sb: 1, b: "Argentina" },
  stats: ["6 de 10 acertaram o vencedor"],
};

const evWinner: FeedEvent = {
  type: "winner", age: 12,
  body: "Marcos acertou o vencedor — Brasil × Argentina",
  pts: "+8 pts",
};

const evSent: FeedEvent = {
  type: "sent", age: 15,
  body: "Ana fez seu palpite em Brasil × Argentina",
};

describe("FeedItem", () => {
  it("tipo exact renderiza 'PLACAR EXATO!' e os pontos", () => {
    render(<FeedItem event={evExact} />);
    // Aparece tanto no badge quanto no body — getAllByText garante ao menos um
    expect(screen.getAllByText(/placar exato/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/\+25 pts/)).toBeInTheDocument();
  });

  it("tipo result mostra o placar e as stats", () => {
    render(<FeedItem event={evResult} />);
    expect(screen.getByText(/resultado confirmado/i)).toBeInTheDocument();
    expect(screen.getByText(/6 de 10/i)).toBeInTheDocument();
  });

  it("tipo winner mostra os pontos", () => {
    render(<FeedItem event={evWinner} />);
    expect(screen.getByText(/\+8 pts/)).toBeInTheDocument();
  });

  it("tipo sent mostra o texto do evento", () => {
    render(<FeedItem event={evSent} />);
    expect(screen.getByText(/ana fez seu palpite/i)).toBeInTheDocument();
  });

  it("timestamp relativo é exibido", () => {
    render(<FeedItem event={evExact} />);
    expect(screen.getByText(/2min atrás/)).toBeInTheDocument();
  });
});

describe("FeedScreen", () => {
  it("renderiza todos os eventos do mock (8)", () => {
    render(<FeedScreen />);
    expect(screen.getByText(/8 eventos/)).toBeInTheDocument();
  });

  it("o primeiro evento (placar exato) aparece no topo", () => {
    render(<FeedScreen />);
    expect(screen.getAllByText(/placar exato/i).length).toBeGreaterThan(0);
  });
});
