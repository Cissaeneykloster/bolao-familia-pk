"use client";

import { FaseTabs } from "@/components/jogos/FaseTabs";
import { useLang, T } from "@/lib/useLang";

export function JogosScreen() {
  const lang = useLang();
  const t = T[lang];
  return (
    <div className="animate-screen-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 className="font-bebas" style={{ fontSize: 28, color: "var(--text)", letterSpacing: 1 }}>
        ⚽ {t.jogos}
      </h2>
      <FaseTabs />
    </div>
  );
}
