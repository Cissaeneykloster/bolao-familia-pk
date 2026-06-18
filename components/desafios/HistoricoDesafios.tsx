"use client";

import { useEffect, useState } from "react";
import { useBolao } from "@/lib/store";
import { loadMyChallengeHistory, type ChallengeHistoryItem } from "@/lib/supabase-sync";
import { challengeCode } from "@/lib/daily";
import type { Area } from "@/lib/types";

/** Formata "2026-06-18" → "18/06". */
function ddmm(dateBrt: string): string {
  const [, m, d] = dateBrt.split("-");
  return d && m ? `${d}/${m}` : dateBrt;
}

/**
 * Histórico dos desafios do participante: lista de tudo que ele marcou, com o
 * total de pontos acumulado de todos os desafios realizados.
 */
export function HistoricoDesafios() {
  const { currentUserApelido, currentGrupoId, myChallengeDone, challengePts } = useBolao();
  const [items, setItems] = useState<ChallengeHistoryItem[]>([]);

  // Recarrega ao trocar de usuário/grupo e quando o estado de hoje/pontos muda
  useEffect(() => {
    let vivo = true;
    if (!currentUserApelido) { setItems([]); return; }
    loadMyChallengeHistory(currentUserApelido, currentGrupoId ?? "").then((r) => {
      if (vivo) setItems(r);
    });
    return () => { vivo = false; };
  }, [currentUserApelido, currentGrupoId, myChallengeDone, challengePts]);

  if (!currentUserApelido || items.length === 0) return null;

  const realizados = items.filter((i) => i.done).length;
  const total = items.reduce((s, i) => s + i.pts, 0);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 className="font-bebas" style={{ fontSize: 20, color: "var(--text)", letterSpacing: 1, margin: 0 }}>
          📜 Histórico de desafios
        </h3>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>
          {realizados} realizado{realizados === 1 ? "" : "s"}
        </span>
      </div>

      {/* Total acumulado */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", borderRadius: 10,
        background: "var(--bg-2)", border: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>Total acumulado</span>
        <span className="font-bebas" style={{ fontSize: 22, color: total >= 0 ? "var(--neon)" : "var(--danger)" }}>
          {total > 0 ? "+" : ""}{total} pts
        </span>
      </div>

      {/* Lista */}
      <div style={{
        display: "flex", flexDirection: "column",
        background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden",
      }}>
        {items.map((it) => {
          const code = it.area ? challengeCode(it.area as Area, it.itemIdx) : "—";
          return (
            <div key={it.dateBrt} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderTop: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: 16 }}>{it.done ? "✅" : "❌"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <strong style={{ color: "var(--gold)" }}>{code}</strong>
                  {it.descricao ? ` · ${it.descricao}` : ""}
                </p>
                <p style={{ fontSize: 10, color: "var(--muted)", margin: 0 }}>{ddmm(it.dateBrt)}</p>
              </div>
              <span className="font-bebas" style={{ fontSize: 15, color: it.pts >= 0 ? "var(--neon)" : "var(--danger)" }}>
                {it.pts > 0 ? "+" : ""}{it.pts}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
