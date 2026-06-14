"use client";

import { useBolao } from "@/lib/store";
import { useDesafioCats } from "@/lib/useDesafios";
import { todayBrasilia } from "@/lib/daily";

// Banco de desafios — agora apenas leitura: destaca o desafio sorteado de hoje
// e marca os demais com strikethrough (indisponíveis).
export function BancoDeDesafios() {
  const { dailyDraw } = useBolao();
  const CATS = useDesafioCats();
  const today = todayBrasilia();
  const draw = dailyDraw && dailyDraw.dateBrt === today ? dailyDraw : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 className="font-bebas" style={{ fontSize: 20, color: "var(--text)", letterSpacing: 1 }}>
        📋 Banco de Desafios
      </h3>
      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: -8 }}>
        Só o desafio <strong style={{ color: "var(--neon)" }}>sorteado de hoje</strong> vale pontos —
        os demais ficam indisponíveis.
      </p>

      {CATS.map((cat) => (
        <div key={cat.id} style={{
          background: "var(--card)", borderRadius: "var(--radius)",
          border: "1px solid var(--border)", overflow: "hidden",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg-2)",
          }}>
            <span style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}>
              {cat.icon} {cat.name}
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>vale ±{cat.pts} pts</span>
          </div>

          <div style={{ padding: "8px 0" }}>
            {cat.items.map((item, i) => {
              const isDrawn = !!draw && draw.area === cat.id && draw.itemIdx === i;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
                    borderBottom: i < cat.items.length - 1 ? "1px solid var(--border)" : "none",
                    background: isDrawn ? "var(--neon-soft)" : "transparent",
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{isDrawn ? "🎯" : "🔒"}</span>
                  <span style={{
                    fontSize: 13, flex: 1,
                    color: isDrawn ? "var(--text)" : "var(--muted)",
                    textDecoration: isDrawn ? "none" : "line-through",
                    opacity: isDrawn ? 1 : 0.6,
                  }}>
                    {item}
                  </span>
                  {isDrawn ? (
                    <span style={{ fontSize: 11, color: "var(--neon)", fontWeight: 700 }}>
                      sorteado · ±{cat.pts}
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>indisponível</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
