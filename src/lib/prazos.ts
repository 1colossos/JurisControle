/* ============================================================
   Regras de contagem de prazos por ÁREA e TIPO de procedimento.
   Toda regra é apenas SUGESTÃO de cálculo: o usuário sempre pode
   definir a data de referência manualmente no cadastro.
   ============================================================ */

import { somarDiasUteis, somarDiasCorridos } from "./businessDays";

export const AREAS = [
  "Cível",
  "Trabalhista",
  "Penal",
  "Tributária",
  "Empresarial",
  "Previdenciária",
  "Outra",
] as const;

export type AreaProcesso = (typeof AREAS)[number];

export type Contagem = "uteis" | "corridos";

export interface RegraPrazo {
  /** Dias do prazo legal; null = sem contagem automática (referência manual). */
  dias: number | null;
  contagem: Contagem;
  obs: string;
}

const MANUAL = (obs: string): RegraPrazo => ({ dias: null, contagem: "uteis", obs });
const UTEIS = (dias: number, obs: string): RegraPrazo => ({ dias, contagem: "uteis", obs });
const CORRIDOS = (dias: number, obs: string): RegraPrazo => ({ dias, contagem: "corridos", obs });

/** Ramos com regra própria; as demais áreas seguem o processo civil. */
type Ramo = "Cível" | "Trabalhista" | "Penal";

function ramoDe(area: AreaProcesso): Ramo {
  if (area === "Trabalhista" || area === "Penal") return area;
  return "Cível";
}

const REGRAS: Record<string, Partial<Record<Ramo, RegraPrazo>>> = {
  "Petição Inicial": {
    Cível: MANUAL(
      "Sem prazo processual de contagem: o limite é regido pela prescrição e decadência do direito material. Defina uma data de referência manual, se desejar.",
    ),
    Trabalhista: MANUAL(
      "Sem prazo processual de contagem: observe a prescrição trabalhista (bienal/quinquenal). Defina uma data de referência manual, se desejar.",
    ),
    Penal: MANUAL(
      "Sem prazo processual de contagem: observe as regras de prescrição e decadência penais. Defina uma data de referência manual, se desejar.",
    ),
  },
  "Contestação/Defesa": {
    Cível: UTEIS(15, "Contestação cível: 15 dias úteis (CPC)."),
    Trabalhista: MANUAL(
      "Apresentada até o momento da audiência (ou 15 dias úteis se o processo tramitar no Juízo 100% Digital). Defina a data manualmente.",
    ),
    Penal: CORRIDOS(10, "Resposta à acusação: 10 dias corridos (CPP)."),
  },
  Contrarrazões: {
    Cível: UTEIS(15, "O prazo acompanha o do recurso interposto. Cível (ex.: Apelação): 15 dias úteis."),
    Trabalhista: UTEIS(8, "O prazo acompanha o do recurso interposto. Trabalhista (ex.: Recurso Ordinário): 8 dias úteis."),
    Penal: MANUAL("O prazo acompanha o do recurso interposto — defina manualmente conforme o recurso."),
  },
  "Réplica/Impugnação": {
    Cível: UTEIS(15, "Réplica/impugnação à contestação: 15 dias úteis (CPC)."),
    Trabalhista: MANUAL("Prazo fixado pelo juízo — defina a data manualmente."),
    Penal: MANUAL("Prazo fixado pelo juízo — defina a data manualmente."),
  },
  "Memoriais/Alegações Finais": {
    Cível: UTEIS(15, "Memoriais cíveis: 15 dias úteis (quando substituem os debates orais em audiência)."),
    Trabalhista: MANUAL("Razões finais, em regra, em audiência — defina a data manualmente se convertidas em memoriais."),
    Penal: CORRIDOS(5, "Alegações finais penais: 5 dias corridos."),
  },
  Recursos: {
    Cível: UTEIS(15, "Regra geral cível (Apelação, Agravo etc.): 15 dias úteis."),
    Trabalhista: UTEIS(8, "Regra unificada trabalhista: 8 dias úteis."),
    Penal: MANUAL("Varia conforme o recurso (ex.: Apelação penal, 5 dias corridos) — defina manualmente."),
  },
  Embargos: {
    Cível: UTEIS(5, "Embargos de declaração: 5 dias úteis."),
    Trabalhista: UTEIS(5, "Embargos de declaração: 5 dias úteis."),
    Penal: CORRIDOS(2, "Embargos de declaração penais: 2 dias corridos (Justiça Comum) ou 5 dias corridos (Juizados Especiais)."),
  },
  Apelação: {
    Cível: UTEIS(15, "Apelação cível: 15 dias úteis."),
    Trabalhista: UTEIS(8, "Recurso Ordinário trabalhista: 8 dias úteis."),
    Penal: CORRIDOS(5, "Apelação penal: 5 dias corridos para interpor + 8 dias corridos para apresentar as razões."),
  },
  "Agravo de Instrumento": {
    Cível: UTEIS(15, "Agravo de Instrumento cível: 15 dias úteis."),
    Trabalhista: UTEIS(8, "Agravo trabalhista: 8 dias úteis."),
    Penal: MANUAL("Sem correspondente direto no processo penal — defina a data manualmente."),
  },
  "Outro/Manifestação": {
    Cível: UTEIS(5, "Prazo definido pelo juiz no despacho. Na omissão, aplica-se o prazo supletivo legal de 5 dias úteis (CPC)."),
    Trabalhista: MANUAL("Prazo definido pelo juiz no despacho — informe a data manualmente."),
    Penal: MANUAL("Prazo definido pelo juiz no despacho — informe a data manualmente."),
  },
};

/** Regra sugerida para o par tipo × área (fallback: referência manual). */
export function regraPrazo(tipo: string, area: AreaProcesso): RegraPrazo {
  const porTipo = REGRAS[tipo];
  const regra = porTipo?.[ramoDe(area)];
  return regra ?? MANUAL("Sem regra automática para este tipo — defina a data manualmente.");
}

/** Descrição curta da regra, ex.: "15 dias úteis" ou "referência manual". */
export function descreveRegra(r: RegraPrazo): string {
  if (r.dias === null) return "referência manual";
  return `${r.dias} dia${r.dias > 1 ? "s" : ""} ${r.contagem === "uteis" ? "úteis" : "corridos"}`;
}

/** Calcula o prazo final sugerido a partir do termo inicial (null se manual). */
export function calcularPrazoSugerido(termoInicialISO: string, r: RegraPrazo): string | null {
  if (!termoInicialISO || r.dias === null) return null;
  return r.contagem === "uteis"
    ? somarDiasUteis(termoInicialISO, r.dias)
    : somarDiasCorridos(termoInicialISO, r.dias);
}
