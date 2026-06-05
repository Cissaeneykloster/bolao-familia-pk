"use client";

import { useBolao } from "@/lib/store";
import { AdminPanel } from "@/components/admin/AdminPanel";

export function AdminScreen() {
  const { adminUnlocked } = useBolao();

  if (!adminUnlocked) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "60vh", gap: 12,
      }}>
        <span style={{ fontSize: 48 }}>🔒</span>
        <p className="font-bebas" style={{ fontSize: 22, color: "var(--muted)" }}>
          Acesso restrito
        </p>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Use o botão ⚙ → Área da gerência para entrar.
        </p>
      </div>
    );
  }

  return <AdminPanel />;
}
