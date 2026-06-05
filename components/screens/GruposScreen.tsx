"use client";

import { GROUPS } from "@/lib/mock-data";
import { GrupoTabela } from "@/components/grupos/GrupoTabela";

export function GruposScreen() {
  return (
    <div className="animate-screen-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 className="font-bebas" style={{ fontSize: 28, color: "var(--text)", letterSpacing: 1 }}>
        📊 Grupos
      </h2>
      {GROUPS.map((g) => (
        <GrupoTabela key={g.name} group={g} />
      ))}
    </div>
  );
}
