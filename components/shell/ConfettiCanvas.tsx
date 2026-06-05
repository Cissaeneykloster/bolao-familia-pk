"use client";

import {
  createContext, useContext, useRef, useCallback,
  useImperativeHandle, forwardRef, useEffect,
} from "react";

// ── Particle type ─────────────────────────────────────────────────
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string; size: number;
  life: number; maxLife: number;
  rotation: number; rotV: number;
}

const COLORS = ["#ffd700", "#00ff87", "#ffffff", "#ff6b35", "#4488ff", "#cd7f32"];

function createParticles(x: number, y: number, n: number): Particle[] {
  return Array.from({ length: n }, () => ({
    x, y,
    vx: (Math.random() - 0.5) * 12,
    vy: (Math.random() - 4) * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 8 + 4,
    life: 1,
    maxLife: 60 + Math.random() * 60,
    rotation: Math.random() * 360,
    rotV: (Math.random() - 0.5) * 10,
  }));
}

// ── Context / ref handle ──────────────────────────────────────────
export interface ConfettiHandle {
  fire: (x?: number, y?: number, n?: number) => void;
}

const ConfettiContext = createContext<ConfettiHandle>({ fire: () => {} });
export const useConfetti = () => useContext(ConfettiContext);

// ── Canvas component ──────────────────────────────────────────────
const ConfettiCanvasInner = forwardRef<ConfettiHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.vx *= 0.99;
      p.life -= 1 / p.maxLife;
      p.rotation += p.rotV;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }

    if (particlesRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(loop);
    } else {
      rafRef.current = null;
    }
  }, []);

  const fire = useCallback(
    (x = window.innerWidth / 2, y = window.innerHeight / 3, n = 80) => {
      particlesRef.current.push(...createParticles(x, y, n));
      if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
    },
    [loop]
  );

  useImperativeHandle(ref, () => ({ fire }), [fire]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 10000,
      }}
    />
  );
});
ConfettiCanvasInner.displayName = "ConfettiCanvas";

// ── Provider que expõe via context ───────────────────────────────
export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<ConfettiHandle>(null);
  const handle: ConfettiHandle = {
    fire: (x, y, n) => ref.current?.fire(x, y, n),
  };
  return (
    <ConfettiContext.Provider value={handle}>
      {children}
      <ConfettiCanvasInner ref={ref} />
    </ConfettiContext.Provider>
  );
}
