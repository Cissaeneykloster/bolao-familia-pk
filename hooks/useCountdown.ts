"use client";

import { useState, useEffect } from "react";
import { fmtCountdown } from "@/lib/format";
import { EXTRA_MS_AFTER_KICKOFF } from "@/lib/mock-data";

/** Prazo real = kickoff + 5 min após o início */
export function useCountdown(kickoff: number | undefined): string {
  const deadline = kickoff ? kickoff + EXTRA_MS_AFTER_KICKOFF : undefined;
  const [label, setLabel] = useState(() =>
    deadline ? fmtCountdown(deadline - Date.now()) : ""
  );

  useEffect(() => {
    if (!deadline) return;
    const tick = () => setLabel(fmtCountdown(deadline - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return label;
}
