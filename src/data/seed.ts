/* ============================================================
   Camada de dados (mock) do JurisControle.
   Dados fictícios coerentes com o wireframe do TCC. Em produção,
   viriam de uma API/back-end. Todas as datas são RELATIVAS à data
   real de execução (HOJE_REF = hoje), e os prazos dos processos
   são gerados pelo próprio motor de dias úteis (lib/businessDays)
   — a demonstração nunca fica desatualizada nem incoerente.
   ============================================================ */

import type { AreaProcesso } from "@/lib/prazos";
import { validarCPF, validarCNPJ } from "@/lib/validators";
import { somarDiasUteis, subtrairDiasUteis } from "@/lib/businessDays";

/* ----------------- Datas relativas à data real ----------------- */

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

const iso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Data de referência do sistema: o dia real de hoje. O mock inteiro é
    gerado relativo a ela, então a demonstração nunca fica desatualizada. */
export const HOJE_REF = iso(hoje);

/** Data a N dias corridos de hoje (negativo = passado). */
const emDias = (n: number): string => {
  const d = new Date(hoje);
  d.setDate(d.getDate() + n);
  return iso(d);
};

/** Dia fixo em um mês relativo ao atual (ex.: noMes(-2, 15) = dia 15 de 2 meses atrás). */
const noMes = (offsetMeses: number, dia: number): string => {
  const d = new Date(hoje.getFullYear(), hoje.getMonth() + offsetMeses, dia);
  // dia inexistente no mês (ex.: 30/02) → último dia do mês
  if (d.getDate() !== dia) return iso(new Date(d.getFullYear(), d.getMonth(), 0));
  return iso(d);
};

/** Termo inicial de um prazo de `total` dias úteis que ainda tem `restantes`
    dias úteis até vencer — o prazo final sai do próprio motor de contagem. */
const termoComRestantes = (total: number, restantes: number): string =>
  subtrairDiasUteis(HOJE_REF, total - restantes);

export const AREAS_ATUACAO = [
  "Empresarial",
  "Civil",
  "Penal",
  "Previdenciário",
  "Tributário",
  "Trabalhista",
  "Outra área",
];

export interface Usuario {
  nome: string;
  oab: string;
  email: string;
  telefone: string;
  escritorio: string; // opcional — pode ficar vazio
  uf: string;
  dataNascimento: string; // AAAA-MM-DD
  areas: string[];
  foto?: string; // URL local (upload) da foto de perfil
}

export type TipoCliente = "PF" | "PJ";

export type EstadoCivil = "Solteiro(a)" | "Casado(a)" | "Divorciado(a)" | "Viúvo(a)";

export interface Cliente {
  id: string;
  nome: string;
  doc: string;
  email: string;
  tel: string;
  tipo: TipoCliente;
  estadoCivil?: EstadoCivil; // apenas pessoa física
  endereco: string; // domicílio do cliente
  portalToken: string; // token de acesso ao Portal do Cliente, gerado pelo escritório
  /** Foto de perfil em Data URL (Base64) — payload pronto para a futura API REST. */
  foto?: string;
}

export type StatusProcesso = "Em andamento" | "Suspenso" | "Arquivado";

export interface EventoTimeline {
  data: string; // AAAA-MM-DD
  titulo: string;
  desc: string;
  done: boolean;
}

export interface Arquivo {
  id: string;
  nome: string;
  tamanho: string;
  mime?: string;
  url?: string; // object URL para pré-visualização (uploads locais)
}

export interface Processo {
  id: string;
  numero: string;
  clienteId: string;
  area: AreaProcesso;
  tipo: string;
  vara: string;
  prazo: string; // AAAA-MM-DD
  termoInicial: string; // AAAA-MM-DD
  status: StatusProcesso;
  objeto: string;
  valor: number;
  lembretes: number[]; // dias úteis de antecedência
  timeline: EventoTimeline[];
  arquivos: Arquivo[];
}

export const usuario: Usuario = {
  nome: "Dr. Afonso Ferreira",
  oab: "OAB/MA 123.456",
  email: "afonso@ferreiraadvogados.com.br",
  telefone: "(98) 99999-8888",
  escritorio: "Ferreira & Associados Advocacia",
  uf: "MA",
  dataNascimento: "2005-10-20",
  areas: ["Civil", "Penal", "Empresarial"],
};

export const clientes: Cliente[] = [
  { id: "c1", nome: "Construtora Aurora Ltda.", doc: "12.345.678/0001-95", email: "contato@aurora.com.br", tel: "(11) 3344-5566", tipo: "PJ", endereco: "São Luís - MA", portalToken: "AURORA-26" },
  { id: "c2", nome: "Marina Vasconcelos", doc: "123.456.789-09", email: "marina.v@email.com", tel: "(11) 98877-6655", tipo: "PF", estadoCivil: "Casado(a)", endereco: "Itapecuru Mirim - MA", portalToken: "MARINA-26" },
  { id: "c3", nome: "Pedro Henrique Sales", doc: "987.654.321-00", email: "pedrohs@gmail.com", tel: "(11) 99988-1122", tipo: "PF", estadoCivil: "Solteiro(a)", endereco: "Itapecuru Mirim - MA", portalToken: "PEDRO-26" },
  { id: "c4", nome: "Tech Holding S.A.", doc: "98.765.432/0001-98", email: "juridico@techholding.com", tel: "(11) 4002-8922", tipo: "PJ", endereco: "Imperatriz - MA", portalToken: "TECH-26" },
  { id: "c5", nome: "Família Antunes", doc: "456.789.123-64", email: "antunes.familia@email.com", tel: "(11) 97766-3344", tipo: "PF", estadoCivil: "Viúvo(a)", endereco: "Itapecuru Mirim - MA", portalToken: "ANTUNES-26" },
];

// Sanidade do mock: o seed entra direto no estado (não passa pelo formulário,
// onde validarCPF/CNPJ rodam), então os documentos são conferidos aqui em
// desenvolvimento para nenhum CPF/CNPJ inválido passar despercebido.
if (import.meta.env.DEV) {
  for (const c of clientes) {
    const ok = c.tipo === "PF" ? validarCPF(c.doc) : validarCNPJ(c.doc);
    if (!ok) console.warn(`[seed] ${c.tipo === "PF" ? "CPF" : "CNPJ"} inválido para "${c.nome}": ${c.doc}`);
  }
}

const timelinePadrao: EventoTimeline[] = [
  { data: emDias(-240), titulo: "Distribuição", desc: "Processo distribuído para a vara competente.", done: true },
  { data: emDias(-200), titulo: "Despacho inicial", desc: "Determinada a citação da parte requerida.", done: true },
  { data: emDias(-120), titulo: "Audiência de conciliação", desc: "Audiência realizada — sem acordo entre as partes.", done: true },
  { data: emDias(1), titulo: "Prazo em curso", desc: "Prazo para manifestação corrente, monitorado pelo sistema.", done: false },
];

const arquivosPadrao: Arquivo[] = [
  { id: "a1", nome: "Petição inicial.pdf", tamanho: "1,2 MB", mime: "application/pdf" },
  { id: "a2", nome: "Procuração.pdf", tamanho: "320 KB", mime: "application/pdf" },
  { id: "a3", nome: "Comprovantes.pdf", tamanho: "2,8 MB", mime: "application/pdf" },
];

/* Termos iniciais calculados para distribuir os processos nas faixas de
   urgência (crítico/alto/médio/baixo) na data real de hoje; o vencimento
   sai do próprio motor de contagem com o prazo legal de cada peça. */
const t1 = termoComRestantes(15, 1); // Contestação cível (15 úteis) — resta 1 dia útil
const t2 = termoComRestantes(8, 2); // Recurso Ordinário (8 úteis) — restam 2
const t3 = termoComRestantes(15, 6); // Réplica (15 úteis) — restam 6
const t4 = termoComRestantes(15, 12); // Memoriais (15 úteis) — restam 12
const t5 = termoComRestantes(15, 3); // Contrarrazões (15 úteis) — restam 3
const t6 = termoComRestantes(30, 18); // Embargos à Execução Fiscal (30 úteis) — restam 18

export const processos: Processo[] = [
  { id: "p1", numero: "0001234-56.2024.8.26.0100", clienteId: "c1", area: "Cível", tipo: "Contestação", vara: "3ª Vara Cível - MA", prazo: somarDiasUteis(t1, 15), termoInicial: t1, status: "Em andamento", objeto: "Ação de cobrança — débitos de obra", valor: 25000, lembretes: [1, 3, 7], timeline: timelinePadrao, arquivos: arquivosPadrao },
  { id: "p2", numero: "0009876-54.2024.5.02.0070", clienteId: "c2", area: "Trabalhista", tipo: "Recurso Ordinário", vara: "70ª Vara do Trabalho - MA", prazo: somarDiasUteis(t2, 8), termoInicial: t2, status: "Em andamento", objeto: "Reclamação trabalhista — verbas rescisórias", valor: 48300, lembretes: [3, 7], timeline: timelinePadrao, arquivos: arquivosPadrao },
  { id: "p3", numero: "0004567-89.2023.8.26.0011", clienteId: "c3", area: "Cível", tipo: "Réplica / Impugnação à Contestação", vara: "11ª Vara Cível - MA", prazo: somarDiasUteis(t3, 15), termoInicial: t3, status: "Em andamento", objeto: "Ação de indenização por danos morais", valor: 15000, lembretes: [3, 7], timeline: timelinePadrao, arquivos: arquivosPadrao },
  { id: "p4", numero: "0007890-12.2024.8.26.0224", clienteId: "c4", area: "Empresarial", tipo: "Memoriais / Alegações Finais", vara: "2ª Vara Empresarial - MA", prazo: somarDiasUteis(t4, 15), termoInicial: t4, status: "Em andamento", objeto: "Dissolução parcial de sociedade", valor: 320000, lembretes: [7, 15], timeline: timelinePadrao, arquivos: arquivosPadrao },
  { id: "p5", numero: "0002345-67.2025.8.26.0053", clienteId: "c5", area: "Cível", tipo: "Contrarrazões de Apelação", vara: "5ª Vara de Família - MA", prazo: somarDiasUteis(t5, 15), termoInicial: t5, status: "Em andamento", objeto: "Ação de alimentos", valor: 36000, lembretes: [1, 3], timeline: timelinePadrao, arquivos: arquivosPadrao },
  { id: "p6", numero: "0008765-43.2024.4.03.6100", clienteId: "c4", area: "Tributária", tipo: "Embargos à Execução Fiscal", vara: "8ª Vara Federal - MA", prazo: somarDiasUteis(t6, 30), termoInicial: t6, status: "Suspenso", objeto: "Embargos à execução fiscal", valor: 92450, lembretes: [3, 7], timeline: timelinePadrao, arquivos: arquivosPadrao },
];

export const notificacoes = [
  { canal: "E-mail (SMTP)", valor: "32 enviados" },
  { canal: "WhatsApp (Z-API)", valor: "18 enviados" },
  { canal: "Notificações no app", valor: "47 entregues" },
];

/* ------------------------- Módulo financeiro ------------------------- */

export type TipoTransacao = "receita" | "despesa_operacional" | "custas_processuais";

export type CategoriaTransacao =
  | "honorarios_contratuais"
  | "honorarios_exito"
  | "sucumbencia"
  | "luz"
  | "internet"
  | "diligencia";

/** Status persistido; "atrasado" também é derivado quando pendente vence. */
export type StatusTransacao = "pendente" | "pago" | "atrasado";

export interface TransacaoFinanceira {
  id: string;
  descricao: string;
  tipo: TipoTransacao;
  categoria: CategoriaTransacao;
  valor: number;
  dataVencimento: string; // AAAA-MM-DD
  dataPagamento?: string; // AAAA-MM-DD (apenas quando paga)
  status: StatusTransacao;
  clienteId?: string; // FK opcional → Cliente
  processoId?: string; // FK opcional → Processo
}

/* Vencimentos relativos: meses passados pagos, pendências futuras próximas
   e algumas vencidas (alimentam a régua de cobrança e o status "atrasado"). */
export const transacoes: TransacaoFinanceira[] = [
  // ---- Receitas: honorários contratuais (parcelas mensais) ----
  { id: "t01", descricao: "Honorários contratuais — parcela 01/12", tipo: "receita", categoria: "honorarios_contratuais", valor: 2500, dataVencimento: noMes(-5, 15), dataPagamento: noMes(-5, 14), status: "pago", clienteId: "c1", processoId: "p1" },
  { id: "t02", descricao: "Honorários contratuais — parcela 02/12", tipo: "receita", categoria: "honorarios_contratuais", valor: 2500, dataVencimento: noMes(-4, 15), dataPagamento: noMes(-4, 15), status: "pago", clienteId: "c1", processoId: "p1" },
  { id: "t03", descricao: "Honorários contratuais — parcela 03/12", tipo: "receita", categoria: "honorarios_contratuais", valor: 2500, dataVencimento: noMes(-3, 15), dataPagamento: noMes(-3, 17), status: "pago", clienteId: "c1", processoId: "p1" },
  { id: "t04", descricao: "Honorários contratuais — parcela 04/12", tipo: "receita", categoria: "honorarios_contratuais", valor: 2500, dataVencimento: noMes(-2, 15), dataPagamento: noMes(-2, 15), status: "pago", clienteId: "c1", processoId: "p1" },
  { id: "t05", descricao: "Honorários contratuais — parcela 05/12", tipo: "receita", categoria: "honorarios_contratuais", valor: 2500, dataVencimento: noMes(-1, 15), dataPagamento: noMes(-1, 18), status: "pago", clienteId: "c1", processoId: "p1" },
  { id: "t06", descricao: "Honorários contratuais — parcela 06/12", tipo: "receita", categoria: "honorarios_contratuais", valor: 2500, dataVencimento: emDias(3), status: "pendente", clienteId: "c1", processoId: "p1" },
  { id: "t07", descricao: "Honorários contratuais — assessoria mensal", tipo: "receita", categoria: "honorarios_contratuais", valor: 4800, dataVencimento: noMes(-5, 10), dataPagamento: noMes(-5, 10), status: "pago", clienteId: "c4" },
  { id: "t08", descricao: "Honorários contratuais — assessoria mensal", tipo: "receita", categoria: "honorarios_contratuais", valor: 4800, dataVencimento: noMes(-4, 10), dataPagamento: noMes(-4, 11), status: "pago", clienteId: "c4" },
  { id: "t09", descricao: "Honorários contratuais — assessoria mensal", tipo: "receita", categoria: "honorarios_contratuais", valor: 4800, dataVencimento: noMes(-3, 10), dataPagamento: noMes(-3, 10), status: "pago", clienteId: "c4" },
  { id: "t10", descricao: "Honorários contratuais — assessoria mensal", tipo: "receita", categoria: "honorarios_contratuais", valor: 4800, dataVencimento: noMes(-2, 10), dataPagamento: noMes(-2, 12), status: "pago", clienteId: "c4" },
  { id: "t11", descricao: "Honorários contratuais — assessoria mensal", tipo: "receita", categoria: "honorarios_contratuais", valor: 4800, dataVencimento: noMes(-1, 10), dataPagamento: noMes(-1, 10), status: "pago", clienteId: "c4" },
  { id: "t12", descricao: "Honorários contratuais — assessoria mensal", tipo: "receita", categoria: "honorarios_contratuais", valor: 4800, dataVencimento: emDias(8), status: "pendente", clienteId: "c4" },
  { id: "t13", descricao: "Honorários contratuais — parcela única", tipo: "receita", categoria: "honorarios_contratuais", valor: 1950, dataVencimento: emDias(-1), status: "pendente", clienteId: "c2", processoId: "p2" },
  { id: "t14", descricao: "Honorários contratuais — entrada do contrato", tipo: "receita", categoria: "honorarios_contratuais", valor: 1200, dataVencimento: emDias(13), status: "pendente", clienteId: "c3", processoId: "p3" },

  // ---- Receitas: êxito e sucumbência ----
  { id: "t15", descricao: "Honorários de êxito — acordo homologado", tipo: "receita", categoria: "honorarios_exito", valor: 8200, dataVencimento: noMes(-3, 28), dataPagamento: noMes(-3, 28), status: "pago", clienteId: "c3", processoId: "p3" },
  { id: "t16", descricao: "Honorários de êxito — sentença favorável", tipo: "receita", categoria: "honorarios_exito", valor: 12400, dataVencimento: noMes(-1, 22), dataPagamento: noMes(-1, 26), status: "pago", clienteId: "c4", processoId: "p4" },
  { id: "t17", descricao: "Honorários de êxito — alimentos (1ª parcela)", tipo: "receita", categoria: "honorarios_exito", valor: 3200, dataVencimento: emDias(-4), status: "pendente", clienteId: "c5", processoId: "p5" },
  { id: "t18", descricao: "Sucumbência — execução de honorários", tipo: "receita", categoria: "sucumbencia", valor: 1850, dataVencimento: noMes(-4, 20), dataPagamento: noMes(-4, 20), status: "pago", clienteId: "c1", processoId: "p1" },
  { id: "t19", descricao: "Sucumbência — cumprimento de sentença", tipo: "receita", categoria: "sucumbencia", valor: 2300, dataVencimento: noMes(-2, 26), dataPagamento: noMes(-2, 28), status: "pago", clienteId: "c2", processoId: "p2" },
  { id: "t20", descricao: "Sucumbência — verba fixada em apelação", tipo: "receita", categoria: "sucumbencia", valor: 1500, dataVencimento: emDias(-13), status: "pendente", clienteId: "c3", processoId: "p3" },

  // ---- Despesas operacionais do escritório ----
  { id: "t21", descricao: "Conta de luz — Enel", tipo: "despesa_operacional", categoria: "luz", valor: 448.32, dataVencimento: noMes(-6, 5), dataPagamento: noMes(-6, 5), status: "pago" },
  { id: "t22", descricao: "Conta de luz — Enel", tipo: "despesa_operacional", categoria: "luz", valor: 462.1, dataVencimento: noMes(-5, 5), dataPagamento: noMes(-5, 5), status: "pago" },
  { id: "t23", descricao: "Conta de luz — Enel", tipo: "despesa_operacional", categoria: "luz", valor: 480.55, dataVencimento: noMes(-4, 5), dataPagamento: noMes(-4, 6), status: "pago" },
  { id: "t24", descricao: "Conta de luz — Enel", tipo: "despesa_operacional", categoria: "luz", valor: 455.9, dataVencimento: noMes(-3, 6), dataPagamento: noMes(-3, 6), status: "pago" },
  { id: "t25", descricao: "Conta de luz — Enel", tipo: "despesa_operacional", categoria: "luz", valor: 472.18, dataVencimento: noMes(-2, 5), dataPagamento: noMes(-2, 5), status: "pago" },
  { id: "t26", descricao: "Conta de luz — Enel", tipo: "despesa_operacional", categoria: "luz", valor: 490.75, dataVencimento: noMes(-1, 5), dataPagamento: noMes(-1, 5), status: "pago" },
  { id: "t27", descricao: "Internet fibra 500 MB — Vivo", tipo: "despesa_operacional", categoria: "internet", valor: 189.9, dataVencimento: noMes(-6, 10), dataPagamento: noMes(-6, 10), status: "pago" },
  { id: "t28", descricao: "Internet fibra 500 MB — Vivo", tipo: "despesa_operacional", categoria: "internet", valor: 189.9, dataVencimento: noMes(-5, 10), dataPagamento: noMes(-5, 10), status: "pago" },
  { id: "t29", descricao: "Internet fibra 500 MB — Vivo", tipo: "despesa_operacional", categoria: "internet", valor: 189.9, dataVencimento: noMes(-4, 10), dataPagamento: noMes(-4, 10), status: "pago" },
  { id: "t30", descricao: "Internet fibra 500 MB — Vivo", tipo: "despesa_operacional", categoria: "internet", valor: 189.9, dataVencimento: noMes(-3, 10), dataPagamento: noMes(-3, 10), status: "pago" },
  { id: "t31", descricao: "Internet fibra 500 MB — Vivo", tipo: "despesa_operacional", categoria: "internet", valor: 189.9, dataVencimento: noMes(-2, 10), dataPagamento: noMes(-2, 11), status: "pago" },
  { id: "t32", descricao: "Internet fibra 500 MB — Vivo", tipo: "despesa_operacional", categoria: "internet", valor: 189.9, dataVencimento: noMes(-1, 10), dataPagamento: noMes(-1, 10), status: "pago" },

  // ---- Custas processuais e diligências ----
  { id: "t33", descricao: "Diligência — oficial de justiça (citação)", tipo: "custas_processuais", categoria: "diligencia", valor: 350, dataVencimento: noMes(-4, 18), dataPagamento: noMes(-4, 18), status: "pago", clienteId: "c1", processoId: "p1" },
  { id: "t34", descricao: "Diligência — cópias e autenticações", tipo: "custas_processuais", categoria: "diligencia", valor: 220, dataVencimento: noMes(-3, 25), dataPagamento: noMes(-3, 25), status: "pago", clienteId: "c3", processoId: "p3" },
  { id: "t35", descricao: "Diligência — perícia contábil (adiantamento)", tipo: "custas_processuais", categoria: "diligencia", valor: 540, dataVencimento: noMes(-2, 15), dataPagamento: noMes(-2, 16), status: "pago", clienteId: "c4", processoId: "p4" },
  { id: "t36", descricao: "Diligência — deslocamento audiência", tipo: "custas_processuais", categoria: "diligencia", valor: 380, dataVencimento: noMes(-1, 20), dataPagamento: noMes(-1, 20), status: "pago", clienteId: "c2", processoId: "p2" },
  { id: "t37", descricao: "Diligência — guia de custas recursais", tipo: "custas_processuais", categoria: "diligencia", valor: 310, dataVencimento: emDias(6), status: "pendente", clienteId: "c1", processoId: "p1" },
];
