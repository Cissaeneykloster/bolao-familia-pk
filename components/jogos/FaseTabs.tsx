"use client";

import { useState } from "react";
import { MATCHES } from "@/lib/mock-data";
import { JogoCard } from "./JogoCard";

type Fase = "grupos" | "oitavas" | "final";
const FASES: { id: Fase; label: string }[] = [
  { id: "grupos",  label: "Grupos" },
  { id: "oitavas", label: "Oitavas" },
  { id: "final",   label: "Final" },
];

export function FaseTabs() {
  const [fase, setFase] = useState<Fase>("grupos");
  const filtered = MATCHES.filter((m) => m.phase === fase);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Tabs de fase */}
      <div style={{ display: "flex", gap: 6 }}>
        {FASES.map((f) => {
          const active = fase === f.id;
          return (
            <button
              key={f.id}
              aria-label={f.label}
              onClick={() => setFase(f.id)}
              style={{
                padding: "7px 16px", borderRadius: 20, fontSize: 13,
                border: `1px solid ${active ? "var(--neon)" : "var(--border)"}`,
                background: active ? "var(--neon-soft)" : "transparent",
                color: active ? "var(--neon)" : "var(--muted)",
                fontWeight: active ? 700 : 400, cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Jogos */}
      {filtered.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", padding: "32px 0" }}>
          Nenhum jogo nessa fase ainda.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((m) => <JogoCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  );
}
