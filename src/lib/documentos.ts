/* ============================================================
   Gerador de documentos jurídicos. No back-end futuro, um endpoint
   receberá { clienteId, tipo } e devolverá o buffer do PDF
   (pdfmake/puppeteer). No mock, os dados do cliente são injetados
   em um template HTML aberto em nova janela para "Salvar como PDF"
   — o mesmo padrão do exportPdf do dashboard.
   ============================================================ */

import type { Cliente, TransacaoFinanceira, Usuario } from "@/data/seed";
import { formatarData, formatarDataLonga, moeda } from "./format";

export type TipoDocumento = "procuracao" | "contrato_honorarios";

export const DOCUMENTO_LABEL: Record<TipoDocumento, string> = {
  procuracao: "Procuração ad judicia",
  contrato_honorarios: "Contrato de honorários",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ESTILO_DOC = `
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1f2937; margin: 48px 56px; font-size: 13px; line-height: 1.75; }
  h1 { font-size: 17px; text-align: center; text-transform: uppercase; letter-spacing: .08em; color: #16213e; margin: 0 0 32px; }
  p { text-align: justify; margin: 0 0 14px; }
  .partes { margin: 0 0 18px; }
  .assinatura { margin-top: 72px; text-align: center; }
  .linha { display: inline-block; width: 320px; border-top: 1px solid #1f2937; padding-top: 6px; }
  .data { margin-top: 48px; text-align: right; }
  footer { margin-top: 56px; color: #94a3b8; font-size: 10px; text-align: center; font-family: "Inter", system-ui, sans-serif; }
  @media print { body { margin: 20mm 18mm; } }
`;

function qualificacao(c: Cliente): string {
  const docTipo = c.tipo === "PJ" ? "CNPJ" : "CPF";
  const civil = c.tipo === "PF" && c.estadoCivil ? `, ${c.estadoCivil.toLowerCase()}` : "";
  return `<strong>${esc(c.nome)}</strong>${civil}, inscrito(a) no ${docTipo} sob o nº ${esc(
    c.doc,
  )}, com domicílio em ${esc(c.endereco)}`;
}

function qualificacaoAdvogada(u: Usuario): string {
  return `<strong>${esc(u.nome)}</strong>, advogada inscrita na ${esc(u.oab)}, com escritório profissional ${
    u.escritorio ? `(${esc(u.escritorio)}) ` : ""
  }na cidade de São Paulo - ${esc(u.uf)}`;
}

function corpoProcuracao(c: Cliente, u: Usuario): string {
  return `
  <h1>Procuração Ad Judicia Et Extra</h1>
  <p class="partes"><strong>OUTORGANTE:</strong> ${qualificacao(c)}.</p>
  <p class="partes"><strong>OUTORGADA:</strong> ${qualificacaoAdvogada(u)}.</p>
  <p><strong>PODERES:</strong> Pelo presente instrumento particular de mandato, o(a) outorgante nomeia e
  constitui sua bastante procuradora a outorgada, conferindo-lhe os poderes da cláusula <em>ad judicia et extra</em>
  (arts. 104 e 105 do CPC), para o foro em geral, podendo propor as ações competentes e defendê-lo(a) nas
  contrárias, em qualquer juízo, instância ou tribunal, bem como os poderes especiais para receber citação,
  confessar, reconhecer a procedência do pedido, transigir, desistir, renunciar ao direito sobre o qual se
  funda a ação, receber, dar quitação, firmar compromisso e assinar declaração de hipossuficiência econômica,
  podendo ainda substabelecer, com ou sem reserva de poderes.</p>`;
}

function corpoContrato(c: Cliente, u: Usuario): string {
  return `
  <h1>Contrato de Prestação de Serviços Advocatícios e Honorários</h1>
  <p class="partes"><strong>CONTRATANTE:</strong> ${qualificacao(c)}.</p>
  <p class="partes"><strong>CONTRATADA:</strong> ${qualificacaoAdvogada(u)}.</p>
  <p><strong>CLÁUSULA 1ª — DO OBJETO.</strong> A contratada prestará ao contratante serviços de assessoria e
  representação jurídica, judicial e extrajudicial, na causa ou matéria indicada em instrumento anexo,
  empregando a diligência e a técnica exigidas pelo Estatuto da Advocacia (Lei nº 8.906/94).</p>
  <p><strong>CLÁUSULA 2ª — DOS HONORÁRIOS CONTRATUAIS.</strong> Pelos serviços ora contratados, o contratante
  pagará honorários na forma e nos valores ajustados entre as partes, mediante recibo, sem prejuízo dos
  honorários de sucumbência, que pertencem exclusivamente à contratada (art. 23 da Lei nº 8.906/94).</p>
  <p><strong>CLÁUSULA 3ª — DAS DESPESAS.</strong> Custas processuais, taxas, emolumentos e despesas com
  diligências correrão por conta do contratante, mediante prestação de contas.</p>
  <p><strong>CLÁUSULA 4ª — DA VIGÊNCIA E RESCISÃO.</strong> O contrato vigora até o trânsito em julgado ou a
  solução definitiva da matéria. Em caso de revogação do mandato, serão devidos os honorários proporcionais
  ao trabalho realizado.</p>
  <p><strong>CLÁUSULA 5ª — DO FORO.</strong> Fica eleito o foro da comarca de São Paulo - SP para dirimir
  quaisquer controvérsias oriundas deste contrato.</p>`;
}

/** Monta o documento com os dados do cliente e abre a janela de impressão. */
export function gerarDocumentoPdf(tipo: TipoDocumento, cliente: Cliente, usuario: Usuario): boolean {
  const corpo = tipo === "procuracao" ? corpoProcuracao(cliente, usuario) : corpoContrato(cliente, usuario);
  const hoje = new Date();
  const dataLonga = hoje.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>${DOCUMENTO_LABEL[tipo]} — ${esc(cliente.nome)}</title>
<style>${ESTILO_DOC}</style>
</head>
<body>
  ${corpo}
  <p class="data">São Paulo, ${dataLonga}.</p>
  <div class="assinatura"><span class="linha">${esc(cliente.nome)}</span></div>
  <div class="assinatura"><span class="linha">${esc(usuario.nome)} — ${esc(usuario.oab)}</span></div>
  <footer>Documento gerado pelo JurisControle a partir do cadastro do cliente.</footer>
  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 250));</script>
</body>
</html>`;
  const win = window.open("", "_blank", "width=900,height=720");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
}

/* ------------------- Cobranças do Portal do Cliente ------------------- */

/** Código PIX "copia e cola" fictício no formato EMV, derivado da transação. */
export function gerarPixCopiaECola(t: TransacaoFinanceira): string {
  const valor = t.valor.toFixed(2);
  const txid = `JC${t.id.toUpperCase().padEnd(10, "0")}`;
  return (
    `00020126580014br.gov.bcb.pix0136financeiro@carvalhoadvogados.com.br520400005303986` +
    `54${String(valor.length).padStart(2, "0")}${valor}5802BR5925CARVALHO ASSOCIADOS ADV6009SAO PAULO62${String(
      (`05${String(txid.length).padStart(2, "0")}${txid}`).length,
    ).padStart(2, "0")}05${String(txid.length).padStart(2, "0")}${txid}6304ABCD`
  );
}

/** Boleto fictício imprimível (no back-end real, viria do banco emissor). */
export function baixarBoletoPdf(t: TransacaoFinanceira, cliente: Cliente): boolean {
  const linha = `23790.12345 61234.567890 12345.678901 2 ${t.dataVencimento.replace(/-/g, "")}${Math.round(
    t.valor * 100,
  )
    .toString()
    .padStart(10, "0")}`;
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>Boleto — ${esc(t.descricao)}</title>
<style>
  body { font-family: "Inter", system-ui, sans-serif; color: #1f2937; margin: 40px; font-size: 12px; }
  .boleto { border: 1px solid #94a3b8; border-radius: 8px; padding: 20px 24px; max-width: 720px; }
  h1 { font-size: 15px; color: #16213e; margin: 0 0 2px; }
  .linha-dig { font-family: "JetBrains Mono", monospace; font-size: 13px; font-weight: 700; margin: 14px 0; letter-spacing: .02em; }
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; border-top: 1px dashed #cbd5e1; padding-top: 14px; margin-top: 8px; }
  .campo b { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: .05em; }
  .aviso { margin-top: 18px; color: #94a3b8; font-size: 10px; }
  @media print { body { margin: 12mm; } }
</style>
</head>
<body>
  <div class="boleto">
    <h1>Carvalho &amp; Associados Advocacia</h1>
    <div>Beneficiário: Carvalho &amp; Associados — CNPJ 00.000.000/0001-00</div>
    <div class="linha-dig">${linha}</div>
    <div class="grid">
      <div class="campo"><b>Pagador</b>${esc(cliente.nome)}<br/>${esc(cliente.doc)}</div>
      <div class="campo"><b>Descrição</b>${esc(t.descricao)}</div>
      <div class="campo"><b>Vencimento</b>${formatarData(t.dataVencimento)}</div>
      <div class="campo"><b>Valor do documento</b>${moeda(t.valor)}</div>
      <div class="campo"><b>Nosso número</b>JC-${esc(t.id.toUpperCase())}</div>
      <div class="campo"><b>Emissão</b>${formatarDataLonga(t.dataVencimento)}</div>
    </div>
    <p class="aviso">Boleto demonstrativo gerado pelo JurisControle (ambiente de testes — sem valor de cobrança).</p>
  </div>
  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 250));</script>
</body>
</html>`;
  const win = window.open("", "_blank", "width=900,height=600");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
}
