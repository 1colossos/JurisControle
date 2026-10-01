/* ============================================================
   Regras do módulo financeiro. No mock, substitui a API REST
   (GET /financeiro/dashboard etc.): consolida receitas, despesas,
   saldo projetado, contas em atraso e as séries dos gráficos.
   ============================================================ */

import type {
  CategoriaTransacao,
  StatusTransacao,
  TipoTransacao,
  TransacaoFinanceira,
} from "@/data/seed";

export const TIPO_LABEL: Record<TipoTransacao, string> = {
  receita: "Receita",
  despesa_operacional: "Despesa operacional",
  custas_processuais: "Custas processuais",
};

export const CATEGORIA_LABEL: Record<CategoriaTransacao, string> = {
  honorarios_contratuais: "Honorários contratuais",
  honorarios_exito: "Honorários de êxito",
  sucumbencia: "Sucumbência",
  luz: "Luz",
  internet: "Internet",
  diligencia: "Diligência",
};

/** Categorias válidas para cada tipo (usado no formulário de cadastro). */
export const CATEGORIAS_POR_TIPO: Record<TipoTransacao, CategoriaTransacao[]> = {
  receita: ["honorarios_contratuais", "honorarios_exito", "sucumbencia"],
  despesa_operacional: ["luz", "internet"],
  custas_processuais: ["diligencia"],
};

export const ehDespesa = (t: TransacaoFinanceira): boolean => t.tipo !== "receita";

/**
 * Status efetivo: uma transação pendente cujo vencimento já passou
 * é exibida como "atrasado", sem alterar o registro persistido.
 */
export function statusEfetivo(t: TransacaoFinanceira, hojeISO: string): StatusTransacao {
  if (t.status === "pago") return "pago";
  return t.dataVencimento < hojeISO ? "atrasado" : "pendente";
}

export function addDiasISO(iso: string, dias: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const data = new Date(y, m - 1, d + dias);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(
    data.getDate(),
  ).padStart(2, "0")}`;
}

const mesmoMes = (iso: string, refISO: string) => iso.slice(0, 7) === refISO.slice(0, 7);

export interface ResumoFinanceiro {
  receitasMes: number; // receitas com vencimento no mês corrente (pagas + a receber)
  despesasMes: number; // despesas/custas com vencimento no mês corrente
  saldoProjetado: number; // receitasMes - despesasMes
  emAtraso: TransacaoFinanceira[]; // pendentes com vencimento anterior a hoje
  totalEmAtraso: number;
}

/** Equivalente ao GET /financeiro/dashboard do back-end futuro. */
export function resumoFinanceiro(
  transacoes: TransacaoFinanceira[],
  hojeISO: string,
): ResumoFinanceiro {
  const doMes = transacoes.filter((t) => mesmoMes(t.dataVencimento, hojeISO));
  const receitasMes = doMes
    .filter((t) => t.tipo === "receita")
    .reduce((s, t) => s + t.valor, 0);
  const despesasMes = doMes.filter(ehDespesa).reduce((s, t) => s + t.valor, 0);
  const emAtraso = transacoes
    .filter((t) => statusEfetivo(t, hojeISO) === "atrasado")
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
  return {
    receitasMes,
    despesasMes,
    saldoProjetado: receitasMes - despesasMes,
    emAtraso,
    totalEmAtraso: emAtraso.reduce((s, t) => s + t.valor, 0),
  };
}

const MES_CURTO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export interface PontoMensal {
  mes: string; // rótulo curto, ex.: "Jan"
  receitas: number;
  despesas: number;
}

/** Série mensal Receitas × Despesas dos últimos N meses (incluindo o atual). */
export function serieMensal(
  transacoes: TransacaoFinanceira[],
  hojeISO: string,
  meses = 6,
): PontoMensal[] {
  const [anoRef, mesRef] = hojeISO.split("-").map(Number);
  const pontos: PontoMensal[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(anoRef, mesRef - 1 - i, 1);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const doMes = transacoes.filter((t) => t.dataVencimento.startsWith(chave));
    pontos.push({
      mes: MES_CURTO[d.getMonth()],
      receitas: doMes.filter((t) => t.tipo === "receita").reduce((s, t) => s + t.valor, 0),
      despesas: doMes.filter(ehDespesa).reduce((s, t) => s + t.valor, 0),
    });
  }
  return pontos;
}

export interface FatiaCategoria {
  categoria: CategoriaTransacao;
  label: string;
  valor: number;
}

/** Distribuição das despesas (operacionais + custas) por categoria. */
export function despesasPorCategoria(transacoes: TransacaoFinanceira[]): FatiaCategoria[] {
  const mapa = new Map<CategoriaTransacao, number>();
  for (const t of transacoes.filter(ehDespesa)) {
    mapa.set(t.categoria, (mapa.get(t.categoria) ?? 0) + t.valor);
  }
  return [...mapa.entries()]
    .map(([categoria, valor]) => ({ categoria, label: CATEGORIA_LABEL[categoria], valor }))
    .sort((a, b) => b.valor - a.valor);
}
