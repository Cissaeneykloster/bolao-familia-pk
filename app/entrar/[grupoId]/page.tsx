"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useBolao } from "@/lib/store";
import { ADMINS } from "@/lib/mock-data";

export default function EntrarPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setCurrentGrupo, setCurrentUserApelido } = useBolao();

  const grupoId = params.grupoId as string;
  const grupo = ADMINS.find((a) => a.id === grupoId);

  // Apelido passado pelo admin no link: ?p=Ney
  const apelido = searchParams.get("p") ?? null;

  const [fase, setFase] = useState<"loading" | "welcome" | "invalid">("loading");

  useEffect(() => {
    if (!grupo) { setFase("invalid"); return; }

    // Salva grupo e apelido no store (persiste no localStorage)
    setCurrentGrupo(grupo.id);
    // trim: o apelido canônico é resolvido contra os participantes no sync
    if (apelido) setCurrentUserApelido(decodeURIComponent(apelido).trim());

    setFase("welcome");

    // Redireciona após mostrar a tela de boas-vindas
    const t = setTimeout(() => router.push("/"), 2200);
    return () => clearTimeout(t);
  }, [grupo, apelido, setCurrentGrupo, setCurrentUserApelido, router]);

  // ── Link inválido ─────────────────────────────────────────────
  if (fase === "invalid") {
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

  // ── Boas-vindas ───────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#0a0f0d", color: "#e8f5ee",
      gap: 20, padding: 32, textAlign: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Emoji do grupo */}
      <span style={{ fontSize: 72, lineHeight: 1 }}>
        {grupo?.emoji ?? "⚽"}
      </span>

      {/* Saudação personalizada */}
      {apelido ? (
        <div>
          <h1 style={{
            fontSize: 32, margin: "0 0 8px",
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            color: "#00ff87", letterSpacing: 2,
          }}>
            Olá, {decodeURIComponent(apelido)}! 👋
          </h1>
          <p style={{ fontSize: 16, color: "#7aab8e", margin: 0 }}>
            Bem-vindo ao
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 16, color: "#7aab8e", margin: 0 }}>
          Entrando no
        </p>
      )}

      {/* Nome do grupo */}
      <div style={{
        padding: "12px 28px", borderRadius: 12,
        background: "rgba(0,255,135,0.08)",
        border: "1px solid rgba(0,255,135,0.25)",
      }}>
        <h2 style={{
          fontSize: 22, margin: 0,
          fontFamily: "'Bebas Neue', Impact, sans-serif",
          color: "#00ff87", letterSpacing: 1,
        }}>
          {grupo?.nomeGrupo ?? "Bolão Copa 2026"}
        </h2>
      </div>

      <p style={{ fontSize: 14, color: "#7aab8e" }}>
        ⚽ Copa do Mundo 2026
      </p>

      {/* Loading dots */}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#00ff87",
            opacity: 0.3 + i * 0.25,
            animation: `pulse 1s ease-in-out ${i * 0.2}s infinite alternate`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          from { opacity: 0.3; transform: scale(0.8); }
          to   { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
