"use client";

import { useEffect, useState, useCallback } from "react";
import { useBolao } from "@/lib/store";
import {
  rollDailyChallenge, todayVancouver,
  getChallengeWindow, isWindowOpen, msUntilClose,
  resolvePendingDraw, challengeCode, AREA_NUMBER,
} from "@/lib/daily";
import { useDesafioCats } from "@/lib/useDesafios";
import { fmtCountdown } from "@/lib/format";
import { useToast } from "@/components/shell/Toast";
import { useConfetti } from "@/components/shell/ConfettiCanvas";

// ── Countdown ────────────────────────────────────────────────────
function useWindowCountdown(dateVancouver: string) {
  const [ms, setMs] = useState(() => msUntilClose(dateVancouver));
  useEffect(() => {
    const id = setInterval(() => setMs(msUntilClose(dateVancouver)), 1000);
    return () => clearInterval(id);
  }, [dateVancouver]);
  return ms;
}

// ── Componente ───────────────────────────────────────────────────
export function SorteioDoDia() {
  const { draw, setDraw, markChallengeDone, resolveChallenge, challengeHistory, totalChallengePoints, desafioCatsByGroup, currentGrupoId } = useBolao();
  const { show } = useToast();
  const { fire } = useConfetti();
  const DESAFIO_CATS = useDesafioCats(); // desafios do grupo atual

  const today = todayVancouver();
  const windowOpen = draw ? isWindowOpen(draw.dateVancouver) : false;
  const isToday = draw?.dateVancouver === today;
  const countdown = useWindowCountdown(draw?.dateVancouver ?? today);

  // ── Resolve desafio pendente de dia anterior automaticamente ──
  useEffect(() => {
    if (!draw) return;
    const record = resolvePendingDraw(draw, DESAFIO_CATS);
    if (record) {
      resolveChallenge(record);
      if (!record.done) {
        show(`⏰ Desafio ${record.code} encerrado: ${record.pts} pts`);
      }
    }
  }, [draw, resolveChallenge, show]);

  // ── Sortear desafio do dia ────────────────────────────────────
  const handleRoll = useCallback(() => {
    const newDraw = rollDailyChallenge(DESAFIO_CATS);
    setDraw(newDraw);
    fire();
    show("🎲 Desafio do dia sorteado!");
  }, [setDraw, fire, show]);

  // ── Marcar como feito ────────────────────────────────────────
  const { addFeedEvent } = useBolao();

  const handleMark = useCallback((done: boolean) => {
    if (!draw || !windowOpen) return;
    markChallengeDone(done);
    if (done) {
      fire();
      show("✅ Desafio marcado! Pontos garantidos.");
      const cat = DESAFIO_CATS.find((c) => c.id === draw.area);
      if (cat) {
        addFeedEvent({
          type: "challenge",
          emoji: cat.icon,
          body: `Desafio ${challengeCode(draw.area, draw.itemIdx)} concluído — ${cat.items[draw.itemIdx]}`,
          pts: `+${cat.pts} pts`,
        });
      }
    } else {
      show("❌ Desmarcado.");
    }
  }, [draw, windowOpen, markChallengeDone, fire, show, addFeedEvent]);

  // Dados do desafio
  const cat = draw ? DESAFIO_CATS.find((c) => c.id === draw.area) : null;
  const itemText = cat ? cat.items[draw!.itemIdx] : "";
  const code = draw ? challengeCode(draw.area, draw.itemIdx) : "";

  // Janela de abertura para hoje
  const todayWindow = getChallengeWindow(today);
  const nowMs = Date.now();
  const beforeOpen = nowMs < todayWindow.open;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Cabeçalho com pontos acumulados ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", borderRadius: 10,
        background: "var(--bg-2)", border: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>🏅 Pontos dos desafios</span>
        <span className="font-bebas" style={{
          fontSize: 22,
          color: totalChallengePoints >= 0 ? "var(--neon)" : "var(--danger)",
        }}>
          {totalChallengePoints > 0 ? "+" : ""}{totalChallengePoints} pts
        </span>
      </div>

      {/* ── Desafio do dia ── */}
      {!draw || !isToday ? (
        /* Sem desafio hoje */
        <div style={{
          background: "var(--card)", borderRadius: "var(--radius)",
          border: "1px solid var(--border)", padding: 20,
          display: "flex", flexDirection: "column", gap: 14, alignItems: "center",
          textAlign: "center",
        }}>
          <span className="animate-dice" style={{ fontSize: 40, display: "inline-block" }}>🎲</span>
          <div>
            <p className="font-bebas" style={{ fontSize: 20, color: "var(--neon)", margin: 0 }}>
              Desafio do Dia
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              {beforeOpen
                ? `Abre às 01h Vancouver (05h Brasília · 09h Lisboa)`
                : "Clique para sortear o desafio de hoje!"}
            </p>
          </div>

          {!beforeOpen && (
            <button
              aria-label="Sortear desafio de hoje"
              onClick={handleRoll}
              style={{
                padding: "12px 32px", borderRadius: "var(--radius)",
                border: "none", background: "var(--field)",
                color: "var(--neon)", fontWeight: 700, fontSize: 14,
                cursor: "pointer", minHeight: 44,
              }}
            >
              🎲 Sortear desafio de hoje
            </button>
          )}

          {/* Horário de referência */}
          <p style={{ fontSize: 11, color: "var(--muted)" }}>
            ⏰ Janela: 01h–00h Vancouver · 05h–04h Brasília · 09h–08h Lisboa
          </p>
        </div>
      ) : (
        /* Desafio sorteado */
        <div style={{
          background: "var(--card)", borderRadius: "var(--radius)",
          border: `1px solid ${draw.done ? "var(--neon)44" : windowOpen ? "var(--border)" : "rgba(255,90,90,0.3)"}`,
          padding: 20, display: "flex", flexDirection: "column", gap: 14,
        }}>
          {/* Código + categoria */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>{cat?.icon}</span>
              <div>
                <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
                  {cat?.name} — código
                </p>
                <p className="font-bebas" style={{ fontSize: 28, color: "var(--gold)", margin: 0, lineHeight: 1 }}>
                  {code}
                </p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>vale</p>
              <p className="font-bebas" style={{
                fontSize: 22, margin: 0,
                color: draw.done ? "var(--neon)" : "var(--warn)",
              }}>
                ±{cat?.pts} pts
              </p>
            </div>
          </div>

          {/* Descrição */}
          <p style={{
            fontSize: 15, fontWeight: 600,
            color: "var(--text)", margin: 0,
            padding: "12px 14px", borderRadius: 10,
            background: "var(--bg-2)",
          }}>
            {itemText}
          </p>

          {/* Countdown ou status */}
          {windowOpen ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--warn)" }}>
                ⏰ Fecha em {fmtCountdown(countdown)}
                <span style={{ color: "var(--muted)", marginLeft: 6 }}>(meia-noite Vancouver)</span>
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                {new Date(todayWindow.close).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })} BRT
              </span>
            </div>
          ) : (
            <div style={{
              padding: "8px 12px", borderRadius: 8, fontSize: 12,
              background: "rgba(255,90,90,0.1)", color: "var(--danger)", fontWeight: 600,
            }}>
              🔒 Janela encerrada — desafio bloqueado
            </div>
          )}

          {/* Botões marcar */}
          {windowOpen && (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                aria-label="Marcar como feito"
                onClick={() => handleMark(true)}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, fontWeight: 700, fontSize: 14,
                  border: `2px solid ${draw.done ? "var(--neon)" : "var(--border)"}`,
                  background: draw.done ? "var(--neon-soft)" : "transparent",
                  color: draw.done ? "var(--neon)" : "var(--muted)",
                  cursor: "pointer", minHeight: 44,
                }}
              >
                ✅ Fiz!
              </button>
              <button
                aria-label="Marcar como não feito"
                onClick={() => handleMark(false)}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, fontWeight: 700, fontSize: 14,
                  border: `2px solid ${!draw.done ? "rgba(255,90,90,0.5)" : "var(--border)"}`,
                  background: !draw.done ? "rgba(255,90,90,0.08)" : "transparent",
                  color: !draw.done ? "var(--danger)" : "var(--muted)",
                  cursor: "pointer", minHeight: 44,
                }}
              >
                ❌ Não fiz
              </button>
            </div>
          )}

          {/* Resultado atual */}
          <div style={{
            fontSize: 12, color: "var(--muted)", textAlign: "center",
            padding: "6px 0", borderTop: "1px solid var(--border)",
          }}>
            {draw.done
              ? `✅ Marcado como feito → +${cat?.pts} pts ao encerrar`
              : `❌ Não marcado → −${cat?.pts} pts ao encerrar`}
          </div>
        </div>
      )}

      {/* ── Histórico ── */}
      {challengeHistory.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            Histórico
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {challengeHistory.slice(0, 7).map((r, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", borderRadius: 8,
                background: "var(--bg-2)", border: "1px solid var(--border)",
              }}>
                <span style={{ fontSize: 14 }}>{r.done ? "✅" : "❌"}</span>
                <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700, minWidth: 32 }}>{r.code}</span>
                <span style={{ fontSize: 12, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.descricao}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: r.pts >= 0 ? "var(--neon)" : "var(--danger)",
                }}>
                  {r.pts > 0 ? "+" : ""}{r.pts}
                </span>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>{r.dateVancouver}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
