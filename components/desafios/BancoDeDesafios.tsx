"use client";

import { useBolao } from "@/lib/store";
import { useDesafioCats } from "@/lib/useDesafios";

export function BancoDeDesafios() {
  const { desafios, toggleDesafio } = useBolao();
  const CATS = useDesafioCats();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 className="font-bebas" style={{ fontSize: 20, color: "var(--text)", letterSpacing: 1 }}>
        📋 Banco de Desafios
      </h3>
      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: -8 }}>
        Marque para treinar — não conta pontos nesta seção.
      </p>

      {CATS.map((cat) => {
        const done = cat.items.filter((_, i) => desafios[`${cat.id}-${i}`]).length;
        return (
          <div key={cat.id} style={{
            background: "var(--card)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-2)",
            }}>
              <span style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}>
                {cat.icon} {cat.name}
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                {done}/{cat.items.length} · vale ±{cat.pts} pts
              </span>
            </div>

            <div style={{ padding: "8px 0" }}>
              {cat.items.map((item, i) => {
                const id = `${cat.id}-${i}`;
                const checked = !!desafios[id];
                return (
                  <label
                    key={id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 14px",
                      cursor: "pointer",
                      borderBottom: i < cat.items.length - 1 ? "1px solid var(--border)" : "none",
                      background: checked ? "var(--neon-soft)" : "transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDesafio(id)}
                      aria-label={item}
                      style={{ width: 16, height: 16, accentColor: "var(--neon)", cursor: "pointer", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 13, color: checked ? "var(--text)" : "var(--muted)", flex: 1 }}>
                      {item}
                    </span>
                    {checked && (
                      <span style={{ fontSize: 11, color: "var(--neon)", fontWeight: 700 }}>
                        +{cat.pts}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
