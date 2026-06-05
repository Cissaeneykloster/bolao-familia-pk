"use client";

import { feedAge } from "@/lib/format";
import type { FeedEvent } from "@/lib/types";

interface FeedItemProps {
  event: FeedEvent;
  index?: number;
}

export function FeedItem({ event, index = 0 }: FeedItemProps) {
  const age = feedAge(event.age);

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
        animationDelay: `${index * 0.06}s`,
        ...typeStyles[event.type],
      }}
    >
      {/* Tipo exact */}
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

      {/* Tipo result */}
      {event.type === "result" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>⚽</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{event.body}</span>
          </div>
          {event.score && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
              <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{event.score.a}</span>
              <span className="font-bebas" style={{ fontSize: 24, color: "var(--neon)", letterSpacing: 4 }}>
                {event.score.sa} × {event.score.sb}
              </span>
              <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{event.score.b}</span>
            </div>
          )}
          {event.stats && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {event.stats.map((s, i) => (
                <span key={i} style={{ fontSize: 12, color: "var(--muted)" }}>📊 {s}</span>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tipo winner */}
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

      {/* Tipo sent */}
      {event.type === "sent" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>🎮</span>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>{event.body}</p>
        </div>
      )}

      {/* Timestamp */}
      <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "flex-end", marginTop: 2 }}>
        {age}
      </span>
    </div>
  );
}
