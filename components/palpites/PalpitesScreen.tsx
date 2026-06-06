"use client";

import { useState } from "react";
import { useBolao } from "@/lib/store";
import { mScore } from "@/lib/scoring";
import { MATCHES, GROUPS } from "@/lib/mock-data";
import { PlacarInput } from "./PlacarInput";
import { Breakdown } from "./Breakdown";
import { PrevisaoGrupos } from "./PrevisaoGrupos";
import { useToast } from "@/components/shell/Toast";
import { useConfetti } from "@/components/shell/ConfettiCanvas";
import { arePredictionsLocked, calcGroupPredictionPts } from "@/lib/standings";

type Tab = "grupos" | "jogos";

export function PalpitesScreen() {
  const { guesses, resultFix, groupPredictions, groupPredictionsSaved, addFeedEvent } = useBolao();
  const { show } = useToast();
  const { fire } = useConfetti();

  const predLocked = arePredictionsLocked(groupPredictionsSaved);
  const { total: ptsPrev } = calcGroupPredictionPts(groupPredictions, GROUPS, MATCHES, resultFix);

  // Decide qual aba mostrar por padrão
  const [tab, setTab] = useState<Tab>(predLocked ? "jogos" : "grupos");

  // Conta palpites dos jogos
  const copaMatches = MATCHES.filter((m) => m.phase !== "amistoso");
  const apostados = copaMatches.filter((m) => guesses[m.id]).length;
  const pct = copaMatches.length > 0 ? Math.round((apostados / copaMatches.length) * 100) : 0;

  // Conta previsões preenchidas
  const previsoes = GROUPS.filter((g) => {
    const p = groupPredictions[g.name];
    return p?.first && p?.second && p.first !== p.second;
  }).length;

  const handleSaved = (matchId: string) => {
    show("✅ Palpite salvo!");
    const g = guesses[matchId];
    const match = MATCHES.find((m) => m.id === matchId);
    if (g && match) {
      addFeedEvent({
        type: "sent",
        body: `Você fez seu palpite em ${match.a.name} × ${match.b.name}`,
      });
      if (match.status === "finished" || match.training) {
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

  const upcoming = MATCHES.filter((m) => m.status === "upcoming" && m.phase !== "amistoso");
  const training = MATCHES.filter((m) => m.training);
  const finished = MATCHES.filter((m) => m.status === "finished");

  return (
    <div className="animate-screen-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => setTab("grupos")}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 10, fontWeight: 700, fontSize: 13,
            border: `1px solid ${tab === "grupos" ? "var(--warn)" : "var(--border)"}`,
            background: tab === "grupos" ? "rgba(255,216,77,0.1)" : "transparent",
            color: tab === "grupos" ? "var(--warn)" : "var(--muted)",
            cursor: "pointer", position: "relative" as const,
          }}
        >
          📋 Previsão dos Grupos
          {!predLocked && previsoes < 12 && (
            <span style={{
              position: "absolute", top: -6, right: -4,
              background: "var(--live)", color: "#fff",
              borderRadius: "50%", width: 16, height: 16,
              fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              !
            </span>
          )}
          {ptsPrev > 0 && (
            <span style={{ fontSize: 11, color: "var(--neon)", marginLeft: 6 }}>+{ptsPrev}pts</span>
          )}
        </button>

        <button
          onClick={() => {
            if (!predLocked && previsoes < 12) {
              show("⚠️ Salve as previsões dos grupos primeiro!");
              return;
            }
            setTab("jogos");
          }}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 10, fontWeight: 700, fontSize: 13,
            border: `1px solid ${tab === "jogos" ? "var(--neon)" : "var(--border)"}`,
            background: tab === "jogos" ? "var(--neon-soft)" : "transparent",
            color: tab === "jogos" ? "var(--neon)" : (!predLocked && previsoes < 12) ? "var(--muted)" : "var(--muted)",
            cursor: "pointer", opacity: (!predLocked && previsoes < 12) ? 0.5 : 1,
          }}
        >
          ⚽ Palpites dos Jogos
          <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 4 }}>{pct}%</span>
        </button>
      </div>

      {/* ── Aviso de trava ── */}
      {tab === "jogos" && !predLocked && previsoes < 12 && (
        <div style={{
          padding: "14px 16px", borderRadius: "var(--radius)",
          background: "rgba(255,90,90,0.08)", border: "1px solid rgba(255,90,90,0.3)",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 14, color: "var(--danger)", fontWeight: 700, margin: "0 0 6px" }}>
            🔒 Palpites bloqueados
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
            Preencha e salve a previsão dos {12 - previsoes} grupos restantes primeiro.
          </p>
          <button
            onClick={() => setTab("grupos")}
            style={{
              marginTop: 10, padding: "8px 20px", borderRadius: 8,
              border: "none", background: "var(--warn)", color: "#000",
              cursor: "pointer", fontWeight: 700, fontSize: 13,
            }}
          >
            Ir para Previsão dos Grupos
          </button>
        </div>
      )}

      {/* ── Aba: Previsão dos grupos ── */}
      {tab === "grupos" && <PrevisaoGrupos />}

      {/* ── Aba: Palpites dos jogos ── */}
      {tab === "jogos" && (predLocked || previsoes >= 12) && (
        <>
          {/* Anel de progresso */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="20" fill="none" stroke="var(--border)" strokeWidth="5" />
                <circle cx="26" cy="26" r="20" fill="none" stroke="var(--neon)" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
                  strokeLinecap="round" transform="rotate(-90 26 26)"
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <span className="font-bebas" style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 14, color: "var(--neon)",
              }}>{pct}%</span>
            </div>
            <div>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                {apostados} de {copaMatches.length} jogos apostados
              </p>
            </div>
          </div>

          {/* Amistosos de treino */}
          {training.length > 0 && (
            <section>
              <h3 style={{
                fontSize: 11, fontWeight: 700, color: "var(--warn)",
                letterSpacing: 1, marginBottom: 8, textTransform: "uppercase",
              }}>
                🎯 Treino (não conta no ranking)
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {training.map((m) => (
                  <PlacarInput key={m.id} match={m} onSaved={() => handleSaved(m.id)} />
                ))}
              </div>
            </section>
          )}

          {/* Copa — próximos */}
          {upcoming.length > 0 && (
            <section>
              <h3 style={{
                fontSize: 11, fontWeight: 700, color: "var(--muted)",
                letterSpacing: 1, marginBottom: 8, textTransform: "uppercase",
              }}>
                Disponíveis para apostar
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {upcoming.slice(0, 20).map((m) => (
                  <PlacarInput key={m.id} match={m} onSaved={() => handleSaved(m.id)} />
                ))}
                {upcoming.length > 20 && (
                  <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
                    + {upcoming.length - 20} jogos disponíveis
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Copa — encerrados */}
          {finished.length > 0 && (
            <section>
              <h3 style={{
                fontSize: 11, fontWeight: 700, color: "var(--muted)",
                letterSpacing: 1, marginBottom: 8, textTransform: "uppercase",
              }}>
                Palpites encerrados
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {finished.map((m) => {
                  const g = guesses[m.id];
                  const actual = mScore(m, resultFix);
                  return (
                    <div key={m.id} style={{
                      background: "var(--bg-2)", borderRadius: "var(--radius)",
                      border: "1px solid var(--border)", padding: 14,
                      display: "flex", flexDirection: "column", gap: 8,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>
                          {m.a.flag} {m.a.name}
                        </span>
                        <span className="font-bebas" style={{ fontSize: 26, color: "var(--neon)" }}>
                          {actual.sa} × {actual.sb}
                        </span>
                        <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>
                          {m.b.name} {m.b.flag}
                        </span>
                      </div>
                      {g ? (
                        <>
                          <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                            Você apostou: <strong style={{ color: "var(--text)" }}>{g.a} × {g.b}</strong>
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
        </>
      )}
    </div>
  );
}
