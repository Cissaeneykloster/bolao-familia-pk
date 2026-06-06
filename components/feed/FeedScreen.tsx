"use client";

import { useState } from "react";
import { useBolao } from "@/lib/store";
import { FeedItem } from "./FeedItem";

const EMOJIS = ["📢","🏆","⚽","🎉","🔥","❤️","👏","💪","🥳","😅"];

export function FeedScreen() {
  const { feedEvents, addFeedEvent, removeFeedEvent, clearFeed, adminUnlocked } = useBolao();
  const [texto, setTexto] = useState("");
  const [emoji, setEmoji] = useState("📢");
  const [showForm, setShowForm] = useState(false);

  const handlePost = () => {
    if (!texto.trim()) return;
    addFeedEvent({ type: "announcement", body: texto.trim(), emoji });
    setTexto("");
    setShowForm(false);
  };

  return (
    <div className="animate-screen-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="font-bebas" style={{ fontSize: 28, color: "var(--text)", letterSpacing: 1 }}>
          🔥 Feed de Atividade
        </h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {feedEvents.length > 0 && (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              {feedEvents.length} evento{feedEvents.length !== 1 ? "s" : ""}
            </span>
          )}
          {/* Admin: botão postar */}
          {adminUnlocked && (
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: "1px solid rgba(136,68,255,0.5)", background: "rgba(136,68,255,0.1)",
                color: "#a888ff", cursor: "pointer",
              }}
            >
              📢 Postar
            </button>
          )}
        </div>
      </div>

      {/* Formulário de anúncio (admin) */}
      {showForm && adminUnlocked && (
        <div style={{
          background: "linear-gradient(135deg, #1a1030, #120c25)",
          border: "1px solid rgba(136,68,255,0.4)",
          borderRadius: "var(--radius)", padding: 16,
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <p className="font-bebas" style={{ fontSize: 16, color: "#a888ff", margin: 0 }}>
            📢 Novo Anúncio
          </p>

          {/* Seletor de emoji */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  width: 36, height: 36, borderRadius: 8, fontSize: 18,
                  border: `1px solid ${emoji === e ? "rgba(136,68,255,0.8)" : "var(--border)"}`,
                  background: emoji === e ? "rgba(136,68,255,0.2)" : "transparent",
                  cursor: "pointer",
                }}
              >
                {e}
              </button>
            ))}
          </div>

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite o aviso para a família..."
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg-2)",
              color: "var(--text)", fontSize: 14, resize: "vertical",
              minHeight: 80, fontFamily: "var(--font-inter, system-ui)",
            }}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowForm(false)}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 8,
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--muted)", cursor: "pointer", fontSize: 13,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handlePost}
              disabled={!texto.trim()}
              style={{
                flex: 2, padding: "10px 0", borderRadius: 8,
                border: "none", background: texto.trim() ? "rgba(136,68,255,0.8)" : "var(--border)",
                color: texto.trim() ? "#fff" : "var(--muted)",
                cursor: texto.trim() ? "pointer" : "default",
                fontWeight: 700, fontSize: 13,
              }}
            >
              {emoji} Publicar
            </button>
          </div>
        </div>
      )}

      {/* Lista de eventos */}
      {feedEvents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--muted)" }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🔥</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
            Nenhuma atividade ainda
          </p>
          <p style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
            Os eventos aparecerão aqui quando você fizer palpites,
            o admin lançar resultados ou desafios forem completados.
          </p>
          {adminUnlocked && (
            <p style={{ fontSize: 12, marginTop: 12, color: "rgba(136,68,255,0.8)" }}>
              📢 Você pode postar um aviso usando o botão "Postar" acima.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {feedEvents.map((ev, i) => (
            <FeedItem
              key={ev.id}
              event={ev}
              index={i}
              onDelete={adminUnlocked ? removeFeedEvent : undefined}
            />
          ))}

          {/* Admin: limpar feed */}
          {adminUnlocked && feedEvents.length > 0 && (
            <button
              onClick={() => { if (window.confirm("Limpar todo o feed?")) clearFeed(); }}
              style={{
                marginTop: 8, padding: "8px 0", borderRadius: 8,
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--muted)", cursor: "pointer", fontSize: 12,
              }}
            >
              🗑️ Limpar feed
            </button>
          )}
        </div>
      )}
    </div>
  );
}
