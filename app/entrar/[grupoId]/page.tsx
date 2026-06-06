"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBolao } from "@/lib/store";
import { ADMINS } from "@/lib/mock-data";

export default function EntrarPage() {
  const params = useParams();
  const router = useRouter();
  const { setCurrentGrupo } = useBolao();

  const grupoId = params.grupoId as string;
  const grupo = ADMINS.find((a) => a.id === grupoId);

  useEffect(() => {
    if (grupo) {
      setCurrentGrupo(grupo.id);
      // Pequena pausa para garantir que o estado foi salvo
      const t = setTimeout(() => router.push("/"), 1200);
      return () => clearTimeout(t);
    }
  }, [grupo, setCurrentGrupo, router]);

  if (!grupo) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#0a0f0d", color: "#e8f5ee", gap: 16, padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}>
        <span style={{ fontSize: 48 }}>❌</span>
        <h2 style={{ fontSize: 22, margin: 0 }}>Link inválido</h2>
        <p style={{ fontSize: 14, color: "#7aab8e", textAlign: "center" }}>
          Este link de acesso não é válido. Peça ao administrador um novo link.
        </p>
        <button
          onClick={() => router.push("/")}
          style={{
            marginTop: 8, padding: "12px 24px", borderRadius: 10,
            background: "#1a6b3c", color: "#00ff87",
            border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700,
          }}
        >
          Ir para o início
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#0a0f0d", color: "#e8f5ee", gap: 20, padding: 24,
      fontFamily: "system-ui, sans-serif",
    }}>
      <span style={{ fontSize: 64 }}>{grupo.emoji}</span>
      <h2 style={{ fontSize: 28, margin: 0, color: "#00ff87", letterSpacing: 1 }}>
        {grupo.nomeGrupo}
      </h2>
      <p style={{ fontSize: 15, color: "#7aab8e", margin: 0 }}>
        Entrando no bolão...
      </p>

      {/* Spinner */}
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid #1f3328",
        borderTop: "3px solid #00ff87",
        animation: "spin 0.8s linear infinite",
      }} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
