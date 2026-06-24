"use client";

import { useState } from "react";
import { useBolao } from "@/lib/store";
import { rankWithEff, bonusPts, effPts } from "@/lib/scoring";
import { useDesafioCats } from "@/lib/useDesafios";
import { participantesToPlayers } from "@/lib/players";
import { TIERS, tierForRank } from "@/lib/tiers";
import { PointsBreakdown } from "./PointsBreakdown";
import type { Player } from "@/lib/types";

export function ThematicGroups() {
  const { adminDelta, desafios, comboBank, penalty, participantes, currentGrupoId, matchPts, challengePts, groupPredPts } = useBolao();
  const DESAFIO_CATS = useDesafioCats();
  const bonus = bonusPts(desafios, DESAFIO_CATS, comboBank, penalty);
  const [openName, setOpenName] = useState<string | null>(null);

  const doGrupo = currentGrupoId
    ? participantes.filter((p) => p.grupoId === currentGrupoId && p.ativo)
    : participantes.filter((p) => p.ativo);
  const players = participantesToPlayers(doGrupo, matchPts, challengePts, groupPredPts);
  const ranked = rankWithEff(players, adminDelta, bonus);

  // Pódio (1º, 2º, 3º) fica fora; só do 4º em diante entra nos grupos temáticos
  if (ranked.length <= 3) return null;

  // Tier por quartil de posição (percentil sobre o ranking completo), pulando o top 3
  const groups: Player[][] = TIERS.map(() => []);
  ranked.forEach((p, i) => {
    if (i < 3) return; // 1º, 2º e 3º aparecem no pódio
    groups[tierForRank(i, ranked.length)].push(p);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h3 className="font-bebas" style={{ fontSize: 22, color: "var(--text)", letterSpacing: 1, margin: 0 }}>
        🎭 Grupos Temáticos
      </h3>
      <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 2px" }}>
        Do 4º colocado em diante, encaixados pela posição no ranking (quartis).
      </p>

      {TIERS.map((tier, ti) => {
        const members = groups[ti];
        if (members.length === 0) return null;
        return (
          <div
            key={tier.name}
            style={{
              background: "var(--card)", borderRadius: "var(--radius)",
              border: "1px solid var(--border)", overflow: "hidden",
            }}
          >
            {/* Cabeçalho do grupo */}
            <div style={{
              display: "flex", alignItems: "baseline", gap: 8,
              padding: "8px 12px", background: "var(--bg-2)",
              borderBottom: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: 16 }}>{tier.emoji}</span>
              <span className="font-bebas" style={{ fontSize: 16, color: "var(--neon)" }}>
                {tier.name}
              </span>
              <span style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
                {tier.vibe}
              </span>
            </div>

            {/* Membros — clique abre o detalhamento dos pontos */}
            {members.map((p) => {
              const open = openName === p.name;
              return (
                <div key={p.name} style={{ borderTop: "1px solid var(--border)" }}>
                  <button
                    onClick={() => setOpenName(open ? null : p.name)}
                    aria-label={`Detalhar pontos de ${p.name}`}
                    style={{
                      width: "100%", background: "none", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
                    }}
                  >
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: "var(--field)", color: "var(--neon)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700,
                    }}>
                      {p.initials}
                    </div>
                    <span style={{ flex: 1, textAlign: "left", fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </span>
                    <span className="font-bebas" style={{ fontSize: 16, color: "var(--text)" }}>
                      {effPts(p, adminDelta, bonus)}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--muted)", width: 12 }}>{open ? "▴" : "▾"}</span>
                  </button>
                  {open && (
                    <div style={{ padding: "2px 12px 10px 46px", background: "var(--bg-2)" }}>
                      <PointsBreakdown name={p.name} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
