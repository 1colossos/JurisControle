/* ============================================================
   Calculadora de prazos (Novo CPC) em dias úteis, com feriados
   extras informados pelo usuário. Usa a mesma régua cromática dos
   cards de processo: menos de 3 dias úteis = vermelho (crítico).
   ============================================================ */

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CalculadoraPrazos } from "@/lib/prazoCalculadora";
import { formatarDataLonga } from "@/lib/format";
import { HOJE_REF } from "@/data/seed";
import { cn } from "@/lib/cn";

export function CalculadoraPrazosModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [dataInicial, setDataInicial] = useState("");
  const [dias, setDias] = useState("15");
  const [feriadosTexto, setFeriadosTexto] = useState("");

  const feriados = useMemo(
    () =>
      feriadosTexto
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s)),
    [feriadosTexto],
  );

  const resultado = useMemo(() => {
    const n = Number(dias);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataInicial) || !Number.isInteger(n) || n <= 0) return null;
    return new CalculadoraPrazos(feriados).calcular(dataInicial, n, HOJE_REF);
  }, [dataInicial, dias, feriados]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Calculadora de prazos"
      subtitle="Contagem em dias úteis conforme o Novo CPC (exclui o dia da intimação)"
      footer={
        <button onClick={onClose} className="btn-ghost">
          Fechar
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Data da intimação</label>
          <input
            type="date"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Prazo (dias úteis)</label>
          <input
            type="number"
            min={1}
            value={dias}
            onChange={(e) => setDias(e.target.value)}
            className="input"
          />
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
                Vencimento do prazo
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
