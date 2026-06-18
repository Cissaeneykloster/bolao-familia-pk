"use client";

import { useBolao } from "@/lib/store";
import { todayBrasilia, isDrawTime, challengeCode } from "@/lib/daily";
import { useDesafioCats } from "@/lib/useDesafios";
import { upsertChallengeDone, loadChallengePts } from "@/lib/supabase-sync";
import { useToast } from "@/components/shell/Toast";
import { useConfetti } from "@/components/shell/ConfettiCanvas";
import type { Area } from "@/lib/types";

// Desafio do dia sorteado pelo SISTEMA (1 por grupo/dia), propagado a todos.
export function SorteioDoDia() {
  const {
    dailyDraw, myChallengeDone, setMyChallengeDone, setChallengePts,
    challengePts, currentUserApelido, currentGrupoId, addFeedEvent,
  } = useBolao();
  const { show } = useToast();
  const { fire } = useConfetti();
  const DESAFIO_CATS = useDesafioCats();

  const today = todayBrasilia();
  const draw = dailyDraw && dailyDraw.dateBrt === today ? dailyDraw : null;
  const cat = draw ? DESAFIO_CATS.find((c) => c.id === draw.area) : null;
  const code = draw ? challengeCode(draw.area as Area, draw.itemIdx) : "";
  const meusPts = currentUserApelido ? (challengePts[currentUserApelido] ?? 0) : 0;

  const mark = async (done: boolean) => {
    if (!draw) return;
    if (!currentUserApelido) { show("Entre pelo seu link de acesso para pontuar."); return; }
    setMyChallengeDone(done);
    if (done) { fire(); show(`✅ +${draw.pts} pts!`); }
    else show("Marcado como não feito — 0 pts");
    if (done && cat) {
      addFeedEvent({
        type: "challenge", emoji: cat.icon,
        body: `Desafio ${code} concluído — ${draw.descricao}`,
        pts: `+${draw.pts} pts`,
      });
    }
    // Desafio não realizado não desconta pontos: soma 0 (só o "Fiz!" pontua)
    await upsertChallengeDone(currentUserApelido, currentGrupoId ?? "", today, done, done ? draw.pts : 0);
    setChallengePts(await loadChallengePts());
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Pontos de desafios do usuário (entram no ranking) */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", borderRadius: 10,
        background: "var(--bg-2)", border: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>🏅 Seus pontos de desafios</span>
        <span className="font-bebas" style={{
          fontSize: 22, color: meusPts >= 0 ? "var(--neon)" : "var(--danger)",
        }}>
          {meusPts > 0 ? "+" : ""}{meusPts} pts
        </span>
      </div>

      {!draw ? (
        <div style={{
          background: "var(--card)", borderRadius: "var(--radius)",
          border: "1px solid var(--border)", padding: 20,
          display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center",
        }}>
          <span className="animate-dice" style={{ fontSize: 40, display: "inline-block" }}>🎲</span>
          <p className="font-bebas" style={{ fontSize: 20, color: "var(--neon)", margin: 0 }}>
            Desafio do Dia
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
            {isDrawTime()
              ? "Sorteando o desafio de hoje… atualize em instantes."
              : "O sorteio do sistema abre às 07h00 (horário de Brasília)."}
          </p>
        </div>
      ) : (
        <div style={{
          background: "var(--card)", borderRadius: "var(--radius)",
          border: `1px solid ${myChallengeDone ? "var(--neon)44" : "var(--border)"}`,
          padding: 20, display: "flex", flexDirection: "column", gap: 14,
        }}>
          {/* Código + categoria + valor */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>{cat?.icon}</span>
              <div>
                <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>{cat?.name} — código</p>
                <p className="font-bebas" style={{ fontSize: 28, color: "var(--gold)", margin: 0, lineHeight: 1 }}>
                  {code}
                </p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>vale</p>
              <p className="font-bebas" style={{ fontSize: 22, margin: 0, color: "var(--warn)" }}>
                +{draw.pts} pts
              </p>
            </div>
          </div>

          {/* Descrição */}
          <p style={{
            fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0,
            padding: "12px 14px", borderRadius: 10, background: "var(--bg-2)",
          }}>
            {draw.descricao}
          </p>

          {/* Botões Fiz / Não fiz */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              aria-label="Marcar como feito"
              onClick={() => mark(true)}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 10, fontWeight: 700, fontSize: 14,
                border: `2px solid ${myChallengeDone === true ? "var(--neon)" : "var(--border)"}`,
                background: myChallengeDone === true ? "var(--neon-soft)" : "transparent",
                color: myChallengeDone === true ? "var(--neon)" : "var(--muted)",
                cursor: "pointer", minHeight: 44,
              }}
            >
              ✅ Fiz!
            </button>
            <button
              aria-label="Marcar como não feito"
              onClick={() => mark(false)}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 10, fontWeight: 700, fontSize: 14,
                border: `2px solid ${myChallengeDone === false ? "rgba(255,90,90,0.5)" : "var(--border)"}`,
                background: myChallengeDone === false ? "rgba(255,90,90,0.08)" : "transparent",
                color: myChallengeDone === false ? "var(--danger)" : "var(--muted)",
                cursor: "pointer", minHeight: 44,
              }}
            >
              ❌ Não fiz
            </button>
          </div>

          {/* Resultado — pontos visíveis */}
          {myChallengeDone !== null && (
            <div style={{
              fontSize: 12, fontWeight: 700, textAlign: "center", padding: "6px 0",
              borderTop: "1px solid var(--border)",
              color: myChallengeDone ? "var(--neon)" : "var(--muted)",
            }}>
              {myChallengeDone
                ? `✅ +${draw.pts} pts somados ao seu ranking`
                : "Marcado como não feito — 0 pts (não desconta)"}
            </div>
          )}

          {!currentUserApelido && (
            <div style={{
              fontSize: 12, color: "var(--muted)", textAlign: "center",
              padding: "8px 12px", borderRadius: 8, background: "var(--bg-2)",
            }}>
              Entre pelo seu link de acesso para marcar e pontuar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
