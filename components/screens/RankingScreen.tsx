"use client";

import { Podium } from "@/components/ranking/Podium";
import { RankingList } from "@/components/ranking/RankingList";
import { ThematicGroups } from "@/components/ranking/ThematicGroups";

export function RankingScreen() {
  return (
    <div className="animate-screen-in" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h2 className="font-bebas" style={{ fontSize: 28, color: "var(--text)", letterSpacing: 1 }}>
        🏆 Ranking Geral
      </h2>
      <Podium />
      <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
      <RankingList />
      <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />
      <ThematicGroups />
    </div>
  );
}
