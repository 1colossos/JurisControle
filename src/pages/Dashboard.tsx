import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Mail,
  MessageCircle,
  BellRing,
  FileDown,
} from "lucide-react";
import { useApp } from "@/store/AppContext";
import { useToast } from "@/components/ui/Toast";
import { UrgencyBadge } from "@/components/ui/Badge";
import { URGENCIA, ORDEM_URGENCIA } from "@/components/ui/urgency";
import { formatarData, diasUteisLabel } from "@/lib/format";
import { exportarDashboardPdf } from "@/lib/exportPdf";
import { notificacoes } from "@/data/seed";

const fade = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05 },
});

export function Dashboard() {
  const { processos, usuario } = useApp();
  const toast = useToast();

  const exportar = () => {
    const ok = exportarDashboardPdf(processos, usuario);
    toast(
      ok
        ? "Dashboard aberto para exportação — escolha \"Salvar como PDF\"."
        : "Não foi possível abrir a janela de exportação (pop-up bloqueado).",
      ok ? "success" : "warning",
    );
  };

  const ativos = processos.filter((p) => p.status === "Em andamento").length;
  const criticos = processos.filter((p) => p.urgencia === "critico").length;
  const proximos = processos.filter((p) => p.urgencia === "alto").length;

  const kpis = [
    { icon: FileText, box: "bg-medio-bg text-medio", num: ativos, label: "Processos ativos", trend: "+3 este mês" },
    { icon: AlertTriangle, box: "bg-critico-bg text-critico", num: criticos, label: "Prazos críticos", trend: "≤ 3 dias úteis" },
    { icon: Clock, box: "bg-alto-bg text-alto", num: proximos, label: "Prazos próximos", trend: "≤ 7 dias úteis" },
    { icon: CheckCircle2, box: "bg-baixo-bg text-baixo", num: 24, label: "Concluídos no mês", trend: "+12% vs anterior" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={exportar} className="btn-primary">
          <FileDown size={16} /> Exportar dashboard em PDF
        </button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} {...fade(i)} className="card p-5">
            <div className="flex items-start justify-between">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${k.box}`}>
                <k.icon size={20} />
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-muted">
                <ArrowUpRight size={13} /> {k.trend}
              </span>
            </div>
            <div className="mt-4 font-serif text-3xl font-bold text-ink">{k.num}</div>
            <div className="text-sm text-body-2">{k.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Termos críticos */}
        <motion.div {...fade(4)} className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <div>
              <h3 className="text-lg">Termos críticos</h3>
              <p className="text-sm text-muted">Processos com prazos sinalizados por cor de urgência</p>
            </div>
            <Link to="/app/processos" className="flex items-center gap-1 text-sm font-semibold text-gold-600 hover:underline">
              Ver todos <ArrowUpRight size={14} />
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {processos.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link
                  to={`/app/processos/${p.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 transition hover:bg-canvas"
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${URGENCIA[p.urgencia].dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted">{p.numero}</span>
                      <UrgencyBadge urgencia={p.urgencia} />
                    </div>
                    <div className="truncate font-medium text-body">
                      {p.tipo} — {p.cliente?.nome}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-body">{formatarData(p.prazo)}</div>
                    <div className="text-xs text-muted">{diasUteisLabel(p.diasUteis)}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          <motion.div {...fade(5)} className="card p-6">
            <h3 className="text-lg">Legenda de urgência</h3>
            <ul className="mt-4 space-y-3.5">
              {ORDEM_URGENCIA.map((u) => (
                <li key={u} className="flex gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${URGENCIA[u].dot}`} />
                  <div>
                    <div className="text-sm font-semibold text-body">{URGENCIA[u].label}</div>
                    <div className="text-xs text-muted">{URGENCIA[u].desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div {...fade(6)} className="card bg-navy-900 p-6 text-white">
            <h3 className="text-lg text-white">Notificações ativas</h3>
            <p className="text-sm text-white/60">Lembretes automáticos enviados nesta semana</p>
            <ul className="mt-4 space-y-3">
              {[
                { icon: Mail, ...notificacoes[0] },
                { icon: MessageCircle, ...notificacoes[1] },
                { icon: BellRing, ...notificacoes[2] },
              ].map((n) => (
                <li key={n.canal} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2.5 text-white/80">
                    <n.icon size={16} className="text-gold" /> {n.canal}
                  </span>
                  <span className="font-semibold text-white">{n.valor}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/app/configuracoes"
              className="mt-5 block rounded-xl border border-white/15 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Configurar integrações
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
