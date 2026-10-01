import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clientes as seedClientes,
  processos as seedProcessos,
  transacoes as seedTransacoes,
  usuario as seedUsuario,
  HOJE_REF,
  type Arquivo,
  type Cliente,
  type Processo,
  type StatusTransacao,
  type TransacaoFinanceira,
  type Usuario,
} from "@/data/seed";
import {
  classificarUrgencia,
  diasUteisAte,
  type Urgencia,
} from "@/lib/businessDays";
import { statusEfetivo } from "@/lib/financeiro";

/** Processo enriquecido com cálculos derivados (não persistidos). */
export interface ProcessoView extends Processo {
  cliente: Cliente | undefined;
  diasUteis: number;
  urgencia: Urgencia;
}

/** Transação enriquecida com vínculos e status derivado do vencimento. */
export interface TransacaoView extends TransacaoFinanceira {
  cliente: Cliente | undefined;
  processo: Processo | undefined;
  statusEfetivo: StatusTransacao;
}

export type Tema = "light" | "dark";

interface AppState {
  usuario: Usuario;
  setUsuario: (u: Usuario) => void;
  clientes: Cliente[];
  processos: ProcessoView[];
  autenticado: boolean;
  tema: Tema;
  setTema: (t: Tema) => void;
  login: () => void;
  logout: () => void;
  transacoes: TransacaoView[];
  addCliente: (c: Omit<Cliente, "id" | "portalToken">) => void;
  updateCliente: (id: string, c: Partial<Cliente>) => void;
  addTransacao: (t: Omit<TransacaoFinanceira, "id">) => void;
  updateTransacao: (id: string, t: Partial<TransacaoFinanceira>) => void;
  removeTransacao: (id: string) => void;
  marcarTransacaoPaga: (id: string) => void;
  addProcesso: (p: Omit<Processo, "id" | "timeline" | "arquivos">) => string;
  updateProcesso: (id: string, p: Partial<Processo>) => void;
  removeProcesso: (id: string) => void;
  addArquivo: (processoId: string, arquivo: Arquivo) => void;
  removeArquivo: (processoId: string, arquivoId: string) => void;
  getCliente: (id: string) => Cliente | undefined;
  getProcesso: (id: string) => ProcessoView | undefined;
  processosPorCliente: (clienteId: string) => number;
}

const Ctx = createContext<AppState | null>(null);

function enrich(p: Processo, clientes: Cliente[]): ProcessoView {
  const dias = diasUteisAte(p.prazo, HOJE_REF);
  return {
    ...p,
    cliente: clientes.find((c) => c.id === p.clienteId),
    diasUteis: dias,
    urgencia: classificarUrgencia(dias),
  };
}

function temaInicial(): Tema {
  const salvo = localStorage.getItem("jc-tema");
  return salvo === "dark" ? "dark" : "light";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario>(seedUsuario);
  const [clientes, setClientes] = useState<Cliente[]>(seedClientes);
  const [processosRaw, setProcessosRaw] = useState<Processo[]>(seedProcessos);
  const [transacoesRaw, setTransacoesRaw] = useState<TransacaoFinanceira[]>(seedTransacoes);
  const [autenticado, setAutenticado] = useState(false);
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "dark");
    localStorage.setItem("jc-tema", tema);
  }, [tema]);

  const processos = useMemo<ProcessoView[]>(
    () =>
      processosRaw
        .map((p) => enrich(p, clientes))
        .sort((a, b) => a.diasUteis - b.diasUteis),
    [processosRaw, clientes],
  );

  const transacoes = useMemo<TransacaoView[]>(
    () =>
      transacoesRaw
        .map((t) => ({
          ...t,
          cliente: clientes.find((c) => c.id === t.clienteId),
          processo: processosRaw.find((p) => p.id === t.processoId),
          statusEfetivo: statusEfetivo(t, HOJE_REF),
        }))
        .sort((a, b) => b.dataVencimento.localeCompare(a.dataVencimento)),
    [transacoesRaw, clientes, processosRaw],
  );

  const value = useMemo<AppState>(() => {
    const novoId = (prefix: string) =>
      `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

    /** Token do portal: primeiro nome + sufixo aleatório, ex.: MARINA-8F3K. */
    const novoToken = (nome: string) => {
      const base = nome
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^A-Za-z ]/g, "")
        .trim()
        .split(/\s+/)[0]
        .toUpperCase()
        .slice(0, 8);
      const sufixo = Math.random().toString(36).slice(2, 6).toUpperCase();
      return `${base || "CLIENTE"}-${sufixo}`;
    };

    return {
      usuario,
      setUsuario,
      clientes,
      processos,
      transacoes,
      autenticado,
      tema,
      setTema,
      login: () => setAutenticado(true),
      logout: () => setAutenticado(false),
      addCliente: (c) =>
        setClientes((prev) => [
          { ...c, id: novoId("c"), portalToken: novoToken(c.nome) },
          ...prev,
        ]),
      updateCliente: (id, patch) =>
        setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c))),
      addProcesso: (p) => {
        const id = novoId("p");
        setProcessosRaw((prev) => [
          {
            ...p,
            id,
            timeline: [
              {
                data: p.termoInicial,
                titulo: "Cadastro no JurisControle",
                desc: "Processo cadastrado e prazo posto em monitoramento.",
                done: true,
              },
            ],
            arquivos: [],
          },
          ...prev,
        ]);
        return id;
      },
      updateProcesso: (id, patch) =>
        setProcessosRaw((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
      removeProcesso: (id) => setProcessosRaw((prev) => prev.filter((p) => p.id !== id)),
      addArquivo: (processoId, arquivo) =>
        setProcessosRaw((prev) =>
          prev.map((p) =>
            p.id === processoId ? { ...p, arquivos: [...p.arquivos, arquivo] } : p,
          ),
        ),
      removeArquivo: (processoId, arquivoId) =>
        setProcessosRaw((prev) =>
          prev.map((p) =>
            p.id === processoId
              ? { ...p, arquivos: p.arquivos.filter((a) => a.id !== arquivoId) }
              : p,
          ),
        ),
      addTransacao: (t) =>
        setTransacoesRaw((prev) => [{ ...t, id: novoId("t") }, ...prev]),
      updateTransacao: (id, patch) =>
        setTransacoesRaw((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t))),
      removeTransacao: (id) =>
        setTransacoesRaw((prev) => prev.filter((t) => t.id !== id)),
      marcarTransacaoPaga: (id) =>
        setTransacoesRaw((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, status: "pago", dataPagamento: HOJE_REF } : t,
          ),
        ),
      getCliente: (id) => clientes.find((c) => c.id === id),
      getProcesso: (id) => processos.find((p) => p.id === id),
      processosPorCliente: (clienteId) =>
        processosRaw.filter((p) => p.clienteId === clienteId).length,
    };
  }, [usuario, clientes, processos, processosRaw, transacoes, autenticado, tema]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp deve ser usado dentro de <AppProvider>");
  return ctx;
}
