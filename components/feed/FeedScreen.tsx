"use client";

import { useState } from "react";
import { FEED } from "@/lib/mock-data";
import { FeedItem } from "./FeedItem";
import type { FeedEvent } from "@/lib/types";

export function FeedScreen() {
  const [events, setEvents] = useState<FeedEvent[]>(FEED);

  return (
    <div className="animate-screen-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="font-bebas" style={{ fontSize: 28, color: "var(--text)", letterSpacing: 1 }}>
          🔥 Feed de Atividade
        </h2>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          {events.length} eventos
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {events.map((ev, i) => (
          <FeedItem key={i} event={ev} index={i} />
        ))}
      </div>

      {events.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0", fontSize: 14 }}>
          Nenhuma atividade ainda.
        </p>
      )}
    </div>
  );
}
