/* ============================================================
   Régua de cobrança automatizada (versão front-end do job diário).
   No back-end futuro, este serviço rodará via node-cron todos os
   dias às 08:00 ("0 8 * * *") — ver docs/backend-financeiro.md.
   Aqui a seleção é a mesma: receitas pendentes que vencem em 3
   dias e as que venceram ontem; o envio é mockado.
   ============================================================ */

import type { Cliente, TransacaoFinanceira } from "@/data/seed";
import { addDiasISO } from "./financeiro";
import { formatarData, moeda } from "./format";

export type MotivoCobranca = "vence_em_3_dias" | "venceu_ontem";

export interface AlertaCobranca {
  transacao: TransacaoFinanceira;
  cliente?: Cliente;
  motivo: MotivoCobranca;
  mensagem: string;
}

export interface RegistroEnvio {
  canal: "email" | "whatsapp";
  destino: string;
  mensagem: string;
  enviadoEm: string;
}

/** Mock do envio de e-mail (produção: SMTP/SendGrid). */
export function enviarEmail(destino: string, assunto: string, corpo: string): RegistroEnvio {
  console.info(`[cobrança] e-mail → ${destino} | ${assunto}\n${corpo}`);
  return { canal: "email", destino, mensagem: corpo, enviadoEm: new Date().toISOString() };
}

/** Mock do envio de WhatsApp (produção: Z-API/Twilio). */
export function enviarWhatsApp(telefone: string, corpo: string): RegistroEnvio {
  console.info(`[cobrança] whatsapp → ${telefone}\n${corpo}`);
  return { canal: "whatsapp", destino: telefone, mensagem: corpo, enviadoEm: new Date().toISOString() };
}

function montarMensagem(t: TransacaoFinanceira, cliente: Cliente | undefined, motivo: MotivoCobranca): string {
  const nome = cliente?.nome ?? "cliente";
  const valor = moeda(t.valor);
  const venc = formatarData(t.dataVencimento);
  if (motivo === "vence_em_3_dias") {
    return (
      `Olá, ${nome}! Tudo bem? Passando para lembrar que a cobrança "${t.descricao}" ` +
      `no valor de ${valor} vence em ${venc}. Qualquer dúvida, estamos à disposição. ` +
      `— Carvalho & Associados Advocacia`
    );
  }
  return (
    `Olá, ${nome}! Notamos que a cobrança "${t.descricao}" no valor de ${valor}, ` +
    `com vencimento em ${venc}, ainda consta em aberto. Se o pagamento já foi feito, ` +
    `desconsidere esta mensagem; caso contrário, podemos ajudar com uma nova via. ` +
    `— Carvalho & Associados Advocacia`
  );
}

/**
 * Seleciona as receitas pendentes que vencem em exatamente 3 dias e as
 * que venceram ontem — a mesma consulta do job diário das 08:00.
 */
export function buscarAlertasCobranca(
  transacoes: TransacaoFinanceira[],
  clientes: Cliente[],
  hojeISO: string,
): AlertaCobranca[] {
  const em3dias = addDiasISO(hojeISO, 3);
  const ontem = addDiasISO(hojeISO, -1);
  const alertas: AlertaCobranca[] = [];
  for (const t of transacoes) {
    if (t.tipo !== "receita" || t.status !== "pendente") continue;
    const motivo: MotivoCobranca | null =
      t.dataVencimento === em3dias
        ? "vence_em_3_dias"
        : t.dataVencimento === ontem
          ? "venceu_ontem"
          : null;
    if (!motivo) continue;
    const cliente = clientes.find((c) => c.id === t.clienteId);
    alertas.push({ transacao: t, cliente, motivo, mensagem: montarMensagem(t, cliente, motivo) });
  }
  return alertas;
}

/** Dispara (mock) e-mail + WhatsApp para cada alerta e retorna o log de envios. */
export function executarReguaCobranca(alertas: AlertaCobranca[]): RegistroEnvio[] {
  const envios: RegistroEnvio[] = [];
  for (const a of alertas) {
    const assunto =
      a.motivo === "vence_em_3_dias"
        ? "Lembrete de vencimento — JurisControle"
        : "Cobrança em aberto — JurisControle";
    if (a.cliente?.email) envios.push(enviarEmail(a.cliente.email, assunto, a.mensagem));
    if (a.cliente?.tel) envios.push(enviarWhatsApp(a.cliente.tel, a.mensagem));
  }
  return envios;
}
