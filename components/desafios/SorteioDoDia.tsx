"use client";

import { useState, useRef, useCallback } from "react";
import { useBolao } from "@/lib/store";
import {
  rollDraw, activeDraw, drawnId,
  dailyDoneCount, closeDayResult, shouldClaimCombo,
} from "@/lib/daily";
import { DESAFIO_CATS, DAILY_AREAS, AREA_SHORT } from "@/lib/mock-data";
import { Evidencia } from "./Evidencia";
import { useToast } from "@/components/shell/Toast";
import { useConfetti } from "@/components/shell/ConfettiCanvas";
import type { Area } from "@/lib/types";

const AREAS = DAILY_AREAS as Area[];

// Stakes por área para a tela de intro
const STAKES: { area: Area; label: string; pts: number }[] = [
  { area: "quarto",      label: "🛏️ Quarto",        pts: 3 },
  { area: "servico",     label: "❤️ Serviço",         pts: 5 },
  { area: "intelectual", label: "📚 Intelectual",     pts: 4 },
  { area: "saude",       label: "💧 Saúde",           pts: 3 },
];

// ── Animação caça-níquel ──────────────────────────────────────────
const SLOT_DURATION_MS = [900, 1200, 1500, 1900]; // escalonado por linha

function useSlotAnimation(onDone: () => void) {
  const [spinning, setSpinning] = useState(false);
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null]);

  const start = useCallback(() => {
    setSpinning(true);
    setSlots([null, null, null, null]);

    AREAS.forEach((area, i) => {
      const cat = DESAFIO_CATS.find((c) => c.id === area)!;
      const items = cat.items;
      let count = 0;
      const tick = () => {
        setSlots((prev) => {
          const next = [...prev];
          next[i] = items[count % items.length];
          return next;
        });
        count++;
      };

      // Tick a cada 75ms
      const interval = setInterval(tick, 75);

      // Para após a duração da linha
      setTimeout(() => {
        clearInterval(interval);
        // Escolhe item aleatório final
        const finalIdx = Math.floor(Math.random() * items.length);
        setSlots((prev) => {
          const next = [...prev];
          next[i] = items[finalIdx];
          return next;
        });
        // Última linha → termina
        if (i === AREAS.length - 1) {
          setTimeout(() => {
            setSpinning(false);
            onDone();
          }, 200);
        }
      }, SLOT_DURATION_MS[i]);
    });
  }, [onDone]);

  return { spinning, slots, start };
}

// ── Componente principal ──────────────────────────────────────────
export function SorteioDoDia() {
  const {
    draw, desafios, drawComboClaimed,
    setDraw, claimCombo, addPenalty, clearDay,
  } = useBolao();

  const { show } = useToast();
  const { fire } = useConfetti();

  const active = activeDraw(draw);
  const doneCount = dailyDoneCount(draw, desafios, AREAS);

  // ── Dispara quando animação termina ──────────────────────────────
  const handleSpinDone = useCallback(() => {
    const newDraw = rollDraw(DESAFIO_CATS, AREAS);
    setDraw(newDraw);
    fire();
    show("🎲 Desafios sorteados! Boa sorte!");
  }, [setDraw, fire, show]);

  const { spinning, slots, start } = useSlotAnimation(handleSpinDone);

  // ── Encerrar o dia ────────────────────────────────────────────────
  const handleCloseDay = () => {
    const { lost, missed } = closeDayResult(draw, desafios, AREAS, DESAFIO_CATS);
    if (lost > 0) {
      addPenalty(-lost);
      show(`⏱️ Dia encerrado: −${lost} pts por ${missed} sem evidência`);
    } else {
      show("🏅 Dia 100% cumprido!");
    }
    clearDay();
  };

  // ── Verificar combo ───────────────────────────────────────────────
  const handleCombo = useCallback(() => {
    if (shouldClaimCombo(doneCount, drawComboClaimed)) {
      claimCombo();
      fire();
      show("🔥 COMBO! +10 pts bônus!");
    }
  }, [doneCount, drawComboClaimed, claimCombo, fire, show]);

  // ── ESTADO 1: Sem sorteio ─────────────────────────────────────────
  if (!active && !spinning) {
    return (
      <div style={{
        background: "var(--card)", borderRadius: "var(--radius)",
        border: "1px solid var(--border)", padding: 20,
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="animate-dice" style={{ fontSize: 32, display: "inline-block" }}>🎲</span>
          <div>
            <h3 className="font-bebas" style={{ fontSize: 22, color: "var(--neon)", lineHeight: 1 }}>
              Sorteio do Dia
            </h3>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              4 desafios sorteados. Comprove com foto e ganhe pontos.
            </p>
          </div>
        </div>

        {/* Stakes */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STAKES.map((s) => (
            <span key={s.area} style={{
              padding: "4px 10px", borderRadius: 20, fontSize: 12,
              border: "1px solid var(--border)", color: "var(--muted)",
            }}>
              {s.label} <strong style={{ color: "var(--warn)" }}>±{s.pts}</strong>
            </span>
          ))}
        </div>

        <button
          aria-label="Sortear desafios de hoje"
          onClick={start}
          style={{
            padding: "14px 0", borderRadius: "var(--radius)",
            border: "none", background: "var(--field)",
            color: "var(--neon)", fontWeight: 700, fontSize: 15,
            cursor: "pointer", minHeight: 44,
          }}
        >
          🎲 Sortear desafios de hoje
        </button>
      </div>
    );
  }

  // ── ESTADO 2: Animação rodando ────────────────────────────────────
  if (spinning) {
    return (
      <div style={{
        background: "var(--card)", borderRadius: "var(--radius)",
        border: "1px solid var(--neon)", padding: 20,
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        <p className="font-bebas" style={{ fontSize: 20, color: "var(--neon)", textAlign: "center" }}>
          🎰 Sorteando...
        </p>
        {AREAS.map((area, i) => (
          <div key={area} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px",
            background: "var(--bg-2)", borderRadius: 8,
            border: "1px solid var(--border)",
            minHeight: 44, overflow: "hidden",
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>
              {DESAFIO_CATS.find(c => c.id === area)?.icon}
            </span>
            <span
              className={slots[i] ? "animate-settle" : ""}
              style={{
                fontSize: 13, color: slots[i] ? "var(--neon)" : "var(--muted)",
                fontWeight: slots[i] ? 600 : 400,
                transition: "color 0.1s",
                flex: 1,
              }}
            >
              {slots[i] ?? "..."}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ── ESTADO 3: Sorteio ativo ───────────────────────────────────────
  return (
    <div style={{
      background: "var(--card)", borderRadius: "var(--radius)",
      border: "1px solid var(--border)", padding: 20,
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      {/* Progresso */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="font-bebas" style={{ fontSize: 20, color: "var(--neon)" }}>
          🎲 Desafios de Hoje
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {AREAS.map((_, i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: "50%",
              background: i < doneCount ? "var(--neon)" : "var(--border)",
              transition: "background 0.3s",
            }} />
          ))}
          <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 4 }}>
            {doneCount}/4
          </span>
        </div>
      </div>

      {/* Linhas de desafio */}
      {AREAS.map((area) => {
        const cat = DESAFIO_CATS.find((c) => c.id === area)!;
        const id = drawnId(draw, area)!;
        const itemIdx = draw?.picks[area] ?? 0;
        const itemText = cat.items[itemIdx] ?? "—";
        const done = !!desafios[id];

        return (
          <div key={area} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 14px",
            background: done ? "var(--neon-soft)" : "var(--bg-2)",
            borderRadius: 10,
            border: `1px solid ${done ? "var(--neon)44" : "var(--border)"}`,
            transition: "background 0.2s, border-color 0.2s",
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{cat.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, marginBottom: 2 }}>
                {AREA_SHORT[area]} · vale {done ? "+" : "±"}{cat.pts} pts
              </p>
              <p style={{
                fontSize: 13, color: done ? "var(--text)" : "var(--text)",
                margin: 0, fontWeight: 500,
              }}>
                {itemText}
              </p>
            </div>
            <Evidencia
              itemId={id}
              label={itemText}
              pts={cat.pts}
              onDone={handleCombo}
            />
          </div>
        );
      })}

      {/* Banner combo */}
      {doneCount === 4 && (
        <div style={{
          textAlign: "center", padding: "10px 0",
          background: "linear-gradient(135deg, var(--gold)22, var(--neon)11)",
          borderRadius: 10, border: "1px solid var(--gold)55",
        }}>
          <span className="font-bebas" style={{ fontSize: 20, color: "var(--gold)" }}>
            🔥 COMBO DO DIA {drawComboClaimed ? "— +10 pts conquistados!" : "— clique para resgatar!"}
          </span>
          {!drawComboClaimed && (
            <div>
              <button
                onClick={() => { claimCombo(); fire(); show("🔥 COMBO! +10 pts bônus!"); }}
                style={{
                  marginTop: 8, padding: "8px 20px", borderRadius: 8,
                  background: "var(--gold)", color: "#000",
                  border: "none", fontWeight: 700, cursor: "pointer", fontSize: 13,
                }}
              >
                Resgatar +10 pts
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ações */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          aria-label="Novo sorteio"
          onClick={start}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 8,
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--muted)", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}
        >
          🎲 Novo sorteio
        </button>
        <button
          aria-label="Encerrar o dia"
          onClick={handleCloseDay}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 8,
            border: "1px solid var(--warn)55", background: "color-mix(in srgb, var(--warn) 10%, transparent)",
            color: "var(--warn)", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}
        >
          ⏱️ Encerrar o dia
        </button>
      </div>
    </div>
  );
}
