"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useBolao } from "@/lib/store";
import { rankWithEff, bonusPts, effPts } from "@/lib/scoring";
import { useDesafioCats } from "@/lib/useDesafios";
import { participantesToPlayers } from "@/lib/players";
import type { Player } from "@/lib/types";

// MAX_PTS é calculado dinamicamente no componente

function TrendIcon({ trend }: { trend: Player["trend"] }) {
  if (trend === "up")   return <span style={{ color: "var(--ok)",    fontSize: 14 }}>↑</span>;
  if (trend === "down") return <span style={{ color: "var(--danger)", fontSize: 14 }}>↓</span>;
  return <span style={{ color: "var(--muted)", fontSize: 14 }}>→</span>;
}

function PlayerAvatar({ player }: { player: Player }) {
  // Cor única derivada do nome
  const hue = player.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      aria-label={`Avatar de ${player.name}`}
      style={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        background: `hsl(${hue}, 50%, 30%)`,
        border: `1.5px solid hsl(${hue}, 60%, 50%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, color: `hsl(${hue}, 80%, 85%)`,
      }}
    >
      {player.initials}
    </div>
  );
}

export function RankingList() {
  const { adminDelta, desafios, comboBank, penalty, participantes, currentGrupoId, matchPts, challengePts } = useBolao();
  const DESAFIO_CATS = useDesafioCats();
  const bonus = bonusPts(desafios, DESAFIO_CATS, comboBank, penalty);
  const doGrupo = currentGrupoId
    ? participantes.filter((p) => p.grupoId === currentGrupoId && p.ativo)
    : participantes.filter((p) => p.ativo);
  const players = participantesToPlayers(doGrupo, matchPts, challengePts);
  const ranked = rankWithEff(players, adminDelta, bonus);
  const rest = ranked.slice(3); // 4º em diante
  const maxEff = ranked.length > 0 ? effPts(ranked[0], adminDelta, bonus) : 1;

  return (
    <div
      role="list"
      aria-label="Lista de classificação"
      style={{ display: "flex", flexDirection: "column", gap: 6 }}
    >
      <AnimatePresence>
        {rest.map((p, i) => {
          const pts = effPts(p, adminDelta, bonus);
          const pos = i + 4;
          const pct = maxEff > 0 ? (pts / maxEff) * 100 : 0;

          return (
            <motion.div
              key={p.name}
              layout
              role="listitem"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "var(--card)", borderRadius: "var(--radius)",
                border: "1px solid var(--border)", padding: "10px 12px",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "var(--card-hover)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--field-light)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "var(--card)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
              }}
            >
              {/* Posição */}
              <span
                className="font-bebas"
                style={{ width: 24, textAlign: "center", fontSize: 20, color: "var(--muted)", flexShrink: 0 }}
              >
                {pos}
              </span>

              {/* Tendência */}
              <TrendIcon trend={p.trend} />

              {/* Avatar */}
              <PlayerAvatar player={p} />

              {/* Nome + barra */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </span>
                  {p.you && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, background: "var(--neon)", color: "#000",
                      borderRadius: 4, padding: "1px 4px",
                    }}>
                      VOCÊ
                    </span>
                  )}
                </div>
                {/* Barra de progresso */}
                <div style={{ height: 3, background: "var(--border)", borderRadius: 2, marginTop: 4 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "var(--field-light)", borderRadius: 2, transition: "width 0.4s" }} />
                </div>
              </div>

              {/* Acertos exatos */}
              <span style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>
                🎯 {p.exact}
              </span>

              {/* Pontuação */}
              <motion.span
                key={pts}
                initial={{ scale: 1.2, color: "var(--neon)" }}
                animate={{ scale: 1, color: "var(--text)" }}
                transition={{ duration: 0.3 }}
                className="font-bebas"
                style={{ fontSize: 22, flexShrink: 0, minWidth: 44, textAlign: "right" }}
              >
                {pts}
              </motion.span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
