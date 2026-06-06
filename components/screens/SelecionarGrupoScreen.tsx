"use client";

import { useBolao } from "@/lib/store";
import { ADMINS } from "@/lib/mock-data";

export function SelecionarGrupoScreen() {
  const { setCurrentGrupo } = useBolao();

  return (
    <div
      className="animate-screen-in"
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "70vh", gap: 24, padding: "0 16px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 48, marginBottom: 8 }}>⚽</p>
        <h2 className="font-bebas" style={{ fontSize: 32, color: "var(--neon)", letterSpacing: 1 }}>
          Bolão Copa 2026
        </h2>
        <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 6 }}>
          Selecione o seu grupo para entrar no bolão:
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
        {ADMINS.map((admin) => (
          <button
            key={admin.id}
            onClick={() => setCurrentGrupo(admin.id)}
            style={{
              padding: "16px 20px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: "var(--card)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
              textAlign: "left",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--neon)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--card-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--card)";
            }}
          >
            <span style={{ fontSize: 32 }}>{admin.emoji}</span>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>
                {admin.nomeGrupo}
              </p>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, marginTop: 2 }}>
                Entrar no bolão deste grupo
              </p>
            </div>
            <span style={{ marginLeft: "auto", color: "var(--neon)", fontSize: 18 }}>→</span>
          </button>
        ))}
      </div>

      <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", maxWidth: 280 }}>
        Se você recebeu um link pelo WhatsApp, clique nele para entrar direto com seu nome.
        Aqui você pode escolher o grupo manualmente.
      </p>
    </div>
  );
}
