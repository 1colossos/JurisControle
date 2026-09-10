import { useState } from "react";
import { Outlet, useLocation, matchPath, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useApp } from "@/store/AppContext";

const META: { pattern: string; titulo: string; subtitulo: string }[] = [
  { pattern: "/app", titulo: "Visão Geral", subtitulo: "Painel unificado de prioridades processuais" },
  { pattern: "/app/processos", titulo: "Processos", subtitulo: "Portfólio completo de demandas do escritório" },
  { pattern: "/app/processos/novo", titulo: "Novo Processo", subtitulo: "Cadastro de processo e contagem de prazos em dias úteis" },
  { pattern: "/app/processos/:id/editar", titulo: "Editar Processo", subtitulo: "Atualização de dados e prazos" },
  { pattern: "/app/processos/:id", titulo: "Detalhes do Processo", subtitulo: "Trajetória e cronograma da causa" },
  { pattern: "/app/clientes", titulo: "Clientes", subtitulo: "Base de contatos e contratantes do escritório" },
  { pattern: "/app/configuracoes", titulo: "Configurações e Integrações", subtitulo: "Perfil do usuário e ajustes para notificações automatizadas" },
];

function metaFor(pathname: string) {
  // ordena do mais específico ao mais genérico
  const ordered = [...META].sort((a, b) => b.pattern.length - a.pattern.length);
  for (const m of ordered) {
    if (matchPath({ path: m.pattern, end: true }, pathname)) return m;
  }
  return META[0];
}

export function Layout() {
  const { autenticado } = useApp();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);

  if (!autenticado) return <Navigate to="/" replace />;

  const meta = metaFor(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Sidebar fixa (desktop) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Drawer (mobile) */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-navy-900/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Sidebar onNavigate={() => setDrawer(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar titulo={meta.titulo} subtitulo={meta.subtitulo} onMenu={() => setDrawer(true)} />
        <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
