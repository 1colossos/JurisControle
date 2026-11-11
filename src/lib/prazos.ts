/* ============================================================
   Catálogo de procedimentos/recursos por RAMO DO DIREITO, com os
   prazos legais de referência e a forma de contagem de cada um
   (dias úteis × corridos × meses/anos). Alimenta os selects em
   cascata do cadastro de processos e a calculadora de prazos.
   Toda regra é apenas SUGESTÃO de cálculo: o usuário sempre pode
   definir a data de referência manualmente.
   ============================================================ */

import { somarDiasUteis, somarDiasCorridos, somarMeses } from "./businessDays";

export const AREAS = [
  "Cível",
  "Penal",
  "Trabalhista",
  "Tributária",
  "Previdenciária",
  "Juizados Especiais",
  "Empresarial",
  "Outra",
] as const;

export type AreaProcesso = (typeof AREAS)[number];

export type Contagem = "uteis" | "corridos";

export type UnidadePrazo = "dias" | "meses" | "anos";

export interface ProcedimentoPrazo {
  /** Nome exibido no select de procedimentos/recursos. */
  nome: string;
  /** Quantidade do prazo legal; null = sem contagem automática (referência manual). */
  quantidade: number | null;
  unidade: UnidadePrazo;
  contagem: Contagem;
  /** Fundamento/observação exibida ao usuário. */
  obs: string;
}

/** Valor sentinela do select para "Outros / Inserção Manual". */
export const PROCEDIMENTO_MANUAL = "__manual__";

const manual = (nome: string, obs: string): ProcedimentoPrazo => ({
  nome,
  quantidade: null,
  unidade: "dias",
  contagem: "uteis",
  obs,
});
const uteis = (nome: string, dias: number, obs: string): ProcedimentoPrazo => ({
  nome,
  quantidade: dias,
  unidade: "dias",
  contagem: "uteis",
  obs,
});
const corridos = (nome: string, dias: number, obs: string): ProcedimentoPrazo => ({
  nome,
  quantidade: dias,
  unidade: "dias",
  contagem: "corridos",
  obs,
});
const meses = (nome: string, n: number, obs: string): ProcedimentoPrazo => ({
  nome,
  quantidade: n,
  unidade: "meses",
  contagem: "corridos",
  obs,
});
const anos = (nome: string, n: number, obs: string): ProcedimentoPrazo => ({
  nome,
  quantidade: n,
  unidade: "anos",
  contagem: "corridos",
  obs,
});

const PETICAO_INICIAL = manual(
  "Petição Inicial",
  "Sem prazo processual de contagem: o limite é regido pela prescrição e pela decadência do direito material. Defina uma data de referência manual, se desejar.",
);

/** Direito Civil / Processo Civil — contagem em dias úteis (art. 219, CPC). */
const CIVEL: ProcedimentoPrazo[] = [
  PETICAO_INICIAL,
  uteis("Contestação", 15, "Art. 335, CPC — contados da audiência de conciliação ou da juntada do mandado/AR."),
  uteis("Réplica / Impugnação à Contestação", 15, "Arts. 350 e 351, CPC."),
  uteis("Embargos à Execução", 15, "Art. 915, CPC — contados da juntada da citação."),
  uteis("Apelação", 15, "Art. 1.003, § 5º, CPC."),
  uteis("Contrarrazões de Apelação", 15, "Art. 1.010, § 1º, CPC — o prazo acompanha o do recurso."),
  uteis("Agravo de Instrumento", 15, "Art. 1.003, § 5º, CPC."),
  uteis("Agravo Interno", 15, "Art. 1.021, CPC."),
  uteis("Embargos de Declaração (EDcl)", 5, "Art. 1.023, CPC."),
  uteis("Memoriais / Alegações Finais", 15, "Art. 364, § 2º, CPC — quando substituem os debates orais em audiência."),
  anos("Ação Rescisória", 2, "Art. 975, CPC — prazo decadencial de 2 anos do trânsito em julgado."),
  uteis("Outra Manifestação (prazo supletivo)", 5, "Prazo definido pelo juiz no despacho; na omissão, aplica-se o prazo supletivo de 5 dias úteis (art. 218, § 3º, CPC)."),
];

/** Direito Penal — contagem em dias corridos (art. 798, CPP), com prorrogação. */
const PENAL: ProcedimentoPrazo[] = [
  PETICAO_INICIAL,
  corridos("Resposta à Acusação", 10, "Art. 396, CPP."),
  corridos("Alegações Finais (Memoriais)", 5, "Art. 403, § 3º, CPP."),
  corridos("Apelação (interposição)", 5, "Art. 593, CPP."),
  corridos("Recurso em Sentido Estrito (RESE)", 5, "Art. 586, CPP."),
  corridos("Razões de Apelação", 8, "Art. 600, CPP — após a interposição."),
  corridos("Contrarrazões de Apelação", 8, "Art. 600, CPP."),
  corridos("Embargos de Declaração (EDcl)", 2, "Art. 619, CPP — 2 dias na Justiça Comum (5 dias nos Juizados, art. 83, Lei 9.099/95)."),
  meses("Queixa-Crime (decadência)", 6, "Art. 38, CPP — prazo decadencial de 6 meses do conhecimento da autoria."),
];

/** Direito do Trabalho — contagem em dias úteis (art. 775, CLT). */
const TRABALHISTA: ProcedimentoPrazo[] = [
  PETICAO_INICIAL,
  manual(
    "Contestação",
    "Apresentada até a audiência (art. 847, CLT) — ou em 15 dias úteis no Juízo 100% Digital. Defina a data da audiência como referência manual.",
  ),
  uteis("Recurso Ordinário", 8, "Art. 895, CLT."),
  uteis("Recurso de Revista", 8, "Art. 896, CLT."),
  uteis("Agravo de Instrumento / Agravo de Petição", 8, "Arts. 897, CLT."),
  uteis("Embargos ao TST", 8, "Art. 894, CLT."),
  uteis("Contrarrazões de Recurso", 8, "O prazo acompanha o do recurso interposto."),
  uteis("Embargos de Declaração (EDcl)", 5, "Art. 897-A, CLT."),
];

/** Direito Tributário — administrativo em dias corridos; judicial segue o CPC. */
const TRIBUTARIA: ProcedimentoPrazo[] = [
  PETICAO_INICIAL,
  corridos("Impugnação Administrativa (DRJ)", 30, "Art. 15, Decreto 70.235/72 — esfera administrativa: dias corridos."),
  corridos("Recurso Voluntário ao CARF", 30, "Art. 33, Decreto 70.235/72 — esfera administrativa: dias corridos."),
  uteis("Embargos à Execução Fiscal", 30, "Art. 16, LEF (Lei 6.830/80) — contagem em dias úteis na via judicial."),
  uteis("Contestação (Anulatória/Ordinária)", 15, "Art. 335, CPC — aplicação subsidiária."),
  uteis("Apelação", 15, "Art. 1.003, § 5º, CPC."),
  uteis("Agravo de Instrumento", 15, "Art. 1.003, § 5º, CPC."),
  uteis("Embargos de Declaração (EDcl)", 5, "Art. 1.023, CPC."),
];

/** Direito Previdenciário — administrativo em dias corridos; judicial segue o CPC. */
const PREVIDENCIARIA: ProcedimentoPrazo[] = [
  PETICAO_INICIAL,
  corridos("Recurso ao CRPS (administrativo)", 30, "Art. 305, Decreto 3.048/99 — esfera administrativa: dias corridos."),
  corridos("Contrarrazões Administrativas", 30, "Esfera administrativa: dias corridos."),
  uteis("Contestação (judicial)", 15, "Art. 335, CPC — rito comum."),
  uteis("Apelação", 15, "Art. 1.003, § 5º, CPC."),
  uteis("Embargos de Declaração (EDcl)", 5, "Art. 1.023, CPC."),
];

/** Juizados Especiais (Cível, Federal e Fazenda Pública) — dias úteis (Enunciado 165, FONAJE). */
const JUIZADOS: ProcedimentoPrazo[] = [
  PETICAO_INICIAL,
  uteis("Recurso Inominado", 10, "Art. 42, Lei 9.099/95."),
  uteis("Contrarrazões ao Recurso Inominado", 10, "Art. 42, § 2º, Lei 9.099/95."),
  uteis("Embargos de Declaração (EDcl)", 5, "Art. 49, Lei 9.099/95."),
];

/** Empresarial tramita pelo rito comum — mesmas regras do processo civil. */
const CATALOGO: Record<AreaProcesso, ProcedimentoPrazo[]> = {
  "Cível": CIVEL,
  "Penal": PENAL,
  "Trabalhista": TRABALHISTA,
  "Tributária": TRIBUTARIA,
  "Previdenciária": PREVIDENCIARIA,
  "Juizados Especiais": JUIZADOS,
  "Empresarial": CIVEL,
  "Outra": [PETICAO_INICIAL],
};

/** Procedimentos/recursos disponíveis para o ramo (popula o 2º select). */
export function procedimentosDe(area: AreaProcesso): ProcedimentoPrazo[] {
  return CATALOGO[area] ?? [];
}

/** Localiza um procedimento do catálogo pelo nome (undefined = inserção manual). */
export function buscarProcedimento(area: AreaProcesso, nome: string): ProcedimentoPrazo | undefined {
  return procedimentosDe(area).find((p) => p.nome === nome);
}

/** Regra efetiva de um procedimento (catálogo ou informado manualmente). */
export interface RegraContagem {
  quantidade: number | null;
  unidade: UnidadePrazo;
  contagem: Contagem;
}

/** Descrição curta da regra, ex.: "15 dias úteis", "6 meses" ou "referência manual". */
export function descreverRegra(r: RegraContagem): string {
  if (r.quantidade === null) return "referência manual";
  const plural = r.quantidade > 1;
  if (r.unidade === "meses") return `${r.quantidade} ${plural ? "meses" : "mês"}`;
  if (r.unidade === "anos") return `${r.quantidade} ano${plural ? "s" : ""}`;
  return `${r.quantidade} dia${plural ? "s" : ""} ${r.contagem === "uteis" ? "úteis" : "corridos"}`;
}

/**
 * Vencimento sugerido a partir do termo inicial (null = referência manual).
 * Dias úteis excluem fins de semana, feriados do calendário e os extras;
 * dias corridos e meses/anos prorrogam o vencimento para o dia útil seguinte.
 */
export function calcularVencimento(
  termoInicialISO: string,
  r: RegraContagem,
  feriadosExtras: readonly string[] = [],
): string | null {
  if (!termoInicialISO || r.quantidade === null || r.quantidade <= 0) return null;
  if (r.unidade === "meses") return somarMeses(termoInicialISO, r.quantidade, feriadosExtras);
  if (r.unidade === "anos") return somarMeses(termoInicialISO, r.quantidade * 12, feriadosExtras);
  return r.contagem === "uteis"
    ? somarDiasUteis(termoInicialISO, r.quantidade, feriadosExtras)
    : somarDiasCorridos(termoInicialISO, r.quantidade, feriadosExtras);
}
