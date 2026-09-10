/* ============================================================
   Validações e máscaras de entrada (pt-BR): CPF, CNPJ, e-mail,
   telefone com DDD, número CNJ, OAB, nomes e datas.
   ============================================================ */

export const somenteDigitos = (s: string): string => s.replace(/\D/g, "");

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

/* ------------------------- CPF / CNPJ ------------------------- */

export function validarCPF(cpf: string): boolean {
  const d = somenteDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (fim: number) => {
    let soma = 0;
    for (let i = 0; i < fim; i++) soma += Number(d[i]) * (fim + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

export function validarCNPJ(cnpj: string): boolean {
  const d = somenteDigitos(cnpj);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const dv = (base: string) => {
    const pesos = base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base.split("").reduce((acc, n, i) => acc + Number(n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = dv(d.slice(0, 12));
  const d2 = dv(d.slice(0, 12) + d1);
  return d1 === Number(d[12]) && d2 === Number(d[13]);
}

export function maskCPF(v: string): string {
  const d = somenteDigitos(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

export function maskCNPJ(v: string): string {
  const d = somenteDigitos(v).slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

/* ------------------------- E-mail / telefone ------------------------- */

export function validarEmail(email: string): boolean {
  if (email.length > 254) return false;
  return /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(
    email,
  );
}

/** Telefone com DDD: 10 dígitos (fixo) ou 11 (celular iniciando em 9). */
export function validarTelefone(tel: string): boolean {
  const d = somenteDigitos(tel);
  if (d.length !== 10 && d.length !== 11) return false;
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (d.length === 11 && d[2] !== "9") return false;
  return true;
}

export function maskTelefone(v: string): string {
  const d = somenteDigitos(v).slice(0, 11);
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

/* ------------------------- Número CNJ ------------------------- */

/** Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO (20 dígitos), ex.: 0007890-12.2024.8.26.0224 */
export function validarNumeroCNJ(numero: string): boolean {
  return /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/.test(numero.trim());
}

export function maskNumeroCNJ(v: string): string {
  const d = somenteDigitos(v).slice(0, 20);
  let out = d.slice(0, 7);
  if (d.length > 7) out += "-" + d.slice(7, 9);
  if (d.length > 9) out += "." + d.slice(9, 13);
  if (d.length > 13) out += "." + d.slice(13, 14);
  if (d.length > 14) out += "." + d.slice(14, 16);
  if (d.length > 16) out += "." + d.slice(16, 20);
  return out;
}

/* ------------------------- Nome / OAB / data ------------------------- */

/** Nome completo: ao menos duas palavras, apenas letras/acentos, 5–120 chars. */
export function validarNomeCompleto(nome: string): boolean {
  const n = nome.trim();
  if (n.length < 5 || n.length > 120) return false;
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/.test(n)) return false;
  return n.split(/\s+/).length >= 2;
}

/** Nome ou razão social: 3–120 chars, letras/números e pontuação usual. */
export function validarNomeRazao(nome: string): boolean {
  const n = nome.trim();
  return n.length >= 3 && n.length <= 120 && /^[A-Za-zÀ-ÖØ-öø-ÿ0-9'&,. -]+$/.test(n);
}

/** Número da OAB: 3 a 6 dígitos. */
export function validarOAB(oab: string): boolean {
  const d = somenteDigitos(oab);
  return d.length >= 3 && d.length <= 6;
}

/** Idade mínima a partir da data de nascimento (AAAA-MM-DD). */
export function idadeMinima(nascISO: string, minimo = 18, refISO?: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascISO)) return false;
  const [y, m, d] = nascISO.split("-").map(Number);
  const ref = refISO ? new Date(refISO + "T00:00:00") : new Date();
  let idade = ref.getFullYear() - y;
  if (ref.getMonth() + 1 < m || (ref.getMonth() + 1 === m && ref.getDate() < d)) idade--;
  return idade >= minimo && idade <= 120;
}

/** Senha padrão de cadastro: mínimo 8 chars, ao menos letra e número. */
export function validarSenha(senha: string): boolean {
  return senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha);
}
