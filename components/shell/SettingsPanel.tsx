"use client";

import { useState } from "react";
import { useBolao } from "@/lib/store";
import { AdminGate } from "@/components/admin/AdminGate";
import { ADMINS } from "@/lib/mock-data";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

type StyleGroup = "podium" | "card" | "palpite";
type StyleVal = "a" | "b" | "c";

const STYLE_OPTIONS: {
  group: StyleGroup;
  label: string;
  opts: { val: StyleVal; label: string }[];
}[] = [
  {
    group: "podium",
    label: "Pódio",
    opts: [{ val: "a", label: "Olímpico" }, { val: "b", label: "Cards" }, { val: "c", label: "Lista" }],
  },
  {
    group: "card",
    label: "Card de jogo",
    opts: [{ val: "a", label: "Centralizado" }, { val: "b", label: "Compacto" }, { val: "c", label: "Estádio" }],
  },
  {
    group: "palpite",
    label: "Tela de palpite",
    opts: [{ val: "a", label: "Botões grandes" }, { val: "b", label: "Vertical" }, { val: "c", label: "Mínimo" }],
  },
];

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { theme, podium, card, palpite, sound, live, setStyle, setTheme, toggleSound, toggleLive, currentGrupoId, setCurrentGrupo, currentUserApelido } = useBolao();
  const [showAdminGate, setShowAdminGate] = useState(false);
  const grupoCfg = ADMINS.find((a) => a.id === currentGrupoId);

  if (!open) return null;

  const current: Record<StyleGroup, StyleVal> = { podium, card, palpite };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 200,
        }}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Configurações"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(320px, 100vw)",
          background: "var(--card)",
          borderLeft: "1px solid var(--border)",
          zIndex: 201,
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="font-bebas" style={{ fontSize: 24, color: "var(--neon)" }}>
            ⚙ Configurações
          </h2>
          <button
            aria-label="Fechar configurações"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 20 }}
          >
            ✕
          </button>
        </div>

        {/* ── Sua Identidade ── */}
        <div style={{
          padding: "14px 16px", borderRadius: 12,
          background: currentUserApelido
            ? "rgba(0,255,135,0.07)"
            : "rgba(255,216,77,0.07)",
          border: `1px solid ${currentUserApelido ? "rgba(0,255,135,0.25)" : "rgba(255,216,77,0.3)"}`,
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          {currentUserApelido ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "var(--field)", border: "2px solid var(--neon)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "var(--neon)",
                  flexShrink: 0,
                }}>
                  {currentUserApelido.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 2px" }}>
                    Esta é a sua página
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>
                    {currentUserApelido}
                  </p>
                  {grupoCfg && (
                    <p style={{ fontSize: 11, color: "var(--neon)", margin: "2px 0 0" }}>
                      {grupoCfg.emoji} {grupoCfg.nomeGrupo}
                    </p>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>
                💡 Se trocar de celular ou navegador, clique novamente no link que recebeu no WhatsApp para se identificar.
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--warn)", margin: 0 }}>
                ⚠️ Você ainda não está identificado
              </p>
              <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>
                Clique no link que o organizador enviou pelo WhatsApp para que o app saiba quem é você.
              </p>
              {grupoCfg && (
                <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
                  Grupo atual: {grupoCfg.emoji} {grupoCfg.nomeGrupo}
                </p>
              )}
            </>
          )}
        </div>

        {/* Tema */}
        <div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>TEMA</p>
          <div style={{ display: "flex", gap: 8 }}>
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                aria-label={t === "dark" ? "Escuro" : "Claro"}
                onClick={() => setTheme(t)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 8,
                  border: `1px solid ${theme === t ? "var(--neon)" : "var(--border)"}`,
                  background: theme === t ? "var(--neon-soft)" : "transparent",
                  color: theme === t ? "var(--neon)" : "var(--muted)",
                  cursor: "pointer", fontWeight: 600, fontSize: 13,
                }}
              >
                {t === "dark" ? "🌙 Escuro" : "☀️ Claro"}
              </button>
            ))}
          </div>
        </div>

        {/* Variações de estilo */}
        {STYLE_OPTIONS.map(({ group, label, opts }) => (
          <div key={group}>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
              {label.toUpperCase()}
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              {opts.map(({ val, label: optLabel }) => {
                const active = current[group] === val;
                return (
                  <button
                    key={val}
                    aria-label={optLabel}
                    onClick={() => setStyle(group, val)}
                    style={{
                      flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12,
                      border: `1px solid ${active ? "var(--neon)" : "var(--border)"}`,
                      background: active ? "var(--neon-soft)" : "transparent",
                      color: active ? "var(--neon)" : "var(--muted)",
                      cursor: "pointer", fontWeight: active ? 700 : 400,
                    }}
                  >
                    {optLabel}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Toggles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span style={{ color: "var(--text)", fontSize: 14 }}>🔊 Sons</span>
            <input
              type="checkbox"
              checked={sound}
              onChange={toggleSound}
              aria-label="Sons"
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
          </label>
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span style={{ color: "var(--text)", fontSize: 14 }}>🔴 Simulação ao vivo</span>
            <input
              type="checkbox"
              checked={live}
              onChange={toggleLive}
              aria-label="Simulação ao vivo"
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
          </label>
        </div>

        {/* Grupo ativo */}
        {grupoCfg && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
            <span style={{ fontSize: 13, color: "var(--text)" }}>
              {grupoCfg.emoji} <strong>{grupoCfg.nomeGrupo}</strong>
            </span>
            <button
              onClick={() => { setCurrentGrupo(null); onClose(); }}
              style={{ background: "none", border: "none", fontSize: 12, color: "var(--muted)", cursor: "pointer" }}
            >
              Trocar grupo
            </button>
          </div>
        )}

        {/* Área da gerência */}
        <button
          onClick={() => setShowAdminGate(true)}
          style={{
            padding: "10px 0", borderRadius: 8, marginTop: "auto",
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--muted)", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}
        >
          🔒 Área da gerência
        </button>
      </aside>

      {showAdminGate && (
        <AdminGate open={showAdminGate} onClose={() => setShowAdminGate(false)} />
      )}
    </>
  );
}

