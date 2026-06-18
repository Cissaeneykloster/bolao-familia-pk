"use client";

import { useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { useBolao } from "@/lib/store";
import { rankWithEff, bonusPts, effPts } from "@/lib/scoring";
import { useDesafioCats } from "@/lib/useDesafios";
import { participantesToPlayers } from "@/lib/players";
import { PointsBreakdown } from "./PointsBreakdown";
import type { Player } from "@/lib/types";

// Nome do pódio: ao clicar, abre um popover com a origem dos pontos.
function PodiumName({ name, color, wrapStyle, btnStyle }: {
  name: string; color: string; wrapStyle?: CSSProperties; btnStyle?: CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", ...wrapStyle }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Detalhar pontos de ${name}`}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          color: "var(--text)", fontWeight: 600, maxWidth: "100%",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          textDecoration: "underline dotted", textUnderlineOffset: 2,
          ...btnStyle,
        }}
      >
        {name}
      </button>
      {open && (
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          bottom: "calc(100% + 6px)", zIndex: 20, width: 190,
          background: "var(--card)", border: `1px solid ${color}66`, borderRadius: 10,
          padding: "8px 12px", boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
        }}>
          <PointsBreakdown name={name} />
        </div>
      )}
    </div>
  );
}

const PODIUM_CFG = {
  1: { color: "var(--gold)",   shadow: "0 0 24px var(--gold)",   h: 104, order: 2, size: 72, delay: 0.1 },
  2: { color: "var(--silver)", shadow: "0 0 14px var(--silver)", h: 74,  order: 1, size: 58, delay: 0.2 },
  3: { color: "var(--bronze)", shadow: "0 0 14px var(--bronze)", h: 58,  order: 3, size: 50, delay: 0.3 },
} as const;

function Avatar({ player, size, border, shadow }: {
  player: Player; size: number; border: string; shadow: string;
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid ${border}`,
      boxShadow: shadow,
      background: "var(--field)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 700, color: border,
      position: "relative",
    }}>
      {player.initials}
      {player.you && (
        <span style={{
          position: "absolute", bottom: -2, right: -2,
          background: "var(--neon)", borderRadius: "50%",
          width: 14, height: 14, fontSize: 8,
          display: "flex", alignItems: "center", justifyContent: "center", color: "#000",
        }}>✓</span>
      )}
    </div>
  );
}

// ── Variação A: Pódio olímpico ─────────────────────────────────────
function PodiumA({ top3, adminDelta, bonus }: { top3: Player[]; adminDelta: Record<string, number>; bonus: number }) {
  // Ordem de exibição: [2º, 1º, 3º]
  const display = [top3[1], top3[0], top3[2]].filter(Boolean);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 8, padding: "16px 0 0" }}>
      {display.map((p) => {
        const pos = top3.indexOf(p) + 1 as 1 | 2 | 3;
        const cfg = PODIUM_CFG[pos];
        return (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: cfg.delay, type: "spring", stiffness: 180 }}
            style={{ order: cfg.order, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
          >
            {pos === 1 && <span style={{ fontSize: 20 }}>👑</span>}
            <Avatar player={p} size={cfg.size} border={cfg.color} shadow={cfg.shadow} />
            <PodiumName name={p.name} color={cfg.color} btnStyle={{ fontSize: 11, maxWidth: 70, textAlign: "center" }} />
            <motion.span
              className="font-bebas"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: cfg.delay + 0.2, type: "spring" }}
              style={{ fontSize: 20, color: cfg.color }}
            >
              {effPts(p, adminDelta, bonus)}
            </motion.span>
            {/* Pedestal */}
            <div style={{
              width: 70, height: cfg.h,
              background: `linear-gradient(to top, ${cfg.color}55, ${cfg.color}22)`,
              borderTop: `2px solid ${cfg.color}`,
              borderRadius: "4px 4px 0 0",
            }} />
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Variação B: Cards lado a lado ─────────────────────────────────
function PodiumB({ top3, adminDelta, bonus }: { top3: Player[]; adminDelta: Record<string, number>; bonus: number }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "8px 0" }}>
      {top3.slice(0, 3).map((p, i) => {
        const pos = (i + 1) as 1 | 2 | 3;
        const cfg = PODIUM_CFG[pos];
        return (
          <div key={p.name} style={{
            flex: 1, background: "var(--card)", borderRadius: "var(--radius)",
            border: `1px solid ${cfg.color}66`, padding: "12px 8px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          }}>
            <span className="font-bebas" style={{ fontSize: 28, color: cfg.color }}>{pos}</span>
            <Avatar player={p} size={44} border={cfg.color} shadow={cfg.shadow} />
            <PodiumName name={p.name} color={cfg.color} btnStyle={{ fontSize: 11, textAlign: "center" }} />
            <span className="font-bebas" style={{ fontSize: 18, color: cfg.color }}>
              {effPts(p, adminDelta, bonus)} pts
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Variação C: Lista horizontal ──────────────────────────────────
function PodiumC({ top3, adminDelta, bonus }: { top3: Player[]; adminDelta: Record<string, number>; bonus: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 0" }}>
      {top3.slice(0, 3).map((p, i) => {
        const pos = (i + 1) as 1 | 2 | 3;
        const cfg = PODIUM_CFG[pos];
        return (
          <div key={p.name} style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "var(--card)", borderRadius: "var(--radius)",
            border: `1px solid ${cfg.color}55`, padding: "10px 14px",
          }}>
            <span className="font-bebas" style={{ fontSize: 28, color: cfg.color, width: 24 }}>{pos}</span>
            <Avatar player={p} size={36} border={cfg.color} shadow={cfg.shadow} />
            <PodiumName name={p.name} color={cfg.color} wrapStyle={{ flex: 1 }} btnStyle={{ fontSize: 14, textAlign: "left" }} />
            <span className="font-bebas" style={{ fontSize: 22, color: cfg.color }}>
              {effPts(p, adminDelta, bonus)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────
export function Podium() {
  const { podium, adminDelta, desafios, comboBank, penalty, participantes, currentGrupoId, matchPts, challengePts } = useBolao();
  const DESAFIO_CATS = useDesafioCats();
  const bonus = bonusPts(desafios, DESAFIO_CATS, comboBank, penalty);
  const doGrupo = currentGrupoId
    ? participantes.filter((p) => p.grupoId === currentGrupoId && p.ativo)
    : participantes.filter((p) => p.ativo);
  const players = participantesToPlayers(doGrupo, matchPts, challengePts);
  const ranked = rankWithEff(players, adminDelta, bonus);
  const top3 = ranked.slice(0, 3);

  if (players.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--muted)" }}>
        <p style={{ fontSize: 32 }}>🏆</p>
        <p style={{ fontSize: 14, marginTop: 8 }}>
          Nenhum participante cadastrado ainda.
        </p>
        <p style={{ fontSize: 12, marginTop: 4 }}>
          Acesse ⚙ → Gerência → 👥 Pessoas para cadastrar.
        </p>
      </div>
    );
  }

  if (podium === "b") return <PodiumB top3={top3} adminDelta={adminDelta} bonus={bonus} />;
  if (podium === "c") return <PodiumC top3={top3} adminDelta={adminDelta} bonus={bonus} />;
  return <PodiumA top3={top3} adminDelta={adminDelta} bonus={bonus} />;
}
