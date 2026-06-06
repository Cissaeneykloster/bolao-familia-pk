"use client";

import type { FeedEvent } from "@/lib/types";

interface FeedItemProps {
  event: FeedEvent;
  index?: number;
  onDelete?: (id: string) => void;
}

function relAge(timestamp: number): string {
  const min = Math.round((Date.now() - timestamp) / 60_000);
  if (min <= 0) return "agora";
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export function FeedItem({ event, index = 0, onDelete }: FeedItemProps) {
  const age = relAge(event.timestamp);

  const typeStyles: Record<FeedEvent["type"], React.CSSProperties> = {
    exact: {
      background: "linear-gradient(135deg, #2a2000, #1a1800)",
      border: "1px solid var(--gold)",
      boxShadow: "0 0 15px rgba(255,215,0,0.2)",
    },
    result: {
      background: "var(--bg-2)",
      border: "1px solid var(--border)",
    },
    winner: {
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderLeft: "3px solid var(--ok)",
    },
    sent: {
      background: "var(--card)",
      border: "1px solid var(--border)",
    },
    challenge: {
      background: "color-mix(in srgb, var(--neon) 5%, var(--card))",
      border: "1px solid rgba(0,255,135,0.25)",
    },
    announcement: {
      background: "linear-gradient(135deg, #1a1030, #120c25)",
      border: "1px solid rgba(136,68,255,0.5)",
      boxShadow: "0 0 12px rgba(136,68,255,0.15)",
    },
  };

  return (
    <div
      className="animate-feed-in"
      style={{
        borderRadius: "var(--radius)",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        animationDelay: `${index * 0.05}s`,
        position: "relative",
        ...typeStyles[event.type],
      }}
    >
      {/* Botão deletar (só visível para admin) */}
      {onDelete && (
        <button
          aria-label="Remover evento"
          onClick={() => onDelete(event.id)}
          style={{
            position: "absolute", top: 8, right: 10,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--muted)", fontSize: 14, lineHeight: 1,
            opacity: 0.5,
          }}
        >
          ✕
        </button>
      )}

      {/* 🎯 PLACAR EXATO */}
      {event.type === "exact" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🎯</span>
            <span className="font-bebas" style={{ fontSize: 18, color: "var(--gold)", letterSpacing: 1 }}>
              PLACAR EXATO!
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text)", margin: 0, lineHeight: 1.5 }}>{event.body}</p>
          {event.pts && (
            <span style={{
              fontSize: 13, fontWeight: 700, color: "var(--gold)",
              background: "rgba(255,215,0,0.1)", borderRadius: 6,
              padding: "2px 8px", alignSelf: "flex-start",
            }}>
              {event.pts} 🔥
            </span>
          )}
        </>
      )}

      {/* ⚽ RESULTADO */}
      {event.type === "result" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>⚽</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{event.body}</span>
          </div>
          {event.score && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
              <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{event.score.a}</span>
              <span className="font-bebas" style={{ fontSize: 22, color: "var(--neon)", letterSpacing: 4 }}>
                {event.score.sa} × {event.score.sb}
              </span>
              <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{event.score.b}</span>
            </div>
          )}
          {event.stats?.map((s, i) => (
            <span key={i} style={{ fontSize: 12, color: "var(--muted)" }}>📊 {s}</span>
          ))}
        </>
      )}

      {/* ✅ VENCEDOR */}
      {event.type === "winner" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>✅</span>
            <p style={{ fontSize: 13, color: "var(--text)", margin: 0 }}>{event.body}</p>
          </div>
          {event.pts && (
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ok)" }}>{event.pts}</span>
          )}
        </>
      )}

      {/* 🎮 PALPITE ENVIADO */}
      {event.type === "sent" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>🎮</span>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>{event.body}</p>
        </div>
      )}

      {/* 🏅 DESAFIO */}
      {event.type === "challenge" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>{event.emoji ?? "🏅"}</span>
          <p style={{ fontSize: 13, color: "var(--text)", margin: 0 }}>{event.body}</p>
          {event.pts && (
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--neon)", marginLeft: "auto" }}>{event.pts}</span>
          )}
        </div>
      )}

      {/* 📢 ANÚNCIO DO ADMIN */}
      {event.type === "announcement" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>{event.emoji ?? "📢"}</span>
            <span className="font-bebas" style={{ fontSize: 16, color: "#a888ff", letterSpacing: 0.5 }}>
              AVISO DO ORGANIZADOR
            </span>
          </div>
          <p style={{ fontSize: 14, color: "var(--text)", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
            {event.body}
          </p>
        </>
      )}

      {/* Timestamp */}
      <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "flex-end", marginTop: 2 }}>
        {age}
      </span>
    </div>
  );
}
