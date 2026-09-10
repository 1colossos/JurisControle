import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Bell, Menu, AlertTriangle, Clock, CalendarClock, BellRing } from "lucide-react";
import { useApp } from "@/store/AppContext";
import { iniciais, diasUteisLabel, formatarData } from "@/lib/format";

interface TopbarProps {
  titulo: string;
  subtitulo: string;
  onMenu?: () => void;
}

interface Notificacao {
  id: string;
  processoId: string;
  icone: typeof Bell;
  cor: string;
  titulo: string;
  desc: string;
}

export function Topbar({ titulo, subtitulo, onMenu }: TopbarProps) {
  const { usuario, processos } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [aberto, setAberto] = useState(false);
  const [lidas, setLidas] = useState<Set<string>>(new Set());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/app/processos?q=${encodeURIComponent(q)}`);
  };

  /** Notificações do usuário derivadas dos prazos dos seus processos. */
  const notificacoes = useMemo<Notificacao[]>(() => {
    const lista: Notificacao[] = [];
    for (const p of processos) {
      if (p.status !== "Em andamento") continue;
      const ref = `${p.tipo} — ${p.cliente?.nome ?? "sem cliente"}`;
      if (p.diasUteis < 0) {
        lista.push({
          id: `venc-${p.id}`, processoId: p.id, icone: AlertTriangle, cor: "bg-critico-bg text-critico",
          titulo: "Prazo vencido", desc: `${ref} venceu em ${formatarData(p.prazo)}.`,
        });
      } else if (p.diasUteis === 0) {
        lista.push({
          id: `hoje-${p.id}`, processoId: p.id, icone: AlertTriangle, cor: "bg-critico-bg text-critico",
          titulo: "Prazo vence hoje", desc: `${ref} vence hoje (${formatarData(p.prazo)}).`,
        });
      } else if (p.urgencia === "critico") {
        lista.push({
          id: `crit-${p.id}`, processoId: p.id, icone: Clock, cor: "bg-critico-bg text-critico",
          titulo: "Prazo crítico", desc: `${ref}: restam ${diasUteisLabel(p.diasUteis)}.`,
        });
      } else if (p.urgencia === "alto") {
        lista.push({
          id: `alto-${p.id}`, processoId: p.id, icone: CalendarClock, cor: "bg-alto-bg text-alto",
          titulo: "Prazo se aproximando", desc: `${ref}: restam ${diasUteisLabel(p.diasUteis)}.`,
        });
      }
      if (p.diasUteis > 0 && p.lembretes.includes(p.diasUteis)) {
        lista.push({
          id: `lemb-${p.id}`, processoId: p.id, icone: BellRing, cor: "bg-gold-bg text-gold-600",
          titulo: "Lembrete programado", desc: `${ref}: lembrete de ${p.diasUteis} dia(s) útil(eis) de antecedência.`,
        });
      }
    }
    return lista;
  }, [processos]);

  const naoLidas = notificacoes.filter((n) => !lidas.has(n.id));

  const abrirNotificacao = (n: Notificacao) => {
    setLidas((prev) => new Set(prev).add(n.id));
    setAberto(false);
    navigate(`/app/processos/${n.processoId}`);
  };

  const marcarTodas = () => setLidas(new Set(notificacoes.map((n) => n.id)));

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-line bg-canvas/80 px-5 py-4 backdrop-blur-md lg:px-8">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-body-2 hover:bg-surface lg:hidden"
        aria-label="Menu"
      >
        <Menu size={20} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl lg:text-2xl">{titulo}</h1>
        <p className="truncate text-sm text-muted">{subtitulo}</p>
      </div>

      <form onSubmit={submit} className="relative hidden md:block">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar processos, clientes…"
          className="w-64 rounded-xl border border-line bg-surface py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30 lg:w-80"
        />
      </form>

      {/* Notificações */}
      <div className="relative">
        <button
          onClick={() => setAberto((v) => !v)}
          className="relative rounded-xl border border-line bg-surface p-2.5 text-body-2 transition hover:text-ink"
          aria-label="Notificações"
        >
          <Bell size={18} />
          {naoLidas.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-critico px-1 text-[10px] font-bold text-white ring-2 ring-surface">
              {naoLidas.length}
            </span>
          )}
        </button>

        <AnimatePresence>
          {aberto && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2.5rem)] card overflow-hidden shadow-lift"
              >
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <div>
                    <h3 className="text-base">Notificações</h3>
                    <p className="text-xs text-muted">Prazos dos processos de {usuario.nome.split(" ")[0]}</p>
                  </div>
                  {naoLidas.length > 0 && (
                    <button onClick={marcarTodas} className="text-xs font-semibold text-gold-600 hover:underline">
                      Marcar lidas
                    </button>
                  )}
                </div>
                <ul className="max-h-96 divide-y divide-line overflow-y-auto">
                  {notificacoes.length === 0 && (
                    <li className="px-4 py-10 text-center text-sm text-muted">
                      Nenhuma notificação no momento. 🎉
                    </li>
                  )}
                  {notificacoes.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => abrirNotificacao(n)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-canvas"
                      >
                        <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${n.cor}`}>
                          <n.icone size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-body">{n.titulo}</span>
                            {!lidas.has(n.id) && <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />}
                          </span>
                          <span className="mt-0.5 block text-xs text-body-2">{n.desc}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {usuario.foto ? (
        <img
          src={usuario.foto}
          alt={usuario.nome}
          title={usuario.nome}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-line"
        />
      ) : (
        <div
          className="grid h-10 w-10 place-items-center rounded-full bg-navy-900 text-sm font-semibold text-white"
          title={usuario.nome}
        >
          {iniciais(usuario.nome)}
        </div>
      )}
    </header>
  );
}
