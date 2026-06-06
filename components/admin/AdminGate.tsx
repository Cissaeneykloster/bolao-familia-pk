"use client";

import { useState } from "react";
import { useBolao } from "@/lib/store";
import { findAdmin } from "@/lib/mock-data";

interface AdminGateProps {
  open: boolean;
  onClose: () => void;
}

export function AdminGate({ open, onClose }: AdminGateProps) {
  const { setAdminUnlocked, setAdminGrupo, setCurrentGrupo, setScreen } = useBolao();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  if (!open) return null;

  const { migrateParticipantes } = useBolao();

  const submit = () => {
    const admin = findAdmin(user, pass);
    if (admin) {
      setAdminUnlocked(true);
      setAdminGrupo(admin.id);
      setCurrentGrupo(admin.id);
      // Migra automaticamente participantes sem grupoId para este grupo
      migrateParticipantes(admin.id);
      setScreen("admin" as Parameters<typeof setScreen>[0]);
      onClose();
    } else {
      setError(true);
      setShake(true);
      setPass("");
      setTimeout(() => setShake(false), 400);
    }
  };

  const fieldStyle: React.CSSProperties = {
    display: "block", width: "100%", marginTop: 6,
    padding: "10px 12px", borderRadius: 8, fontSize: 15,
    border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
    background: "var(--bg-2)", color: "var(--text)", outline: "none",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 400 }} />
      <div
        role="dialog"
        aria-label="Área da gerência"
        className={shake ? "animate-shake" : ""}
        style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          background: "var(--card)", borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          padding: 28, zIndex: 401,
          width: "min(340px, 90vw)",
          display: "flex", flexDirection: "column", gap: 14,
        }}
      >
        <h3 className="font-bebas" style={{ fontSize: 22, color: "var(--text)" }}>
          🔒 Área da Gerência
        </h3>

        <label style={{ fontSize: 13, color: "var(--muted)" }}>
          Usuário
          <input
            aria-label="Usuário"
            type="text"
            autoComplete="username"
            value={user}
            onChange={(e) => { setUser(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            style={fieldStyle}
            placeholder="Admin"
          />
        </label>

        <label style={{ fontSize: 13, color: "var(--muted)" }}>
          Senha
          <input
            aria-label="Senha"
            type="password"
            autoComplete="current-password"
            value={pass}
            onChange={(e) => { setPass(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            style={fieldStyle}
            placeholder="••••"
          />
        </label>

        {error && (
          <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>
            Usuário ou senha incorretos.
          </p>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--muted)", cursor: "pointer", fontSize: 13,
            }}
          >
            Cancelar
          </button>
          <button
            aria-label="Entrar"
            onClick={submit}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8,
              border: "none", background: "var(--neon)",
              color: "var(--bg)", cursor: "pointer",
              fontWeight: 700, fontSize: 13,
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    </>
  );
}
