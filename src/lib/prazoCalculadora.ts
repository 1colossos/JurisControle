/* ============================================================
   Calculadora de prazos processuais (Novo CPC, art. 219): conta
   apenas dias úteis, exclui o dia do começo e inclui o do
   vencimento. Complementa o motor businessDays aceitando uma
   lista extra de feriados informada pelo usuário (AAAA-MM-DD).
   ============================================================ */

import { ehDiaUtil } from "./businessDays";

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const toISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

export interface ResultadoPrazo {
  dataFinal: string; // AAAA-MM-DD
  diasUteisRestantes: number; // contados a partir da referência
  urgente: boolean; // vence em menos de 3 dias úteis → vermelho
}

export class CalculadoraPrazos {
  /** @param feriados datas extras (AAAA-MM-DD) ignoradas na contagem. */
  constructor(private readonly feriados: string[] = []) {}

  /** Dia útil = não é sábado/domingo, feriado do calendário nem feriado extra. */
  ehDiaUtil(d: Date): boolean {
    return ehDiaUtil(d) && !this.feriados.includes(toISO(d));
  }

  /**
   * Data final do prazo: pula o dia da intimação (exclui o dia do começo)
   * e conta `diasUteis` dias úteis, sendo o último o vencimento.
   */
  calcularPrazoFinal(dataInicialISO: string, diasUteis: number): string {
    let cursor = parseISO(dataInicialISO);
    let restantes = Math.max(0, Math.trunc(diasUteis));
    while (restantes > 0) {
      cursor.setDate(cursor.getDate() + 1);
      if (this.ehDiaUtil(cursor)) restantes--;
    }
    return toISO(cursor);
  }

  /** Dias úteis entre a referência (exclusiva) e o prazo (inclusivo); negativo se vencido. */
  diasUteisRestantes(prazoISO: string, referenciaISO: string): number {
    const ref = parseISO(referenciaISO);
    const prazo = parseISO(prazoISO);
    if (ref.getTime() === prazo.getTime()) return 0;
    const sentido = prazo > ref ? 1 : -1;
    let cursor = new Date(ref);
    let count = 0;
    while (cursor.getTime() !== prazo.getTime()) {
      cursor.setDate(cursor.getDate() + sentido);
      if (this.ehDiaUtil(cursor)) count += sentido;
    }
    return count;
  }

  /** Resultado completo para a UI (cards ficam vermelhos quando urgente). */
  calcular(dataInicialISO: string, diasUteis: number, referenciaISO: string): ResultadoPrazo {
    const dataFinal = this.calcularPrazoFinal(dataInicialISO, diasUteis);
    const restantes = this.diasUteisRestantes(dataFinal, referenciaISO);
    return { dataFinal, diasUteisRestantes: restantes, urgente: restantes < 3 };
  }
}
