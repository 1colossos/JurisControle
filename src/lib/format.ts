/** Formatações comuns em pt-BR. */

export function formatarData(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatarDataLonga(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const data = new Date(y, m - 1, d);
  return data.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function diasUteisLabel(dias: number): string {
  if (dias < 0) return `${Math.abs(dias)} dia${Math.abs(dias) === 1 ? "" : "s"} vencido`;
  if (dias === 0) return "vence hoje";
  return `${dias} dia${dias === 1 ? "" : "s"} útil${dias === 1 ? "" : "eis"}`;
}

export function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Títulos honoríficos ignorados nas iniciais (ex.: "Dr. Afonso Ferreira" → AF). */
const TITULOS = /^(dr|dra|sr|sra|srta|prof|profa)$/i;

export function iniciais(nome: string): string {
  const partes = nome
    .trim()
    .split(/\s+/)
    .map((p) => p.replace(/[^\p{L}]/gu, ""))
    .filter((p) => p.length > 2 && !TITULOS.test(p));
  if (partes.length === 0) return nome.slice(0, 2).toUpperCase();
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
