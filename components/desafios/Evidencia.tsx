"use client";

import { useRef } from "react";
import { useBolao } from "@/lib/store";

interface EvidenciaProps {
  itemId: string;
  label: string;
  pts: number;
  onDone?: () => void;
}

/** Reduz imagem para max 300px, retorna dataURL jpeg ou null em caso de erro */
function resizeImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 300;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

export function Evidencia({ itemId, label, pts, onDone }: EvidenciaProps) {
  const { evidence, setEvidence, toggleDesafio, desafios } = useBolao();
  const inputRef = useRef<HTMLInputElement>(null);
  const done = !!desafios[itemId];
  const thumb = evidence[itemId];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const dataUrl = await resizeImage(file);

    // Marca o desafio como concluído (independente de ter foto)
    if (!done) toggleDesafio(itemId);

    if (dataUrl) {
      // Tenta salvar a miniatura; se quota estourar ou setEvidence lançar, segue sem foto
      try {
        setEvidence(itemId, dataUrl);
      } catch {
        // Quota estourada — conclusão já foi marcada acima, ignora a foto silenciosamente
      }
    }

    onDone?.();
    // Reset input para permitir novo upload
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {thumb ? (
        /* Miniatura clicável para trocar a foto */
        <button
          aria-label={`Evidência de ${label} — clique para trocar`}
          onClick={() => inputRef.current?.click()}
          style={{
            background: "none", border: "none", padding: 0, cursor: "pointer",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt={`Evidência: ${label}`}
            style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: "2px solid var(--neon)" }}
          />
        </button>
      ) : (
        <button
          aria-label={done ? `Foto de ${label}` : `Enviar evidência de ${label}`}
          onClick={() => inputRef.current?.click()}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: `1px solid ${done ? "var(--ok)" : "var(--border)"}`,
            background: done ? "var(--neon-soft)" : "transparent",
            color: done ? "var(--ok)" : "var(--muted)",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            minHeight: 36,
            whiteSpace: "nowrap",
          }}
        >
          {done ? "✅ Feito" : "📸 Evidência"}
        </button>
      )}

      {/* Input file oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        aria-label={`Evidência de ${label}`}
        style={{ display: "none" }}
      />

      {done && !thumb && (
        <span style={{ fontSize: 11, color: "var(--ok)" }}>+{pts} pts</span>
      )}
    </div>
  );
}
