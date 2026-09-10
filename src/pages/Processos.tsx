import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Plus, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/store/AppContext";
import { UrgencyBadge, StatusBadge } from "@/components/ui/Badge";
import { ORDEM_URGENCIA, URGENCIA } from "@/components/ui/urgency";
import { formatarData, diasUteisLabel } from "@/lib/format";
import type { Urgencia } from "@/lib/businessDays";

const POR_PAGINA = 5;

export function Processos() {
  const { processos } = useApp();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [urg, setUrg] = useState<Urgencia | "todas">("todas");
  const [status, setStatus] = useState("todos");
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return processos.filter((p) => {
      const okTermo =
        !termo ||
        p.numero.toLowerCase().includes(termo) ||
        p.cliente?.nome.toLowerCase().includes(termo) ||
        p.objeto.toLowerCase().includes(termo) ||
        p.tipo.toLowerCase().includes(termo);
      const okUrg = urg === "todas" || p.urgencia === urg;
      const okStatus = status === "todos" || p.status === status;
      return okTermo && okUrg && okStatus;
    });
  }, [processos, q, urg, status]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Link to="/app/processos/novo" className="btn-primary">
          <Plus size={16} /> Novo processo
        </Link>
      </div>

      {/* Filtros */}
      <div className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por número, cliente ou objeto…"
            className="input pl-10"
          />
        </div>
        <select
          value={urg}
          onChange={(e) => {
            setUrg(e.target.value as Urgencia | "todas");
            setPagina(1);
          }}
          className="input lg:w-44"
        >
          <option value="todas">Todas urgências</option>
          {ORDEM_URGENCIA.map((u) => (
            <option key={u} value={u}>
              {URGENCIA[u].label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPagina(1);
          }}
          className="input lg:w-44"
        >
          <option value="todos">Todos status</option>
          <option>Em andamento</option>
          <option>Suspenso</option>
          <option>Arquivado</option>
        </select>
        <span className="hidden h-10 w-10 place-items-center rounded-xl border border-line-2 text-muted lg:grid">
          <SlidersHorizontal size={16} />
        </span>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-semibold">Número</th>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Tipo</th>
                <th className="px-5 py-3 font-semibold">Vara</th>
                <th className="px-5 py-3 font-semibold">Prazo</th>
                <th className="px-5 py-3 font-semibold">Urgência</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visiveis.map((p) => (
                <tr key={p.id} className="group transition hover:bg-canvas">
                  <td className="px-5 py-4">
                    <Link to={`/app/processos/${p.id}`} className="font-mono text-xs text-medio group-hover:underline">
                      {p.numero}
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-medium text-body">{p.cliente?.nome}</td>
                  <td className="px-5 py-4 text-body-2">
                    <div>{p.tipo}</div>
                    <div className="text-xs text-muted">{p.area}</div>
                  </td>
                  <td className="px-5 py-4 text-body-2">{p.vara || "—"}</td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-body">{formatarData(p.prazo)}</div>
                    <div className="text-xs text-muted">{diasUteisLabel(p.diasUteis)}</div>
                  </td>
                  <td className="px-5 py-4">
                    <UrgencyBadge urgencia={p.urgencia} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    Nenhum processo encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-line px-5 py-4">
          <span className="text-sm text-muted">
            Mostrando {filtrados.length === 0 ? 0 : (paginaSegura - 1) * POR_PAGINA + 1}–
            {Math.min(paginaSegura * POR_PAGINA, filtrados.length)} de {filtrados.length} processos
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={paginaSegura <= 1}
              onClick={() => setPagina((p) => p - 1)}
              className="btn-ghost px-2.5 py-2 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPagina(n)}
                className={
                  n === paginaSegura
                    ? "btn-gold h-9 w-9 px-0"
                    : "btn-ghost h-9 w-9 px-0"
                }
              >
                {n}
              </button>
            ))}
            <button
              disabled={paginaSegura >= totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
              className="btn-ghost px-2.5 py-2 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
