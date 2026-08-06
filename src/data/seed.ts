/* ============================================================
   Camada de dados (mock) do JurisControle.
   Dados fictícios coerentes com o wireframe do TCC. Em produção,
   viriam de uma API/back-end. A urgência NÃO é fixa: é derivada
   dinamicamente pelo motor de dias úteis (lib/businessDays).
   ============================================================ */

/** Data de referência da demonstração (mantém os prazos significativos). */
export const HOJE_REF = "2026-06-12";

export interface Usuario {
  nome: string;
  oab: string;
  email: string;
  telefone: string;
  escritorio: string;
  uf: string;
}

export type TipoCliente = "PF" | "PJ";

export interface Cliente {
  id: string;
  nome: string;
  doc: string;
  email: string;
  tel: string;
  tipo: TipoCliente;
}

export type StatusProcesso = "Em andamento" | "Suspenso" | "Arquivado";

export interface EventoTimeline {
  data: string; // AAAA-MM-DD
  titulo: string;
  desc: string;
  done: boolean;
}

export interface Arquivo {
  nome: string;
  tamanho: string;
}

export interface Processo {
  id: string;
  numero: string;
  clienteId: string;
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

export type TipoEvento = "prazo" | "audiencia" | "reuniao" | "feriado";

export interface EventoCalendario {
  data: string;
  tipo: TipoEvento;
  nome: string;
}

export const usuario: Usuario = {
  nome: "Dra. Helena Carvalho",
  oab: "OAB/SP 123.456",
  email: "helena@carvalhoadvogados.com.br",
  telefone: "(11) 99988-7766",
  escritorio: "Carvalho & Associados Advocacia",
  uf: "SP",
};

export const clientes: Cliente[] = [
  { id: "c1", nome: "Construtora Aurora Ltda.", doc: "12.345.678/0001-90", email: "contato@aurora.com.br", tel: "(11) 3344-5566", tipo: "PJ" },
  { id: "c2", nome: "Marina Vasconcelos", doc: "123.456.789-00", email: "marina.v@email.com", tel: "(11) 98877-6655", tipo: "PF" },
  { id: "c3", nome: "Pedro Henrique Sales", doc: "987.654.321-00", email: "pedrohs@gmail.com", tel: "(11) 99988-1122", tipo: "PF" },
  { id: "c4", nome: "Tech Holding S.A.", doc: "98.765.432/0001-10", email: "juridico@techholding.com", tel: "(11) 4002-8922", tipo: "PJ" },
  { id: "c5", nome: "Família Antunes", doc: "456.789.123-00", email: "antunes.familia@email.com", tel: "(11) 97766-3344", tipo: "PF" },
];

const timelinePadrao: EventoTimeline[] = [
  { data: "2024-02-10", titulo: "Distribuição", desc: "Processo distribuído para a vara competente.", done: true },
  { data: "2024-03-20", titulo: "Despacho inicial", desc: "Determinada a citação da parte requerida.", done: true },
  { data: "2024-05-05", titulo: "Audiência de conciliação", desc: "Audiência realizada — sem acordo entre as partes.", done: true },
  { data: "2026-06-13", titulo: "Prazo em curso", desc: "Prazo para manifestação corrente, monitorado pelo sistema.", done: false },
];

const arquivosPadrao: Arquivo[] = [
  { nome: "Petição inicial.pdf", tamanho: "1,2 MB" },
  { nome: "Procuração.pdf", tamanho: "320 KB" },
  { nome: "Comprovantes.pdf", tamanho: "2,8 MB" },
];

export const processos: Processo[] = [
  { id: "p1", numero: "0001234-56.2024.8.26.0100", clienteId: "c1", tipo: "Contestação", vara: "3ª Vara Cível - SP", prazo: "2026-06-13", termoInicial: "2026-06-01", status: "Em andamento", objeto: "Ação de cobrança — débitos de obra", valor: 25000, lembretes: [1, 3, 7], timeline: timelinePadrao, arquivos: arquivosPadrao },
  { id: "p2", numero: "0009876-54.2024.5.02.0070", clienteId: "c2", tipo: "Recurso Ordinário", vara: "70ª Vara do Trabalho - SP", prazo: "2026-06-16", termoInicial: "2026-06-02", status: "Em andamento", objeto: "Reclamação trabalhista — verbas rescisórias", valor: 48300, lembretes: [3, 7], timeline: timelinePadrao, arquivos: arquivosPadrao },
  { id: "p3", numero: "0004567-89.2023.8.26.0011", clienteId: "c3", tipo: "Réplica", vara: "11ª Vara Cível - SP", prazo: "2026-06-22", termoInicial: "2026-06-05", status: "Em andamento", objeto: "Ação de indenização por danos morais", valor: 15000, lembretes: [3, 7], timeline: timelinePadrao, arquivos: arquivosPadrao },
  { id: "p4", numero: "0007890-12.2024.8.26.0224", clienteId: "c4", tipo: "Memoriais", vara: "2ª Vara Empresarial - SP", prazo: "2026-07-01", termoInicial: "2026-06-10", status: "Em andamento", objeto: "Dissolução parcial de sociedade", valor: 320000, lembretes: [7, 15], timeline: timelinePadrao, arquivos: arquivosPadrao },
  { id: "p5", numero: "0002345-67.2025.8.26.0053", clienteId: "c5", tipo: "Contrarrazões", vara: "5ª Vara de Família - SP", prazo: "2026-06-15", termoInicial: "2026-06-03", status: "Em andamento", objeto: "Ação de alimentos", valor: 3600, lembretes: [1, 3], timeline: timelinePadrao, arquivos: arquivosPadrao },
  { id: "p6", numero: "0008765-43.2024.4.03.6100", clienteId: "c4", tipo: "Embargos", vara: "8ª Vara Federal - SP", prazo: "2026-06-26", termoInicial: "2026-06-08", status: "Suspenso", objeto: "Embargos à execução fiscal", valor: 92450, lembretes: [3, 7], timeline: timelinePadrao, arquivos: arquivosPadrao },
];

export const eventosBase: EventoCalendario[] = [
  { data: "2026-06-04", tipo: "prazo", nome: "Prazo: Embargos de declaração" },
  { data: "2026-06-12", tipo: "feriado", nome: "Suspensão de expediente forense" },
  { data: "2026-06-13", tipo: "prazo", nome: "Prazo: Contestação — Aurora" },
  { data: "2026-06-15", tipo: "prazo", nome: "Prazo: Contrarrazões — Família Antunes" },
  { data: "2026-06-16", tipo: "prazo", nome: "Prazo: Recurso Ordinário — Marina V." },
  { data: "2026-06-18", tipo: "audiencia", nome: "Audiência de instrução — Pedro H. Sales" },
  { data: "2026-06-22", tipo: "prazo", nome: "Prazo: Réplica — Pedro Henrique Sales" },
  { data: "2026-06-25", tipo: "reuniao", nome: "Reunião com cliente — Tech Holding" },
  { data: "2026-06-26", tipo: "prazo", nome: "Prazo: Embargos — ImportaBrasil" },
];

export const notificacoes = [
  { canal: "E-mail (SMTP)", valor: "32 enviados" },
  { canal: "WhatsApp (Z-API)", valor: "18 enviados" },
  { canal: "Notificações no app", valor: "47 entregues" },
];

export const relatorio = {
  volumeMensal: [
    { mes: "Jan", v: 18 },
    { mes: "Fev", v: 22 },
    { mes: "Mar", v: 31 },
    { mes: "Abr", v: 27 },
    { mes: "Mai", v: 34 },
    { mes: "Jun", v: 41 },
  ],
};

export const tiposProcesso = [
  "Contestação",
  "Recurso Ordinário",
  "Réplica",
  "Memoriais",
  "Contrarrazões",
  "Embargos",
  "Apelação",
  "Agravo de Instrumento",
];
