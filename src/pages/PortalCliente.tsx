/* ============================================================
   Portal do Cliente — acesso externo, somente leitura.
   Login público com CPF/CNPJ + token gerado pelo escritório
   (exibido na tela de Clientes). A sessão fica em sessionStorage;
   no back-end futuro, o token vira um JWT de escopo restrito.
   ============================================================ */

import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Copy,
  FileDown,
  Gavel,
  KeyRound,
  Landmark,
  LogOut,
  QrCode,
  Receipt,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/Brand";
import { useApp } from "@/store/AppContext";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Pill } from "@/components/ui/Badge";
import { formatarData, moeda } from "@/lib/format";
import { maskCNPJ, maskCPF, somenteDigitos } from "@/lib/validators";
import { baixarBoletoPdf, gerarPixCopiaECola } from "@/lib/documentos";
import { cn } from "@/lib/cn";
import type { StatusProcesso, TransacaoFinanceira } from "@/data/seed";

const SESSAO = "jc-portal-cliente";

const STATUS_SIMPLES: Record<StatusProcesso, string> = {
  "Em andamento": "Em tramitação",
  Suspenso: "Suspenso temporariamente",
  Arquivado: "Arquivado",
};

/* ------------------------------ Login ------------------------------ */

export function PortalLogin() {
  const { clientes } = useApp();
  const navigate = useNavigate();
  const [doc, setDoc] = useState("");
  const [token, setToken] = useState("");
  const [erro, setErro] = useState("");

  const onDoc = (v: string) => {
    const d = somenteDigitos(v);
    setDoc(d.length > 11 ? maskCNPJ(v) : maskCPF(v));
  };

  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    const cliente = clientes.find(
      (c) =>
        somenteDigitos(c.doc) === somenteDigitos(doc) &&
        c.portalToken.toUpperCase() === token.trim().toUpperCase(),
    );
    if (!cliente) {
      setErro("CPF/CNPJ ou token de acesso inválidos. Confira os dados enviados pelo escritório.");
      return;
    }
    sessionStorage.setItem(SESSAO, cliente.id);
    navigate("/portal/area");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={64} />
          <h1 className="mt-4 text-2xl">Portal do Cliente</h1>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            Carvalho &amp; Associados
          </p>
        </div>

        <div className="card p-7">
          <h2 className="text-xl">Acompanhe seu processo</h2>
          <p className="mt-1 text-sm text-muted">
            Entre com seu CPF/CNPJ e o token de acesso fornecido pelo escritório.
          </p>

          <form onSubmit={entrar} className="mt-6 space-y-4" noValidate>
            <div>
              <label className="label">CPF ou CNPJ</label>
              <div className="relative">
                <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={doc}
                  onChange={(e) => onDoc(e.target.value)}
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  className="input pl-10 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="label">Token de acesso</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  placeholder="EX.: MARINA-26"
                  className="input pl-10 font-mono uppercase"
                />
              </div>
            </div>

            {erro && (
              <p className="rounded-xl bg-critico-bg px-3.5 py-2.5 text-xs font-medium text-critico">{erro}</p>
            )}

            <button type="submit" className="btn-primary w-full">
              Acessar <ArrowRight size={16} />
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-muted">
          Demonstração: <span className="font-mono">123.456.789-09</span> · token{" "}
          <span className="font-mono">MARINA-26</span>
        </p>
      </motion.div>
    </div>
  );
}

/* ------------------------------ Área logada ------------------------------ */

export function PortalArea() {
  const { clientes, processos, transacoes } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const [aba, setAba] = useState<"processos" | "financeiro">("processos");
  const [pixDe, setPixDe] = useState<TransacaoFinanceira | null>(null);

  const clienteId = sessionStorage.getItem(SESSAO);
  const cliente = clientes.find((c) => c.id === clienteId);

  const meusProcessos = useMemo(
    () => processos.filter((p) => p.clienteId === clienteId),
    [processos, clienteId],
  );
  const minhasCobrancas = useMemo(
    () => transacoes.filter((t) => t.tipo === "receita" && t.clienteId === clienteId),
    [transacoes, clienteId],
  );
  const abertas = minhasCobrancas.filter((t) => t.statusEfetivo !== "pago");
  const recibos = minhasCobrancas.filter((t) => t.statusEfetivo === "pago");

  if (!cliente) return <Navigate to="/portal" replace />;

  const sair = () => {
    sessionStorage.removeItem(SESSAO);
    navigate("/portal");
  };

  const copiarPix = async (t: TransacaoFinanceira) => {
    try {
      await navigator.clipboard.writeText(gerarPixCopiaECola(t));
      toast("Código PIX copiado para a área de transferência.");
    } catch {
      toast("Não foi possível copiar automaticamente — selecione o código manualmente.", "warning");
    }
  };

  const baixarBoleto = (t: TransacaoFinanceira) => {
    const ok = baixarBoletoPdf(t, cliente);
    toast(
      ok
        ? "Boleto aberto em nova janela — escolha \"Salvar como PDF\"."
        : "Não foi possível abrir o boleto (pop-up bloqueado).",
      ok ? "success" : "warning",
    );
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <div className="font-serif text-base font-bold text-ink">Portal do Cliente</div>
              <div className="text-xs text-muted">{cliente.nome}</div>
            </div>
          </div>
          <button onClick={sair} className="btn-ghost !py-2 text-sm">
            <LogOut size={15} /> Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-5 py-8">
        {/* Abas */}
        <div className="flex gap-2">
          {(
            [
              { id: "processos", label: "Meus processos", icon: Gavel },
              { id: "financeiro", label: "Cobranças e recibos", icon: Receipt },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setAba(t.id)}
              className={cn(
                "btn !py-2",
                aba === t.id ? "bg-navy-800 text-white shadow-soft dark:bg-gold dark:text-navy-900" : "btn-ghost",
              )}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {aba === "processos" && (
          <div className="space-y-4">
            {meusProcessos.length === 0 && (
              <div className="card p-10 text-center text-sm text-muted">
                Nenhum processo vinculado ao seu cadastro.
              </div>
            )}
            {meusProcessos.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs text-muted">{p.numero}</div>
                    <h3 className="mt-1 text-lg">{p.objeto}</h3>
                  </div>
                  <Pill>{STATUS_SIMPLES[p.status]}</Pill>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-body-2">
                  <span className="flex items-center gap-2">
                    <Landmark size={15} className="text-muted" /> {p.vara || "Vara não informada"}
                  </span>
                  <span className="flex items-center gap-2">
                    <Gavel size={15} className="text-muted" /> {p.area} · {p.tipo}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {aba === "financeiro" && (
          <div className="space-y-5">
            <div className="card overflow-hidden">
              <div className="border-b border-line px-6 py-4">
                <h3 className="text-lg">Cobranças em aberto</h3>
                <p className="text-sm text-muted">Pague por boleto ou PIX copia e cola</p>
              </div>
              {abertas.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted">
                  Você não possui cobranças em aberto. 🎉
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {abertas.map((t) => (
                    <li key={t.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-body">{t.descricao}</div>
                        <div className="text-xs text-muted">
                          Vencimento {formatarData(t.dataVencimento)}
                          {t.statusEfetivo === "atrasado" && (
                            <span className="ml-2 font-semibold text-critico">em atraso</span>
                          )}
                        </div>
                      </div>
                      <div className="font-serif text-lg font-bold text-ink">{moeda(t.valor)}</div>
                      <div className="flex gap-2">
                        <button onClick={() => baixarBoleto(t)} className="btn-ghost !py-2 text-xs">
                          <FileDown size={14} /> Boleto
                        </button>
                        <button onClick={() => setPixDe(t)} className="btn-gold !py-2 text-xs">
                          <QrCode size={14} /> PIX
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card overflow-hidden">
              <div className="border-b border-line px-6 py-4">
                <h3 className="text-lg">Recibos</h3>
                <p className="text-sm text-muted">Cobranças quitadas</p>
              </div>
              {recibos.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted">Nenhum pagamento registrado ainda.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {recibos.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-6 py-3.5">
                      <Receipt size={16} className="shrink-0 text-baixo" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-body">{t.descricao}</div>
                        <div className="text-xs text-muted">
                          pago em {t.dataPagamento ? formatarData(t.dataPagamento) : "—"}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-body">{moeda(t.valor)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal PIX copia e cola */}
      <Modal
        open={pixDe !== null}
        onClose={() => setPixDe(null)}
        title="PIX copia e cola"
        subtitle={pixDe ? `${pixDe.descricao} — ${moeda(pixDe.valor)}` : undefined}
        footer={
          pixDe && (
            <>
              <button onClick={() => setPixDe(null)} className="btn-ghost">Fechar</button>
              <button onClick={() => copiarPix(pixDe)} className="btn-gold">
                <Copy size={15} /> Copiar código
              </button>
            </>
          )
        }
      >
        {pixDe && (
          <div className="space-y-3">
            <p className="text-sm text-body-2">
              Copie o código abaixo e cole no aplicativo do seu banco, na opção{" "}
              <strong>PIX &gt; Copia e cola</strong>.
            </p>
            <div className="break-all rounded-xl border border-line-2 bg-canvas p-4 font-mono text-xs text-body-2">
              {gerarPixCopiaECola(pixDe)}
            </div>
            <p className="text-xs text-muted">
              Código demonstrativo gerado pelo JurisControle (ambiente de testes).
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
