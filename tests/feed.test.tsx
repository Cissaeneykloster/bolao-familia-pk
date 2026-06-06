import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeedItem } from "@/components/feed/FeedItem";
import { FeedScreen } from "@/components/feed/FeedScreen";
import { useBolao } from "@/lib/store";
import type { FeedEvent } from "@/lib/types";

function ev(partial: Omit<FeedEvent, "id" | "timestamp">): FeedEvent {
  return { ...partial, id: "test-" + Math.random(), timestamp: Date.now() - 120_000 };
}

const evExact = ev({ type: "exact", body: "Você acertou o placar exato! Brasil 2×1 Marrocos", pts: "+25 pts" });
const evResult = ev({ type: "result", body: "Resultado confirmado", score: { a: "Brasil", sa: 2, sb: 1, b: "Marrocos" }, stats: ["6 de 10 acertaram o vencedor"] });
const evWinner = ev({ type: "winner", body: "Você acertou o vencedor — Brasil × Marrocos", pts: "+8 pts" });
const evSent = ev({ type: "sent", body: "Você fez seu palpite em Brasil × Marrocos" });
const evAnnouncement = ev({ type: "announcement", emoji: "📢", body: "Bem-vindos ao Bolão Família PK!" });
const evChallenge = ev({ type: "challenge", emoji: "🛏️", body: "Desafio 1.1 concluído — Arrumar a cama antes das 9h", pts: "+3 pts" });

beforeEach(() => {
  useBolao.setState({ feedEvents: [], adminUnlocked: false });
});

describe("FeedItem", () => {
  it("tipo exact renderiza 'PLACAR EXATO!' e os pontos", () => {
    render(<FeedItem event={evExact} />);
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
    expect(screen.getByText(/você fez seu palpite/i)).toBeInTheDocument();
  });

  it("tipo announcement mostra 'AVISO DO ORGANIZADOR'", () => {
    render(<FeedItem event={evAnnouncement} />);
    expect(screen.getByText(/aviso do organizador/i)).toBeInTheDocument();
    expect(screen.getByText(/bem-vindos/i)).toBeInTheDocument();
  });

  it("tipo challenge mostra o código e pontos", () => {
    render(<FeedItem event={evChallenge} />);
    expect(screen.getByText(/desafio 1\.1/i)).toBeInTheDocument();
    expect(screen.getByText(/\+3 pts/)).toBeInTheDocument();
  });

  it("timestamp relativo é exibido", () => {
    render(<FeedItem event={evExact} />);
    expect(screen.getByText(/2min atrás|agora/)).toBeInTheDocument();
  });
});

describe("FeedScreen", () => {
  it("sem eventos mostra mensagem vazia", () => {
    render(<FeedScreen />);
    expect(screen.getByText(/nenhuma atividade ainda/i)).toBeInTheDocument();
  });

  it("com eventos mostra a contagem", () => {
    useBolao.setState({ feedEvents: [evExact, evResult] });
    render(<FeedScreen />);
    expect(screen.getByText(/2 eventos/)).toBeInTheDocument();
  });

  it("admin vê o botão Postar", () => {
    useBolao.setState({ adminUnlocked: true });
    render(<FeedScreen />);
    expect(screen.getByRole("button", { name: /postar/i })).toBeInTheDocument();
  });

  it("não-admin não vê o botão Postar", () => {
    useBolao.setState({ adminUnlocked: false });
    render(<FeedScreen />);
    expect(screen.queryByRole("button", { name: /postar/i })).not.toBeInTheDocument();
  });
});
