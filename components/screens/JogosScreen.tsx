"use client";

import { FaseTabs } from "@/components/jogos/FaseTabs";

export function JogosScreen() {
  return (
    <div className="animate-screen-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 className="font-bebas" style={{ fontSize: 28, color: "var(--text)", letterSpacing: 1 }}>
        ⚽ Jogos
      </h2>
      <FaseTabs />
    </div>
  );
}
