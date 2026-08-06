/* ============================================================
   Motor de contagem de prazos em DIAS ÚTEIS — o coração do
   JurisControle. Considera fins de semana, feriados nacionais e
   feriados/suspensões regionais (MA / São Luís / Itapecuru-Mirim).
   Implementação determinística (sem libs externas) e testável.
   ============================================================ */

/** Feriados nacionais fixos (MM-DD). */
const FERIADOS_NACIONAIS_FIXOS = [
  "01-01", // Confraternização Universal
  "04-21", // Tiradentes
  "05-01", // Dia do Trabalho
  "09-07", // Independência
  "10-12", // Nossa Senhora Aparecida
  "11-02", // Finados
  "11-15", // Proclamação da República
  "11-20", // Consciência Negra (nacional desde 2024)
  "12-25", // Natal
];

/** Feriados estaduais/municipais relevantes ao foro do projeto (MA). */
const FERIADOS_REGIONAIS_FIXOS = [
  "07-28", // Adesão do Maranhão à Independência
  "12-08", // Nossa Senhora da Conceição (padroeira de São Luís)
];

/** Suspensões de expediente forense cadastradas manualmente (AAAA-MM-DD). */
const SUSPENSOES = new Set<string>(["2026-06-12"]);

/** Calcula a Páscoa (algoritmo de Meeus/Butcher) para feriados móveis. */
function pascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function key(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

/** Conjunto de feriados móveis (Carnaval, Sexta-feira Santa, Corpus Christi). */
function feriadosMoveis(ano: number): Set<string> {
  const p = pascoa(ano);
  const set = new Set<string>();
  set.add(key(addDays(p, -48))); // Carnaval (segunda)
  set.add(key(addDays(p, -47))); // Carnaval (terça)
  set.add(key(addDays(p, -2))); // Sexta-feira Santa
  set.add(key(addDays(p, 60))); // Corpus Christi
  return set;
}

const isoKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

/** True se a data é dia útil forense (não é fim de semana, feriado ou suspensão). */
export function ehDiaUtil(d: Date): boolean {
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false; // domingo/sábado
  if (SUSPENSOES.has(isoKey(d))) return false;
  const mmdd = key(d);
  if (FERIADOS_NACIONAIS_FIXOS.includes(mmdd)) return false;
  if (FERIADOS_REGIONAIS_FIXOS.includes(mmdd)) return false;
  if (feriadosMoveis(d.getFullYear()).has(mmdd)) return false;
  return true;
}

/** Motivo pelo qual um dia não é útil (para o calendário). */
export function tipoDeDia(d: Date): "util" | "fim-de-semana" | "feriado" | "suspensao" {
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return "fim-de-semana";
  if (SUSPENSOES.has(isoKey(d))) return "suspensao";
  const mmdd = key(d);
  if (
    FERIADOS_NACIONAIS_FIXOS.includes(mmdd) ||
    FERIADOS_REGIONAIS_FIXOS.includes(mmdd) ||
    feriadosMoveis(d.getFullYear()).has(mmdd)
  )
    return "feriado";
  return "util";
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Conta dias úteis entre hoje (ref) e a data-alvo. Resultado pode ser
 * negativo (prazo vencido). Não conta o dia inicial; conta o dia final.
 */
export function diasUteisAte(alvoISO: string, refISO?: string): number {
  const hoje = refISO ? parseISO(refISO) : new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = parseISO(alvoISO);
  alvo.setHours(0, 0, 0, 0);

  if (alvo.getTime() === hoje.getTime()) return 0;
  const sentido = alvo > hoje ? 1 : -1;
  let cursor = new Date(hoje);
  let count = 0;
  while (cursor.getTime() !== alvo.getTime()) {
    cursor = addDays(cursor, sentido);
    if (ehDiaUtil(cursor)) count += sentido;
  }
  return count;
}

export type Urgencia = "critico" | "alto" | "medio" | "baixo";

/** Classifica a urgência cromática a partir dos dias úteis restantes. */
export function classificarUrgencia(diasUteis: number): Urgencia {
  if (diasUteis <= 3) return "critico";
  if (diasUteis <= 7) return "alto";
  if (diasUteis <= 15) return "medio";
  return "baixo";
}

/** Soma N dias úteis a uma data inicial (ex.: termo inicial + prazo legal). */
export function somarDiasUteis(inicioISO: string, dias: number): string {
  let cursor = parseISO(inicioISO);
  let restantes = dias;
  while (restantes > 0) {
    cursor = addDays(cursor, 1);
    if (ehDiaUtil(cursor)) restantes--;
  }
  return isoKey(cursor);
}
