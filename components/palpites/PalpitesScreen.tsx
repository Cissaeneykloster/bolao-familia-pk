"use client";

import { useBolao } from "@/lib/store";
import { mScore } from "@/lib/scoring";
import { MATCHES } from "@/lib/mock-data";
import { PlacarInput } from "./PlacarInput";
import { Breakdown } from "./Breakdown";
import { useToast } from "@/components/shell/Toast";
import { useConfetti } from "@/components/shell/ConfettiCanvas";

export function PalpitesScreen() {
  const { guesses, resultFix } = useBolao();
  const { show } = useToast();
  const { fire } = useConfetti();
  const { addFeedEvent } = useBolao();

  const apostados = Object.keys(guesses).length;
  const total = MATCHES.length;
  const pct = total > 0 ? Math.round((apostados / total) * 100) : 0;

  const upcoming = MATCHES.filter((m) => m.status === "upcoming");
  const finished = MATCHES.filter((m) => m.status === "finished");

  const handleSaved = (matchId: string) => {
    show("✅ Palpite salvo!");
    const g = guesses[matchId];
    const match = MATCHES.find((m) => m.id === matchId);
    if (g && match) {
      // Registra no feed (sem revelar o placar apostado)
      addFeedEvent({
        type: "sent",
        body: `Você fez seu palpite em ${match.a.name} × ${match.b.name}`,
      });
      // Se for treino/encerrado, verifica placar exato
      if (match.status === "finished") {
        const actual = mScore(match, resultFix);
        if (g.a === actual.sa && g.b === actual.sb) {
          fire();
          addFeedEvent({
            type: "exact",
            body: `Placar exato! ${match.a.name} ${actual.sa}×${actual.sb} ${match.b.name}`,
            pts: "+25 pts",
          });
        }
      }
    }
  };

  return (
    <div className="animate-screen-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Cabeçalho com anel de progresso */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Anel SVG simples */}
        <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="var(--border)" strokeWidth="5" />
            <circle
              cx="28" cy="28" r="22"
              fill="none"
              stroke="var(--neon)"
              strokeWidth="5"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <span className="font-bebas" style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 16, color: "var(--neon)",
          }}>
            {pct}%
          </span>
        </div>

        <div>
          <h2 className="font-bebas" style={{ fontSize: 26, color: "var(--text)", lineHeight: 1 }}>
            🎯 Meus Palpites
          </h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
            {apostados} de {total} jogos apostados
          </p>
        </div>
      </div>

      {/* ── Disponíveis para apostar ── */}
      {upcoming.length > 0 && (
        <section>
          <h3 style={{
            fontSize: 11, fontWeight: 700, color: "var(--muted)",
            letterSpacing: 1, marginBottom: 10,
            textTransform: "uppercase",
          }}>
            Disponíveis para apostar
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {upcoming.map((m) => (
              <PlacarInput
                key={m.id}
                match={m}
                onSaved={() => handleSaved(m.id)}
              />
            ))}
          </div>
        </section>
      )}

      {upcoming.length === 0 && (
        <div style={{
          textAlign: "center", padding: "24px 0",
          color: "var(--muted)", fontSize: 13,
        }}>
          Nenhum jogo disponível para apostar no momento.
        </div>
      )}

      {/* ── Palpites encerrados ── */}
      {finished.length > 0 && (
        <section>
          <h3 style={{
            fontSize: 11, fontWeight: 700, color: "var(--muted)",
            letterSpacing: 1, marginBottom: 10,
            textTransform: "uppercase",
          }}>
            Palpites encerrados
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {finished.map((m) => {
              const g = guesses[m.id];
              const actual = mScore(m, resultFix);
              return (
                <div key={m.id} style={{
                  background: "var(--bg-2)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}>
                  {/* Times + placar real */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 20 }}>{m.a.flag}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{m.a.name}</span>
                    </div>
                    <span className="font-bebas" style={{ fontSize: 28, color: "var(--neon)", letterSpacing: 2 }}>
                      {actual.sa} × {actual.sb}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{m.b.name}</span>
                      <span style={{ fontSize: 20 }}>{m.b.flag}</span>
                    </div>
                  </div>

                  {g ? (
                    <>
                      <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                        Você apostou:{" "}
                        <strong style={{ color: "var(--text)" }}>{g.a} × {g.b}</strong>
                      </p>
                      <Breakdown actual={actual} guess={g} compact />
                    </>
                  ) : (
                    <p style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
                      Você não apostou nesse jogo.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
