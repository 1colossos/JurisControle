import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Plus,
  Search,
  Send,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useApp, type TransacaoView } from "@/store/AppContext";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Pill } from "@/components/ui/Badge";
import { GraficoDespesasCategoria, GraficoReceitasDespesas } from "@/components/FinanceiroCharts";
import { formatarData, moeda } from "@/lib/format";
import {
  CATEGORIA_LABEL,
  CATEGORIAS_POR_TIPO,
  despesasPorCategoria,
  resumoFinanceiro,
  serieMensal,
  TIPO_LABEL,
} from "@/lib/financeiro";
import { buscarAlertasCobranca, executarReguaCobranca } from "@/lib/cobranca";
import { HOJE_REF, type CategoriaTransacao, type StatusTransacao, type TipoTransacao } from "@/data/seed";
import { cn } from "@/lib/cn";

const fade = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05 },
});

/** Verde = pago, amarelo = pendente, vermelho = atrasado. */
function StatusTransacaoBadge({ status }: { status: StatusTransacao }) {
  const meta: Record<StatusTransacao, { label: string; cls: string }> = {
    pago: { label: "Pago", cls: "bg-baixo-bg text-baixo" },
    pendente: { label: "Pendente", cls: "bg-alto-bg text-alto" },
    atrasado: { label: "Atrasado", cls: "bg-critico-bg text-critico" },
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", meta[status].cls)}>
      {meta[status].label}
    </span>
  );
}

interface FormTransacao {
  descricao: string;
  tipo: TipoTransacao;
  categoria: CategoriaTransacao;
  valor: string;
  dataVencimento: string;
  status: "pendente" | "pago";
  clienteId: string;
  processoId: string;
}

const formVazio: FormTransacao = {
  descricao: "",
  tipo: "receita",
  categoria: "honorarios_contratuais",
  valor: "",
  dataVencimento: "",
  status: "pendente",
  clienteId: "",
  processoId: "",
};

export function Financeiro() {
  const { transacoes, clientes, processos, addTransacao, removeTransacao, marcarTransacaoPaga } = useApp();
  const toast = useToast();

  const [q, setQ] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | TipoTransacao>("todos");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | StatusTransacao>("todos");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<FormTransacao>(formVazio);
  const [erros, setErros] = useState<Partial<Record<keyof FormTransacao, string>>>({});
  const [enviosFeitos, setEnviosFeitos] = useState(0);

  const resumo = useMemo(() => resumoFinanceiro(transacoes, HOJE_REF), [transacoes]);
  const serie = useMemo(() => serieMensal(transacoes, HOJE_REF), [transacoes]);
  const fatias = useMemo(() => despesasPorCategoria(transacoes), [transacoes]);
  const alertas = useMemo(() => buscarAlertasCobranca(transacoes, clientes, HOJE_REF), [transacoes, clientes]);

  const filtradas = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return transacoes.filter(
      (t) =>
        (tipoFiltro === "todos" || t.tipo === tipoFiltro) &&
        (statusFiltro === "todos" || t.statusEfetivo === statusFiltro) &&
        (!termo ||
          t.descricao.toLowerCase().includes(termo) ||
          t.cliente?.nome.toLowerCase().includes(termo) ||
          t.processo?.numero.includes(termo)),
    );
  }, [transacoes, q, tipoFiltro, statusFiltro]);

  const dispararRegua = () => {
    const envios = executarReguaCobranca(alertas);
    setEnviosFeitos(envios.length);
    toast(
      envios.length
        ? `Régua executada: ${envios.length} alerta(s) enviado(s) por e-mail/WhatsApp (simulação).`
        : "Nenhuma cobrança elegível hoje.",
      envios.length ? "success" : "info",
    );
  };

  const abrirNova = () => {
    setForm(formVazio);
    setErros({});
    setAberto(true);
  };

  const setTipo = (tipo: TipoTransacao) =>
    setForm((f) => ({ ...f, tipo, categoria: CATEGORIAS_POR_TIPO[tipo][0] }));

  const validar = (): boolean => {
    const e: typeof erros = {};
    if (form.descricao.trim().length < 3) e.descricao = "Descreva a transação (mín. 3 caracteres).";
    const valor = Number(form.valor.replace(",", "."));
    if (!form.valor || Number.isNaN(valor) || valor <= 0) e.valor = "Informe um valor maior que zero.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dataVencimento)) e.dataVencimento = "Informe a data de vencimento.";
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const salvar = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validar()) return;
    addTransacao({
      descricao: form.descricao.trim(),
      tipo: form.tipo,
      categoria: form.categoria,
      valor: Number(form.valor.replace(",", ".")),
      dataVencimento: form.dataVencimento,
      status: form.status,
      dataPagamento: form.status === "pago" ? HOJE_REF : undefined,
      clienteId: form.clienteId || undefined,
      processoId: form.processoId || undefined,
    });
    toast("Transação cadastrada com sucesso.");
    setAberto(false);
  };

  const campo = (k: keyof FormTransacao) =>
    erros[k] ? <p className="mt-1 text-xs font-medium text-critico">{erros[k]}</p> : null;

  const processosDoCliente = form.clienteId
    ? processos.filter((p) => p.clienteId === form.clienteId)
    : processos;

  const kpis = [
    { icon: TrendingUp, box: "bg-baixo-bg text-baixo", num: moeda(resumo.receitasMes), label: "Receitas do mês", trend: "vencimentos de junho" },
    { icon: TrendingDown, box: "bg-critico-bg text-critico", num: moeda(resumo.despesasMes), label: "Despesas do mês", trend: "operacionais + custas" },
    { icon: Wallet, box: "bg-medio-bg text-medio", num: moeda(resumo.saldoProjetado), label: "Saldo projetado", trend: "receitas − despesas" },
    { icon: AlertTriangle, box: "bg-alto-bg text-alto", num: moeda(resumo.totalEmAtraso), label: `Em atraso (${resumo.emAtraso.length})`, trend: "pendentes vencidas" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={abrirNova} className="btn-primary">
          <Plus size={16} /> Nova transação
        </button>
      </div>

      {/* KPIs consolidados (equivalente ao GET /financeiro/dashboard) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} {...fade(i)} className="card p-5">
            <div className="flex items-start justify-between">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${k.box}`}>
                <k.icon size={20} />
              </span>
              <span className="text-xs font-medium text-muted">{k.trend}</span>
            </div>
            <div className="mt-4 font-serif text-2xl font-bold text-ink">{k.num}</div>
            <div className="text-sm text-body-2">{k.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Dashboard financeiro (Recharts) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div {...fade(4)} className="lg:col-span-2">
          <GraficoReceitasDespesas dados={serie} />
        </motion.div>
        <motion.div {...fade(5)}>
          <GraficoDespesasCategoria fatias={fatias} />
        </motion.div>
      </div>

      {/* Régua de cobrança (job diário das 08:00, simulado no mock) */}
      <motion.div {...fade(6)} className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
          <div>
            <h3 className="text-lg">Régua de cobrança</h3>
            <p className="text-sm text-muted">
              Executada todos os dias às 08:00: receitas que vencem em 3 dias e as vencidas ontem
            </p>
          </div>
          <button onClick={dispararRegua} className="btn-gold" disabled={alertas.length === 0}>
            <Send size={15} /> Simular disparo de hoje
          </button>
        </div>
        {alertas.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted">
            Nenhuma cobrança elegível para a régua na data de referência.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {alertas.map((a) => (
              <li key={a.transacao.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                    a.motivo === "venceu_ontem" ? "bg-critico-bg text-critico" : "bg-alto-bg text-alto",
                  )}
                >
                  <BellRing size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-body">
                    {a.transacao.descricao} — {a.cliente?.nome ?? "sem cliente vinculado"}
                  </div>
                  <div className="text-xs text-muted">
                    {a.motivo === "venceu_ontem" ? "Venceu ontem" : "Vence em 3 dias"} ·{" "}
                    {formatarData(a.transacao.dataVencimento)} · {moeda(a.transacao.valor)} · e-mail + WhatsApp
                  </div>
                </div>
                {enviosFeitos > 0 && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-baixo">
                    <CheckCircle2 size={14} /> enviado
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* Filtros */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por descrição, cliente ou processo…"
            className="input pl-10"
          />
        </div>
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value as typeof tipoFiltro)}
          className="input sm:w-56"
        >
          <option value="todos">Todos os tipos</option>
          {(Object.keys(TIPO_LABEL) as TipoTransacao[]).map((t) => (
            <option key={t} value={t}>{TIPO_LABEL[t]}</option>
          ))}
        </select>
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value as typeof statusFiltro)}
          className="input sm:w-44"
        >
          <option value="todos">Todos os status</option>
          <option value="pago">Pago</option>
          <option value="pendente">Pendente</option>
          <option value="atrasado">Atrasado</option>
        </select>
      </div>

      {/* Tabela de transações */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-semibold">Descrição</th>
                <th className="px-5 py-3 font-semibold">Cliente / Processo</th>
                <th className="px-5 py-3 text-right font-semibold">Valor</th>
                <th className="px-5 py-3 font-semibold">Vencimento</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtradas.map((t: TransacaoView) => (
                <tr key={t.id} className="transition hover:bg-canvas">
                  <td className="px-5 py-4">
                    <div className="font-medium text-body">{t.descricao}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <Pill>{TIPO_LABEL[t.tipo]}</Pill>
                      <span className="text-xs text-muted">{CATEGORIA_LABEL[t.categoria]}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-body-2">
                    <div className="text-sm">{t.cliente?.nome ?? "—"}</div>
                    {t.processo && (
                      <div className="font-mono text-xs text-muted">{t.processo.numero}</div>
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-5 py-4 text-right font-semibold",
                      t.tipo === "receita" ? "text-baixo" : "text-body",
                    )}
                  >
                    {t.tipo === "receita" ? "+" : "−"} {moeda(t.valor)}
                  </td>
                  <td className="px-5 py-4 text-body-2">
                    {formatarData(t.dataVencimento)}
                    {t.dataPagamento && (
                      <span className="block text-xs text-muted">pago em {formatarData(t.dataPagamento)}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusTransacaoBadge status={t.statusEfetivo} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5">
                      {t.statusEfetivo !== "pago" && (
                        <button
                          onClick={() => {
                            marcarTransacaoPaga(t.id);
                            toast("Transação marcada como paga.");
                          }}
                          title="Marcar como paga"
                          className="rounded-lg p-2 text-muted transition hover:bg-baixo-bg hover:text-baixo"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          removeTransacao(t.id);
                          toast("Transação excluída.", "info");
                        }}
                        title="Excluir"
                        className="rounded-lg p-2 text-muted transition hover:bg-critico-bg hover:text-critico"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de cadastro */}
      <Modal
        open={aberto}
        onClose={() => setAberto(false)}
        title="Nova transação"
        subtitle="Receita, despesa operacional ou custas processuais"
        size="lg"
        footer={
          <>
            <button onClick={() => setAberto(false)} className="btn-ghost">Cancelar</button>
            <button type="submit" form="form-transacao" className="btn-gold">Salvar</button>
          </>
        }
      >
        <form id="form-transacao" onSubmit={salvar} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <label className="label">Descrição</label>
            <input
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              maxLength={120}
              placeholder="Honorários contratuais — parcela 01/12"
              className="input"
            />
            {campo("descricao")}
          </div>
          <div>
            <label className="label">Tipo</label>
            <select value={form.tipo} onChange={(e) => setTipo(e.target.value as TipoTransacao)} className="input">
              {(Object.keys(TIPO_LABEL) as TipoTransacao[]).map((t) => (
                <option key={t} value={t}>{TIPO_LABEL[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Categoria</label>
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value as CategoriaTransacao })}
              className="input"
            >
              {CATEGORIAS_POR_TIPO[form.tipo].map((c) => (
                <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Valor (R$)</label>
            <input
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value.replace(/[^\d.,]/g, "") })}
              inputMode="decimal"
              placeholder="2500,00"
              className="input"
            />
            {campo("valor")}
          </div>
          <div>
            <label className="label">Data de vencimento</label>
            <input
              type="date"
              value={form.dataVencimento}
              onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })}
              className="input"
            />
            {campo("dataVencimento")}
          </div>
          <div>
            <label className="label">Cliente (opcional)</label>
            <select
              value={form.clienteId}
              onChange={(e) => setForm({ ...form, clienteId: e.target.value, processoId: "" })}
              className="input"
            >
              <option value="">Sem vínculo</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Processo (opcional)</label>
            <select
              value={form.processoId}
              onChange={(e) => setForm({ ...form, processoId: e.target.value })}
              className="input"
            >
              <option value="">Sem vínculo</option>
              {processosDoCliente.map((p) => (
                <option key={p.id} value={p.id}>{p.numero}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Situação</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "pendente" | "pago" })}
              className="input"
            >
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
