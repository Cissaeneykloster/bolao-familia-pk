"use client";

import { useState } from "react";
import { useBolao } from "@/lib/store";
import { Header } from "@/components/shell/Header";
import { TabBar, TopTabs } from "@/components/shell/TabBar";
import { SettingsPanel } from "@/components/shell/SettingsPanel";
import { ToastProvider } from "@/components/shell/Toast";
import { ConfettiProvider } from "@/components/shell/ConfettiCanvas";
import { RankingScreen } from "@/components/screens/RankingScreen";
import { JogosScreen } from "@/components/screens/JogosScreen";
import { PalpitesScreen } from "@/components/palpites/PalpitesScreen";
import { GruposScreen } from "@/components/screens/GruposScreen";
import { FeedScreen } from "@/components/feed/FeedScreen";
import { DesafiosScreen } from "@/components/screens/DesafiosScreen";
import { AdminScreen } from "@/components/screens/AdminScreen";
import { RegulamentoScreen } from "@/components/screens/RegulamentoScreen";
import { SelecionarGrupoScreen } from "@/components/screens/SelecionarGrupoScreen";

const SCREENS: Record<string, React.ReactNode> = {
  ranking:     <RankingScreen />,
  jogos:       <JogosScreen />,
  palpites:    <PalpitesScreen />,
  grupos:      <GruposScreen />,
  desafios:    <DesafiosScreen />,
  feed:        <FeedScreen />,
  admin:       <AdminScreen />,
  regulamento: <RegulamentoScreen />,
};

export default function Home() {
  const { current, theme, currentGrupoId } = useBolao();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div data-theme={theme}>
      <ConfettiProvider>
        <ToastProvider>
          <div id="app" style={{ minHeight: "100vh", color: "var(--text)" }}>

            {/* Se não tem grupo, mostra tela de seleção */}
            {!currentGrupoId ? (
              <main style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "0 16px" }}>
                <SelecionarGrupoScreen />
              </main>
            ) : (
              <>
                <Header />
                <TopTabs />

                {/* FAB configurações */}
                <button
                  aria-label="Abrir configurações"
                  onClick={() => setSettingsOpen(true)}
                  style={{
                    position: "fixed",
                    bottom: "calc(var(--nav-h) + 12px)",
                    right: 16,
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    fontSize: 20,
                    zIndex: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                  }}
                >
                  ⚙
                </button>

                {/* Conteúdo da tela ativa */}
                <main
                  style={{
                    maxWidth: "var(--maxw)",
                    margin: "0 auto",
                    padding: "16px 16px calc(var(--nav-h) + 24px)",
                    minHeight: "calc(100vh - var(--header-h))",
                  }}
                >
                  <div key={current} className="animate-screen-in">
                    {SCREENS[current] ?? <SelecionarGrupoScreen />}
                  </div>
                </main>

                <TabBar />

                <SettingsPanel
                  open={settingsOpen}
                  onClose={() => setSettingsOpen(false)}
                />
              </>
            )}
          </div>
        </ToastProvider>
      </ConfettiProvider>
    </div>
  );
}
