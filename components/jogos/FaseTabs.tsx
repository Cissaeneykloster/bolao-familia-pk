"use client";

import { useState } from "react";
import { MATCHES } from "@/lib/mock-data";
import { JogoCard } from "./JogoCard";
import { useLang, T } from "@/lib/useLang";

type Fase = "amistoso" | "grupos" | "oitavas" | "quartas" | "semi" | "final";

export function FaseTabs() {
  const [fase, setFase] = useState<Fase>("amistoso");
  const lang = useLang();
  const t = T[lang];

  const FASES: { id: Fase; label: string; sublabel: string; emoji: string }[] = [
    { id: "amistoso", label: lang === "en" ? "Training" : "Treino",  sublabel: lang === "en" ? "training" : "treino", emoji: "🎯" },
    { id: "grupos",   label: lang === "en" ? "Groups"   : "Grupos",  sublabel: "", emoji: "📊" },
    { id: "oitavas",  label: lang === "en" ? "Round 16" : "Oitavas", sublabel: "", emoji: "⚔️" },
    { id: "quartas",  label: lang === "en" ? "Quarters" : "Quartas", sublabel: "", emoji: "🏅" },
    { id: "semi",     label: lang === "en" ? "Semis"    : "Semi",    sublabel: "", emoji: "🔥" },
    { id: "final",    label: "Final",                                 sublabel: "", emoji: "🏆" },
  ];

  const filtered = MATCHES.filter((m) => m.phase === fase);
  const sorted = [...filtered].sort((a, b) => (a.kickoff ?? 0) - (b.kickoff ?? 0));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Tabs de fase */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {FASES.map((f) => {
          const active = fase === f.id;
          const count = MATCHES.filter((m) => m.phase === f.id).length;
          if (count === 0) return null;
          return (
            <button
              key={f.id}
              aria-label={f.label}
              onClick={() => setFase(f.id)}
              style={{
                padding: "7px 14px", borderRadius: 20, fontSize: 12,
                border: `1px solid ${active ? (f.id === "amistoso" ? "var(--warn)" : "var(--neon)") : "var(--border)"}`,
                background: active ? (f.id === "amistoso" ? "rgba(255,216,77,0.12)" : "var(--neon-soft)") : "transparent",
                color: active ? (f.id === "amistoso" ? "var(--warn)" : "var(--neon)") : "var(--muted)",
                fontWeight: active ? 700 : 400, cursor: "pointer",
                transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {f.emoji} {f.label}
              {f.id === "amistoso" && f.sublabel && (
                <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>{f.sublabel}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Banner treino */}
      {fase === "amistoso" && (
        <div style={{
          padding: "10px 14px", borderRadius: 10,
          background: "rgba(255,216,77,0.08)", border: "1px solid rgba(255,216,77,0.3)",
          fontSize: 12, color: "var(--warn)", display: "flex", alignItems: "center", gap: 8,
        }}>
          🎯 <span>{t.apostasDesc}</span>
        </div>
      )}

      {sorted.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", padding: "32px 0" }}>
          {lang === "en" ? "No matches in this phase yet." : "Nenhum jogo nessa fase ainda."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((m) => <JogoCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  );
}
