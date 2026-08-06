import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clientes as seedClientes,
  processos as seedProcessos,
  eventosBase,
  usuario as seedUsuario,
  HOJE_REF,
  type Cliente,
  type Processo,
  type Usuario,
  type EventoCalendario,
} from "@/data/seed";
import {
  classificarUrgencia,
  diasUteisAte,
  type Urgencia,
} from "@/lib/businessDays";

/** Processo enriquecido com cálculos derivados (não persistidos). */
export interface ProcessoView extends Processo {
  cliente: Cliente | undefined;
  diasUteis: number;
  urgencia: Urgencia;
}

interface AppState {
  usuario: Usuario;
  setUsuario: (u: Usuario) => void;
  clientes: Cliente[];
  processos: ProcessoView[];
  eventos: EventoCalendario[];
  autenticado: boolean;
  login: () => void;
  logout: () => void;
  addCliente: (c: Omit<Cliente, "id">) => void;
  updateCliente: (id: string, c: Partial<Cliente>) => void;
  addProcesso: (p: Omit<Processo, "id" | "timeline" | "arquivos">) => string;
  updateProcesso: (id: string, p: Partial<Processo>) => void;
  removeProcesso: (id: string) => void;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario>(seedUsuario);
  const [clientes, setClientes] = useState<Cliente[]>(seedClientes);
  const [processosRaw, setProcessosRaw] = useState<Processo[]>(seedProcessos);
  const [autenticado, setAutenticado] = useState(false);

  const processos = useMemo<ProcessoView[]>(
    () =>
      processosRaw
        .map((p) => enrich(p, clientes))
        .sort((a, b) => a.diasUteis - b.diasUteis),
    [processosRaw, clientes],
  );

  const value = useMemo<AppState>(() => {
    const novoId = (prefix: string) =>
      `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

    return {
      usuario,
      setUsuario,
      clientes,
      processos,
      eventos: eventosBase,
      autenticado,
      login: () => setAutenticado(true),
      logout: () => setAutenticado(false),
      addCliente: (c) => setClientes((prev) => [{ ...c, id: novoId("c") }, ...prev]),
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
      getCliente: (id) => clientes.find((c) => c.id === id),
      getProcesso: (id) => processos.find((p) => p.id === id),
      processosPorCliente: (clienteId) =>
        processosRaw.filter((p) => p.clienteId === clienteId).length,
    };
  }, [usuario, clientes, processos, processosRaw, autenticado]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp deve ser usado dentro de <AppProvider>");
  return ctx;
}
