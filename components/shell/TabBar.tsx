"use client";

import { useBolao } from "@/lib/store";

type Screen = "ranking" | "jogos" | "palpites" | "grupos" | "desafios" | "feed" | "regulamento";

const TABS: { id: Screen; icon: string; label: string; badge?: string }[] = [
  { id: "ranking",     icon: "🏆", label: "Ranking" },
  { id: "jogos",       icon: "⚽", label: "Jogos" },
  { id: "palpites",    icon: "🎯", label: "Palpites", badge: "4" },
  { id: "grupos",      icon: "📊", label: "Grupos" },
  { id: "desafios",    icon: "🎮", label: "Desafios" },
  { id: "feed",        icon: "🔥", label: "Feed" },
  { id: "regulamento", icon: "📋", label: "Regras" },
];

export function TabBar() {
  const { current, setScreen } = useBolao();

  return (
    <>
      {/* ── Mobile: bottom nav ────────────────────────────────── */}
      <nav
        aria-label="Navegação principal"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "var(--nav-h)",
          background: "var(--card)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          zIndex: 40,
        }}
        className="tabbar-mobile"
      >
        {TABS.map((tab) => {
          const active = current === tab.id;
          return (
            <button
              key={tab.id}
              aria-label={tab.label}
              onClick={() => setScreen(tab.id)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: active ? "var(--neon)" : "var(--muted)",
                position: "relative",
                transition: "color 0.15s",
              }}
            >
              {/* Fundo circular no ativo */}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--neon-soft)",
                  }}
                />
              )}

              {/* Ícone */}
              <span
                style={{
                  fontSize: 20,
                  position: "relative",
                  transition: "transform 0.15s",
                  transform: active ? "scale(1.15)" : "scale(1)",
                }}
              >
                {tab.icon}

                {/* Badge */}
                {tab.badge && (
                  <span
                    aria-label={`${tab.badge} palpites pendentes`}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -8,
                      background: "var(--live)",
                      color: "#fff",
                      borderRadius: "50%",
                      width: 16,
                      height: 16,
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>

              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Desktop: top tabs (≥860px via CSS) ───────────────── */}
      <style>{`
        @media (min-width: 860px) {
          .tabbar-mobile {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

/* Desktop top tabs — renderizado separado no layout */
export function TopTabs() {
  const { current, setScreen } = useBolao();

  return (
    <nav
      aria-label="Navegação principal"
      style={{
        display: "none",
        borderBottom: "1px solid var(--border)",
        background: "var(--card)",
      }}
      className="toptabs-desktop"
    >
      <div
        style={{
          maxWidth: "var(--maxw)",
          margin: "0 auto",
          display: "flex",
          gap: 4,
          padding: "0 16px",
        }}
      >
        {TABS.map((tab) => {
          const active = current === tab.id;
          return (
            <button
              key={tab.id}
              aria-label={tab.label}
              onClick={() => setScreen(tab.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: active ? "var(--neon)" : "var(--muted)",
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: active ? 700 : 400,
                borderBottom: active ? "2px solid var(--neon)" : "2px solid transparent",
                display: "flex",
                alignItems: "center",
                gap: 6,
                position: "relative",
                transition: "color 0.15s",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  style={{
                    background: "var(--live)",
                    color: "#fff",
                    borderRadius: 10,
                    padding: "1px 6px",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <style>{`
        @media (min-width: 860px) {
          .toptabs-desktop { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
