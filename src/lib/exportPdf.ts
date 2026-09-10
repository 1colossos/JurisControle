/* ============================================================
   Exportação em PDF do dashboard geral de processos.
   Gera um documento imprimível em nova janela e aciona o diálogo
   de impressão do navegador ("Salvar como PDF").
   ============================================================ */

import type { ProcessoView } from "@/store/AppContext";
import type { Usuario } from "@/data/seed";
import { formatarData, diasUteisLabel, moeda } from "./format";

const URGENCIA_LABEL: Record<string, { label: string; cor: string }> = {
  critico: { label: "Crítico", cor: "#e0413a" },
  alto: { label: "Alto", cor: "#d3982a" },
  medio: { label: "Médio", cor: "#3b5bdb" },
  baixo: { label: "Baixo", cor: "#1f9d57" },
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function exportarDashboardPdf(processos: ProcessoView[], usuario: Usuario): boolean {
  const ativos = processos.filter((p) => p.status === "Em andamento");
  const kpis = [
    { label: "Processos ativos", valor: ativos.length },
    { label: "Prazos críticos (≤ 3 dias úteis)", valor: processos.filter((p) => p.urgencia === "critico").length },
    { label: "Prazos próximos (≤ 7 dias úteis)", valor: processos.filter((p) => p.urgencia === "alto").length },
    { label: "Total monitorado", valor: processos.length },
  ];

  const linhas = processos
    .map(
      (p) => `
      <tr>
        <td class="mono">${esc(p.numero)}</td>
        <td>${esc(p.cliente?.nome ?? "—")}</td>
        <td>${esc(p.area)} · ${esc(p.tipo)}</td>
        <td>${esc(p.vara || "—")}</td>
        <td>${formatarData(p.prazo)}<br/><small>${esc(diasUteisLabel(p.diasUteis))}</small></td>
        <td>${moeda(p.valor)}</td>
        <td><span class="badge" style="color:${URGENCIA_LABEL[p.urgencia].cor}">● ${URGENCIA_LABEL[p.urgencia].label}</span></td>
        <td>${esc(p.status)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>JurisControle — Dashboard de Processos</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Inter", system-ui, sans-serif; color: #1f2937; margin: 32px; font-size: 12px; }
  h1 { font-size: 20px; margin: 0; color: #16213e; }
  .sub { color: #64748b; margin-top: 4px; }
  .kpis { display: flex; gap: 12px; margin: 20px 0; }
  .kpi { flex: 1; border: 1px solid #e6e9f1; border-radius: 10px; padding: 12px; }
  .kpi .n { font-size: 22px; font-weight: 700; color: #16213e; }
  .kpi .l { color: #64748b; font-size: 11px; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #64748b; border-bottom: 2px solid #e6e9f1; padding: 8px 6px; }
  td { border-bottom: 1px solid #eef1f6; padding: 8px 6px; vertical-align: top; }
  .mono { font-family: "JetBrains Mono", monospace; font-size: 10px; }
  .badge { font-weight: 600; font-size: 11px; white-space: nowrap; }
  small { color: #94a3b8; }
  footer { margin-top: 24px; color: #94a3b8; font-size: 10px; }
  @media print { body { margin: 12mm; } }
</style>
</head>
<body>
  <h1>JurisControle — Dashboard de Processos</h1>
  <div class="sub">Emitido para ${esc(usuario.nome)} (${esc(usuario.oab)}) em ${new Date().toLocaleDateString("pt-BR")}</div>

  <div class="kpis">
    ${kpis.map((k) => `<div class="kpi"><div class="n">${k.valor}</div><div class="l">${esc(k.label)}</div></div>`).join("")}
  </div>

  <table>
    <thead>
      <tr>
        <th>Processo</th><th>Cliente</th><th>Área · Tipo</th><th>Vara</th>
        <th>Prazo</th><th>Valor</th><th>Urgência</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${linhas}</tbody>
  </table>

  <footer>Documento gerado pelo JurisControle — controle de prazos processuais em dias úteis.</footer>
  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 250));</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=1024,height=768");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
}
