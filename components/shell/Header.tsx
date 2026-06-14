"use client";

import { useEffect, useRef, useState } from "react";
import { useBolao } from "@/lib/store";
import { bonusPts } from "@/lib/scoring";
import { ADMINS } from "@/lib/mock-data";
import { useDesafioCats } from "@/lib/useDesafios";

export function Header() {
  const { desafios, comboBank, penalty, currentGrupoId, currentUserApelido, participantes, matches } = useBolao();
  const DESAFIO_CATS = useDesafioCats();
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

  const hasLive = matches.some((m) => m.status === "live");
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

      {/* Identidade — avatar + nome */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {currentUserApelido && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>
              {currentUserApelido}
            </div>
            {grupoCfg && (
              <div style={{ fontSize: 10, color: "var(--neon)", lineHeight: 1.4 }}>
                {grupoCfg.emoji} {grupoCfg.nomeGrupo}
              </div>
            )}
          </div>
        )}

        {/* Avatar circular com iniciais */}
        {currentUserApelido ? (
          <div
            aria-label={`Você: ${currentUserApelido}`}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--field)",
              border: "2px solid var(--neon)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "var(--neon)",
              flexShrink: 0,
            }}
          >
            {currentUserApelido.slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <div style={{ textAlign: "right" }}>
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
        )}
      </div>
    </header>
  );
}
