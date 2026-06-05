"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";

interface ToastCtx {
  show: (msg: string) => void;
}

const ToastContext = createContext<ToastCtx>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((m: string) => {
    setMsg(m);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMsg(null), 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {msg && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "calc(var(--nav-h) + 16px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            borderRadius: "var(--radius)",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 600,
            zIndex: 9999,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            animation: "entrada-card 0.25s ease-out both",
          }}
        >
          {msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}
