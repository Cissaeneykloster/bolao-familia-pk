"use client";

import { MATCHES } from "@/lib/mock-data";
import { useBolao } from "@/lib/store";
import { JogoCard } from "./JogoCard";
import { useLang } from "@/lib/useLang";

export function FaseTabs() {
  const { officialResults } = useBolao();
  const lang = useLang();

  // Todos os jogos que ainda não têm resultado oficial
  const pending = [...MATCHES]
    .filter((m) => !officialResults[m.id])
    .sort((a, b) => (a.kickoff ?? 0) - (b.kickoff ?? 0));

  if (pending.length === 0) {
    return (
      <p style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", padding: "32px 0" }}>
        {lang === "en" ? "All matches have official results." : "Todos os jogos já têm resultado oficial."}
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {pending.map((m) => <JogoCard key={m.id} match={m} showPalpiteBtn />)}
    </div>
  );
}
