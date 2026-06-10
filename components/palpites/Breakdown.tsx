"use client";

import { breakdown } from "@/lib/scoring";
import { useLang, T } from "@/lib/useLang";

interface BreakdownProps {
  actual: { sa: number; sb: number };
  guess: { a: number; b: number };
  compact?: boolean;
}

export function Breakdown({ actual, guess, compact = false }: BreakdownProps) {
  const lang = useLang();
  const t = T[lang];
  const bd = breakdown(actual, guess);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 3 : 5 }}>
      {bd.rows.map((r) => (
        <div
          key={r.key}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: compact ? 11 : 13,
            padding: compact ? "2px 0" : "4px 0",
            borderBottom: compact ? "none" : "1px solid var(--border)",
          }}
        >
          <span style={{ color: r.hit ? "var(--text)" : "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>{r.hit ? "✅" : "❌"}</span>
            {t.breakdownLabels[r.key as keyof typeof t.breakdownLabels] ?? r.label}
          </span>
          <span style={{
            fontWeight: 700,
            color: r.hit ? "var(--neon)" : "var(--muted)",
          }}>
            {r.hit ? `+${r.pts}` : "+0"}
          </span>
        </div>
      ))}

      {/* Total */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: compact ? 4 : 8,
        paddingTop: 6,
        borderTop: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: compact ? 12 : 14, fontWeight: 700, color: "var(--text)" }}>
          {t.total}
        </span>
        <span style={{
          fontSize: compact ? 14 : 18,
          fontWeight: 700,
          color: "var(--neon)",
          background: "var(--neon-soft)",
          padding: "2px 10px",
          borderRadius: 8,
        }}>
          ⚡ +{bd.total} pts
        </span>
      </div>
    </div>
  );
}
