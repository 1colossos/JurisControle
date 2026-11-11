/* ============================================================
   Calculadora de prazos processuais. O prazo pode vir do catálogo
   de procedimentos por ramo do Direito (dias úteis, corridos ou
   meses/anos, conforme a regra legal) ou ser informado manualmente.
   Usa a mesma régua cromática dos cards de processo: menos de
   3 dias úteis = vermelho (crítico).
   ============================================================ */

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CalculadoraPrazos } from "@/lib/prazoCalculadora";
import {
  AREAS,
  PROCEDIMENTO_MANUAL,
  procedimentosDe,
  buscarProcedimento,
  descreverRegra,
  calcularVencimento,
  type AreaProcesso,
  type Contagem,
  type RegraContagem,
} from "@/lib/prazos";
import { formatarDataLonga } from "@/lib/format";
import { HOJE_REF } from "@/data/seed";
import { cn } from "@/lib/cn";

export function CalculadoraPrazosModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [area, setArea] = useState<AreaProcesso>("Cível");
  const [procedimento, setProcedimento] = useState<string>("Contestação");
  const [dataInicial, setDataInicial] = useState("");
  const [dias, setDias] = useState("15");
  const [contagemManual, setContagemManual] = useState<Contagem>("uteis");
  const [feriadosTexto, setFeriadosTexto] = useState("");

  // No segundo select entram apenas os procedimentos com prazo de contagem.
  const catalogo = useMemo(
    () => procedimentosDe(area).filter((p) => p.quantidade !== null),
    [area],
  );
  const ehManual = procedimento === PROCEDIMENTO_MANUAL;
  const itemCatalogo = ehManual ? undefined : buscarProcedimento(area, procedimento);

  const trocarArea = (nova: AreaProcesso) => {
    setArea(nova);
    if (!ehManual && !buscarProcedimento(nova, procedimento)) {
      const lista = procedimentosDe(nova).filter((p) => p.quantidade !== null);
      setProcedimento(lista[0]?.nome ?? PROCEDIMENTO_MANUAL);
    }
  };

  const regra = useMemo<RegraContagem>(() => {
    if (itemCatalogo) return itemCatalogo;
    const n = Number(dias);
    return {
      quantidade: Number.isInteger(n) && n > 0 ? n : null,
      unidade: "dias",
      contagem: contagemManual,
    };
  }, [itemCatalogo, dias, contagemManual]);

  const feriados = useMemo(
    () =>
      feriadosTexto
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s)),
    [feriadosTexto],
  );

  const resultado = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataInicial)) return null;
    const dataFinal = calcularVencimento(dataInicial, regra, feriados);
    if (!dataFinal) return null;
    const restantes = new CalculadoraPrazos(feriados).diasUteisRestantes(dataFinal, HOJE_REF);
    return { dataFinal, diasUteisRestantes: restantes, urgente: restantes < 3 };
  }, [dataInicial, regra, feriados]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Calculadora de prazos"
      subtitle="Contagem conforme a regra do procedimento — dias úteis (art. 219, CPC) ou corridos (art. 798, CPP), com prorrogação para o dia útil seguinte"
      footer={
        <button onClick={onClose} className="btn-ghost">
          Fechar
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Ramo do Direito</label>
          <select value={area} onChange={(e) => trocarArea(e.target.value as AreaProcesso)} className="input">
            {AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Procedimento / Recurso</label>
          <select value={procedimento} onChange={(e) => setProcedimento(e.target.value)} className="input">
            {catalogo.map((p) => (
              <option key={p.nome} value={p.nome}>
                {p.nome} — {descreverRegra(p)}
              </option>
            ))}
            <option value={PROCEDIMENTO_MANUAL}>Outros / Inserção Manual</option>
          </select>
        </div>

        {/* Regra aplicada — do catálogo (somente leitura) ou informada manualmente */}
        {itemCatalogo ? (
          <div className="sm:col-span-2 flex items-start gap-2.5 rounded-xl border border-line bg-canvas px-4 py-3">
            <Clock size={14} className="mt-0.5 shrink-0 text-muted" />
            <div className="text-sm">
              <span className="font-medium text-body">{descreverRegra(itemCatalogo)}</span>
              <span className="mx-1.5 text-muted">·</span>
              <span className="text-body-2">{itemCatalogo.obs}</span>
            </div>
          </div>
        ) : (
          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Prazo (dias)</label>
              <input
                type="number"
                min={1}
                value={dias}
                onChange={(e) => setDias(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Forma de contagem</label>
              <select
                value={contagemManual}
                onChange={(e) => setContagemManual(e.target.value as Contagem)}
                className="input"
              >
                <option value="uteis">Dias úteis</option>
                <option value="corridos">Dias corridos</option>
              </select>
            </div>
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="label">Data da intimação (termo inicial)</label>
          <input
            type="date"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
            className="input"
          />
          <p className="mt-1 text-xs text-muted">
            O dia da intimação é excluído da contagem (exclui o dia do começo e inclui o do vencimento).
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Feriados locais adicionais (AAAA-MM-DD, um por linha)</label>
          <textarea
            value={feriadosTexto}
            onChange={(e) => setFeriadosTexto(e.target.value)}
            rows={3}
            placeholder={"2026-06-24\n2026-07-09"}
            className="input resize-none font-mono text-xs"
          />
          <p className="mt-1 text-xs text-muted">
            Fins de semana e feriados nacionais/forenses do calendário do sistema já são ignorados
            automaticamente{feriados.length > 0 && ` · ${feriados.length} feriado(s) extra considerado(s)`}.
          </p>
        </div>
      </div>

      {resultado && (
        <div
          className={cn(
            "mt-5 rounded-xl border p-5",
            resultado.urgente ? "border-critico/40 bg-critico-bg" : "border-line bg-canvas",
          )}
        >
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "grid h-11 w-11 place-items-center rounded-xl",
                resultado.urgente ? "bg-critico text-white" : "bg-baixo-bg text-baixo",
              )}
            >
              {resultado.urgente ? <AlertTriangle size={20} /> : <CalendarClock size={20} />}
            </span>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                Vencimento do prazo · {descreverRegra(regra)}
              </div>
              <div className="font-serif text-xl font-bold text-ink">
                {formatarDataLonga(resultado.dataFinal)}
              </div>
            </div>
          </div>
          <p
            className={cn(
              "mt-3 flex items-center gap-1.5 text-sm font-medium",
              resultado.urgente ? "text-critico" : "text-baixo",
            )}
          >
            {resultado.urgente ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            {resultado.diasUteisRestantes < 0
              ? `Prazo vencido há ${Math.abs(resultado.diasUteisRestantes)} dia(s) útil(eis).`
              : resultado.urgente
                ? `Atenção: vence em ${resultado.diasUteisRestantes} dia(s) útil(eis) — sinalizado em vermelho nos cards.`
                : `Restam ${resultado.diasUteisRestantes} dias úteis a partir de hoje.`}
          </p>
        </div>
      )}
    </Modal>
  );
}
