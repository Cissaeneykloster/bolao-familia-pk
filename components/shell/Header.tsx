"use client";

import { useEffect, useRef, useState } from "react";
import { useBolao } from "@/lib/store";
import { bonusPts } from "@/lib/scoring";
import { DESAFIO_CATS, MATCHES, ADMINS } from "@/lib/mock-data";

export function Header() {
  const { desafios, comboBank, penalty, participantes, currentGrupoId, currentUserApelido } = useBolao();
  const bonus = bonusPts(desafios, DESAFIO_CATS, comboBank, penalty);
  const totalPts = bonus;

  const prevRef = useRef(totalPts);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (totalPts !== prevRef.current) {
      prevRef.current = totalPts;
      setPop(true);
      const t = setTimeout(() => setPop(false), 400);
      return () => clearTimeout(t);
    }
  }, [totalPts]);

  const hasLive = MATCHES.some((m) => m.status === "live");
  const grupoCfg = ADMINS.find((a) => a.id === currentGrupoId);
  const qtd = participantes.filter((p) => p.grupoId === currentGrupoId && p.ativo).length;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: "var(--header-h)",
        background: "color-mix(in srgb, var(--bg) 90%, transparent)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        maxWidth: "var(--maxw)",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 24 }}>⚽</span>
        <div>
          <div className="font-bebas" style={{ fontSize: 22, color: "var(--neon)", lineHeight: 1 }}>
            BOLÃO
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1 }}>
            Copa 2026
          </div>
        </div>
      </div>

      {/* Badge AO VIVO */}
      {hasLive && (
        <span
          className="animate-pisca"
          aria-label="Jogo ao vivo"
          style={{
            background: "var(--live)",
            color: "#fff",
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          🔴 AO VIVO
        </span>
      )}

      {/* Identidade do usuário + grupo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
        {currentUserApelido && (
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
            {currentUserApelido}
          </span>
        )}
        {grupoCfg ? (
          <span style={{ fontSize: 11, color: "var(--neon)" }}>
            {grupoCfg.emoji} {grupoCfg.nomeGrupo}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
            Sem grupo
          </span>
        )}
      </div>
    </header>
  );
}
