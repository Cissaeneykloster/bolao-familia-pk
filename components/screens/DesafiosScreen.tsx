"use client";

import { SorteioDoDia } from "@/components/desafios/SorteioDoDia";
import { BancoDeDesafios } from "@/components/desafios/BancoDeDesafios";

export function DesafiosScreen() {
  return (
    <div className="animate-screen-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 className="font-bebas" style={{ fontSize: 28, color: "var(--text)", letterSpacing: 1 }}>
        🎮 Desafios
      </h2>
      <SorteioDoDia />
      <div style={{ height: 1, background: "var(--border)" }} />
      <BancoDeDesafios />
    </div>
  );
}
