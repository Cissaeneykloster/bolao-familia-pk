"use client";

import { useState, useEffect, useRef } from "react";
import { useBolao } from "@/lib/store";
import { mScore, breakdown } from "@/lib/scoring";
import { GROUPS } from "@/lib/mock-data";
import { PlacarInput } from "./PlacarInput";
import { Breakdown } from "./Breakdown";
import { PrevisaoGrupos } from "./PrevisaoGrupos";
import { useToast } from "@/components/shell/Toast";
import { useConfetti } from "@/components/shell/ConfettiCanvas";
import { arePredictionsLocked, calcGroupPredictionPts } from "@/lib/standings";
import { useLang, T, countryName } from "@/lib/useLang";

type Tab = "grupos" | "jogos";

export function PalpitesScreen() {
  const { guesses, resultFix, groupPredictions, groupPredictionsSaved, addFeedEvent, officialResults, currentUserApelido, matches, focusMatchId, setFocusMatch } = useBolao();
  const { show } = useToast();
  const { fire } = useConfetti();
  const lang = useLang();
  const t = T[lang];

  const predLocked = arePredictionsLocked(groupPredictionsSaved);
  const { total: ptsPrev } = calcGroupPredictionPts(groupPredictions, GROUPS, matches, resultFix);

  // Decide qual aba mostrar por padrão; se vier de "Palpite" de um jogo, vai direto para jogos
  const [tab, setTab] = useState<Tab>(focusMatchId || predLocked ? "jogos" : "grupos");
  // Se veio via botão Palpite do JOGOS, libera os palpites sem exigir previsão dos grupos
  const [bypassGate, setBypassGate] = useState(!!focusMatchId);
  const matchRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll para o jogo focado quando a aba jogos abre
  useEffect(() => {
    if (!focusMatchId) return;
    setTab("jogos");
    setBypassGate(true);

    let attempts = 0;
    const tryScroll = () => {
      const el = matchRefs.current[focusMatchId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setFocusMatch(null);
        return;
      }
      // Tenta até 10x em intervalos de 80ms enquanto o DOM renderiza
      if (++attempts < 10) {
        setTimeout(tryScroll, 80);
      } else {
        setFocusMatch(null);
      }
    };

    const id = setTimeout(tryScroll, 80);
    return () => clearTimeout(id);
  }, [focusMatchId, setFocusMatch]);

  // Conta palpites dos jogos
  const copaMatches = matches.filter((m) => m.phase !== "amistoso");
  const apostados = copaMatches.filter((m) => guesses[m.id]).length;
  const pct = copaMatches.length > 0 ? Math.round((apostados / copaMatches.length) * 100) : 0;

  // Conta previsões preenchidas
  const previsoes = GROUPS.filter((g) => {
    const p = groupPredictions[g.name];
    return p?.first && p?.second && p.first !== p.second;
  }).length;

  const handleSaved = (matchId: string) => {
    show(t.palpiteSalvo);
    const g = guesses[matchId];
    const match = matches.find((m) => m.id === matchId);
    if (g && match) {
      addFeedEvent({
        type: "sent",
        body: `${lang === "en" ? "You placed a bet on" : "Você fez seu palpite em"} ${countryName(match.a.name, lang)} × ${countryName(match.b.name, lang)}`,
      });
      if (match.status === "finished" || match.training) {
        const actual = mScore(match, resultFix);
        if (g.a === actual.sa && g.b === actual.sb) {
          fire();
          addFeedEvent({
            type: "exact",
            body: lang === "en"
              ? `Exact score! ${countryName(match.a.name, lang)} ${actual.sa}×${actual.sb} ${countryName(match.b.name, lang)}`
              : `Placar exato! ${match.a.name} ${actual.sa}×${actual.sb} ${match.b.name}`,
            pts: "+25 pts",
          });
        }
      }
    }
  };

  // Todos ordenados por data/hora
  const sortedMatches = [...matches].sort((a, b) => (a.kickoff ?? 0) - (b.kickoff ?? 0));
  // Jogos COM resultado oficial → tabela de pontos por jogo (sempre visível)
  const comResultado = sortedMatches.filter((m) => officialResults[m.id]);
  // Editáveis (ainda sem resultado) — ficam atrás da trava das previsões
  const upcoming = sortedMatches.filter((m) => m.status === "upcoming" && !m.training && !officialResults[m.id]);
  const training = sortedMatches.filter((m) => m.training && !officialResults[m.id]);

  return (
    <div className="animate-screen-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Aviso: sem identificação, palpites não vão para o servidor ── */}
      {!currentUserApelido && (
        <div style={{
          padding: "10px 14px", borderRadius: "var(--radius)",
          background: "rgba(255,216,77,0.08)", border: "1px solid rgba(255,216,77,0.35)",
          fontSize: 12, color: "var(--warn)",
        }}>
          ⚠️ Você não está identificado — seus palpites ficam salvos só neste
          aparelho. Abra o app pelo seu link de acesso para salvá-los na nuvem.
        </div>
      )}

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
          {t.previsaoGrupos}
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
            if (!predLocked && previsoes < 12 && !bypassGate) {
              show(t.salvePrevisoesPrimeiro);
              return;
            }
            setTab("jogos");
          }}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 10, fontWeight: 700, fontSize: 13,
            border: `1px solid ${tab === "jogos" ? "var(--neon)" : "var(--border)"}`,
            background: tab === "jogos" ? "var(--neon-soft)" : "transparent",
            color: tab === "jogos" ? "var(--neon)" : "var(--muted)",
            cursor: "pointer",
          }}
        >
          {t.palpitesJogos}
          <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 4 }}>{pct}%</span>
        </button>
      </div>

      {/* ── Aba: Previsão dos grupos ── */}
      {tab === "grupos" && <PrevisaoGrupos />}

      {/* ── Aba: Palpites dos jogos ── */}
      {tab === "jogos" && (
        <>
          {/* ── Resultados (pontos por jogo) — SEMPRE visível p/ jogos com resultado oficial ── */}
          {comResultado.length > 0 && (
            <section>
              <h3 style={{
                fontSize: 11, fontWeight: 700, color: "var(--muted)",
                letterSpacing: 1, marginBottom: 8, textTransform: "uppercase",
              }}>
                {lang === "en" ? "Results — points per match" : "Resultados — pontos por jogo"}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {comResultado.map((m) => {
                  const official = officialResults[m.id]!;
                  const g = guesses[m.id];
                  const bd = g ? breakdown({ sa: official.sa, sb: official.sb }, { a: g.a, b: g.b }, m.phase) : null;
                  return (
                    <div key={m.id} style={{
                      background: "var(--bg-2)", borderRadius: "var(--radius)",
                      border: "1px solid rgba(0,255,135,0.2)", padding: 14,
                      display: "flex", flexDirection: "column", gap: 8,
                    }}>
                      {/* Cabeçalho */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>
                          {m.a.flag} {countryName(m.a.name, lang)}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="font-bebas" style={{ fontSize: 22, color: "var(--neon)" }}>
                            {official.sa} × {official.sb}
                          </span>
                          <span style={{ fontSize: 10, color: "var(--muted)", background: "var(--border)", padding: "2px 6px", borderRadius: 8 }}>
                            {m.training ? t.treinoEncerrado : t.encerrado}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>
                          {countryName(m.b.name, lang)} {m.b.flag}
                        </span>
                      </div>
                      {/* Breakdown dos acertos por critério */}
                      {g && bd ? (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                              {t.seuPalpite} <strong style={{ color: "var(--text)" }}>{g.a} × {g.b}</strong>
                            </p>
                            <span style={{
                              fontSize: 15, fontWeight: 700, padding: "4px 12px", borderRadius: 10,
                              background: bd.total >= 20 ? "rgba(255,215,0,0.15)" : bd.total > 0 ? "var(--neon-soft)" : "rgba(255,90,90,0.1)",
                              color: bd.total >= 20 ? "var(--gold)" : bd.total > 0 ? "var(--neon)" : "var(--danger)",
                            }}>
                              {bd.total >= 20 ? "🎯 " : bd.total > 0 ? "⚡ " : ""}{bd.total > 0 ? `+${bd.total} pts` : "0 pts"}
                            </span>
                          </div>
                          <Breakdown actual={{ sa: official.sa, sb: official.sb }} guess={g} compact />
                        </>
                      ) : (
                        <p style={{ fontSize: 12, color: "var(--danger)", fontStyle: "italic" }}>
                          {m.training ? t.semPalpiteTreino : t.semPalpiteJogo}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Edição de palpites — atrás da trava das previsões ── */}
          {predLocked || previsoes >= 12 || bypassGate ? (
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
                    {apostados} {t.de} {copaMatches.length} {t.jogosApostados}
                  </p>
                </div>
              </div>

              {/* Amistosos de treino (ainda sem resultado) */}
              {training.length > 0 && (
                <section>
                  <h3 style={{
                    fontSize: 11, fontWeight: 700, color: "var(--warn)",
                    letterSpacing: 1, marginBottom: 8, textTransform: "uppercase",
                  }}>
                    {t.treinoNaoContaRanking}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {training.map((m) => (
                      <div key={m.id} ref={(el) => { matchRefs.current[m.id] = el; }}>
                        <PlacarInput match={m} onSaved={() => handleSaved(m.id)} />
                      </div>
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
                    {t.disponiveis}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {upcoming.map((m) => (
                      <div key={m.id} ref={(el) => { matchRefs.current[m.id] = el; }}>
                        <PlacarInput match={m} onSaved={() => handleSaved(m.id)} />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div style={{
              padding: "14px 16px", borderRadius: "var(--radius)",
              background: "rgba(255,90,90,0.08)", border: "1px solid rgba(255,90,90,0.3)",
              textAlign: "center",
            }}>
              <p style={{ fontSize: 14, color: "var(--danger)", fontWeight: 700, margin: "0 0 6px" }}>
                {t.palpitesBloqueados}
              </p>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                {t.preenchaGruposRestantes(12 - previsoes)}
              </p>
              <button
                onClick={() => setTab("grupos")}
                style={{
                  marginTop: 10, padding: "8px 20px", borderRadius: 8,
                  border: "none", background: "var(--warn)", color: "#000",
                  cursor: "pointer", fontWeight: 700, fontSize: 13,
                }}
              >
                {t.irParaPrevisao}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
