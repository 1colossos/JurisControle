import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, CalendarClock, Info, Scale } from "lucide-react";
import { useApp } from "@/store/AppContext";
import { useToast } from "@/components/ui/Toast";
import { UrgencyBadge } from "@/components/ui/Badge";
import { URGENCIA } from "@/components/ui/urgency";
import { tiposProcesso, HOJE_REF } from "@/data/seed";
import { AREAS, regraPrazo, descreveRegra, calcularPrazoSugerido, type AreaProcesso } from "@/lib/prazos";
import { diasUteisAte, classificarUrgencia } from "@/lib/businessDays";
import { maskNumeroCNJ, validarNumeroCNJ } from "@/lib/validators";
import { formatarData, diasUteisLabel } from "@/lib/format";

const LEMBRETES = [1, 3, 7, 15];

export function ProcessoForm() {
  const { id } = useParams();
  const { clientes, processos, addProcesso, updateProcesso, getProcesso } = useApp();
  const navigate = useNavigate();
  const toast = useToast();

  const existente = id ? getProcesso(id) : undefined;
  const editando = Boolean(existente);

  const [numero, setNumero] = useState(existente?.numero ?? "");
  const [clienteId, setClienteId] = useState(existente?.clienteId ?? clientes[0]?.id ?? "");
  const [area, setArea] = useState<AreaProcesso>(existente?.area ?? "Cível");
  const [tipo, setTipo] = useState(existente?.tipo ?? tiposProcesso[0]);
  const [vara, setVara] = useState(existente?.vara ?? "");
  const [objeto, setObjeto] = useState(existente?.objeto ?? "");
  const [valor, setValor] = useState(String(existente?.valor ?? ""));
  const [termoInicial, setTermoInicial] = useState(existente?.termoInicial ?? HOJE_REF);
  const [prazo, setPrazo] = useState(existente?.prazo ?? "");
  const [modoPrazo, setModoPrazo] = useState<"auto" | "manual">(editando ? "manual" : "auto");
  const [lembretes, setLembretes] = useState<number[]>(existente?.lembretes ?? [3, 7]);
  const [status, setStatus] = useState(existente?.status ?? "Em andamento");
  const [erros, setErros] = useState<Record<string, string>>({});

  const ehPeticaoInicial = tipo === "Petição Inicial";

  // Regra legal sugerida para o par tipo × área (pode não existir → manual).
  const regra = useMemo(() => regraPrazo(tipo, area), [tipo, area]);
  const prazoCalculado = useMemo(
    () => calcularPrazoSugerido(termoInicial, regra),
    [termoInicial, regra],
  );

  // Sem regra automática, força a referência manual.
  const modoEfetivo = prazoCalculado === null ? "manual" : modoPrazo;
  const prazoFinal = modoEfetivo === "auto" ? prazoCalculado ?? "" : prazo;

  const previa = useMemo(() => {
    if (!prazoFinal) return null;
    const dias = diasUteisAte(prazoFinal, HOJE_REF);
    return { dias, urgencia: classificarUrgencia(dias) };
  }, [prazoFinal]);

  const toggleLembrete = (d: number) =>
    setLembretes((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));

  const validar = (): boolean => {
    const e: Record<string, string> = {};

    // 1. Número CNJ: exatamente 20 dígitos no padrão 0000000-00.0000.0.00.0000.
    if (!validarNumeroCNJ(numero)) {
      e.numero = "Número inválido — use o padrão CNJ com 20 dígitos, ex.: 0007890-12.2024.8.26.0224.";
    } else {
      // 3. Número repetido: permitido apenas para o MESMO cliente e
      //    respeitando a cronologia do primeiro cadastro daquele número.
      const mesmos = processos.filter((p) => p.numero === numero.trim() && p.id !== id);
      const deOutroCliente = mesmos.find((p) => p.clienteId !== clienteId);
      if (deOutroCliente) {
        e.numero = `Este número já está cadastrado para outro cliente (${deOutroCliente.cliente?.nome ?? "—"}). Um número repetido deve pertencer ao mesmo cliente.`;
      } else if (mesmos.length > 0 && termoInicial) {
        const primeiro = mesmos.reduce((a, b) => (a.termoInicial <= b.termoInicial ? a : b));
        if (termoInicial < primeiro.termoInicial) {
          e.termoInicial = `Fora da cronologia do processo: o primeiro registro deste número tem termo inicial em ${formatarData(primeiro.termoInicial)}. O novo lançamento deve ser posterior.`;
        }
      }
    }

    // 2. Vara obrigatória, exceto para Petição Inicial.
    if (!ehPeticaoInicial && vara.trim().length < 3) {
      e.vara = "Informe a vara que será demandada (obrigatória para este tipo de procedimento).";
    }

    if (!clienteId) e.clienteId = "Vincule um cliente ao processo.";
    if (objeto.trim().length < 5 || objeto.trim().length > 300) {
      e.objeto = "Descreva o objeto da causa (entre 5 e 300 caracteres).";
    }
    if (!termoInicial) e.termoInicial = e.termoInicial ?? "Informe o termo inicial.";
    if (!prazoFinal) {
      e.prazo = ehPeticaoInicial
        ? "Petição inicial não tem prazo processual — defina uma data de referência manual (prescrição/decadência)."
        : "Defina um prazo final válido.";
    } else if (termoInicial && prazoFinal < termoInicial) {
      e.prazo = "O prazo final não pode ser anterior ao termo inicial.";
    }

    setErros(e);
    return Object.keys(e).length === 0;
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) {
      toast("Corrija os campos destacados antes de salvar.", "warning");
      return;
    }
    const dados = {
      numero: numero.trim(),
      clienteId,
      area,
      tipo,
      vara: vara.trim(),
      objeto: objeto.trim(),
      valor: Number(valor) || 0,
      termoInicial,
      prazo: prazoFinal,
      status: status as never,
      lembretes,
    };
    if (editando && id) {
      updateProcesso(id, dados);
      toast("Processo atualizado com sucesso.");
      navigate(`/app/processos/${id}`);
    } else {
      const novoId = addProcesso(dados);
      toast("Processo cadastrado e prazo em monitoramento.");
      navigate(`/app/processos/${novoId}`);
    }
  };

  const erroDe = (k: string) =>
    erros[k] ? <p className="mt-1 text-xs font-medium text-critico">{erros[k]}</p> : null;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link to="/app/processos" className="inline-flex items-center gap-1.5 text-sm font-medium text-body-2 hover:text-ink">
        <ArrowLeft size={16} /> Voltar para processos
      </Link>

      <form onSubmit={salvar} className="grid gap-5 lg:grid-cols-3" noValidate>
        {/* Coluna principal */}
        <div className="space-y-5 lg:col-span-2">
          <section className="card p-6">
            <h3 className="text-lg">Dados do processo</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Número do processo (CNJ)</label>
                <input
                  required
                  value={numero}
                  onChange={(e) => setNumero(maskNumeroCNJ(e.target.value))}
                  placeholder="0007890-12.2024.8.26.0224"
                  className="input font-mono"
                  inputMode="numeric"
                />
                {erroDe("numero")}
              </div>
              <div>
                <label className="label">Cliente vinculado</label>
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="input">
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
                {erroDe("clienteId")}
              </div>
              <div>
                <label className="label">Área do processo</label>
                <select value={area} onChange={(e) => setArea(e.target.value as AreaProcesso)} className="input">
                  {AREAS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Peça / Procedimento</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input">
                  {tiposProcesso.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">
                  Vara / Foro {ehPeticaoInicial && <span className="normal-case text-muted">(opcional na petição inicial)</span>}
                </label>
                <input
                  value={vara}
                  onChange={(e) => setVara(e.target.value)}
                  maxLength={80}
                  placeholder="3ª Vara Cível - SP"
                  className="input"
                />
                {erroDe("vara")}
              </div>
              <div>
                <label className="label">Valor da causa</label>
                <input
                  value={valor}
                  onChange={(e) => setValor(e.target.value.replace(/[^\d]/g, "").slice(0, 12))}
                  inputMode="numeric"
                  placeholder="25000"
                  className="input"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Objeto / Descrição</label>
                <textarea
                  value={objeto}
                  onChange={(e) => setObjeto(e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder="Ação de cobrança — débitos de obra"
                  className="input resize-none"
                />
                {erroDe("objeto")}
              </div>
            </div>
          </section>

          <section className="card p-6">
            <h3 className="text-lg">Contagem de prazo</h3>
            <p className="text-sm text-muted">
              A regra legal é sugerida conforme a área e a peça escolhidas — dias úteis ou corridos.
              Você sempre pode definir a data de referência manualmente.
            </p>

            {/* Regra sugerida para o par área × peça */}
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-medio-bg p-4">
              <Scale size={16} className="mt-0.5 shrink-0 text-medio" />
              <div className="text-sm text-body">
                <strong>
                  {area} · {tipo}:
                </strong>{" "}
                {prazoCalculado === null ? "sem contagem automática" : descreveRegra(regra)}
                <p className="mt-1 text-xs text-body-2">{regra.obs}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Termo inicial</label>
                <input
                  type="date"
                  value={termoInicial}
                  onChange={(e) => setTermoInicial(e.target.value)}
                  className="input"
                />
                {erroDe("termoInicial")}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-canvas p-4">
              <input
                type="radio"
                id="auto"
                checked={modoEfetivo === "auto"}
                disabled={prazoCalculado === null}
                onChange={() => setModoPrazo("auto")}
                className="accent-gold"
              />
              <label htmlFor="auto" className={`text-sm ${prazoCalculado === null ? "text-muted" : "text-body"}`}>
                Usar prazo calculado ({descreveRegra(regra)}):{" "}
                <strong>{prazoCalculado ? formatarData(prazoCalculado) : "—"}</strong>
              </label>
              <span className="mx-2 hidden h-4 w-px bg-line-2 sm:block" />
              <input
                type="radio"
                id="manual"
                checked={modoEfetivo === "manual"}
                onChange={() => setModoPrazo("manual")}
                className="accent-gold"
              />
              <label htmlFor="manual" className="text-sm text-body">
                Referência manual
              </label>
              {modoEfetivo === "manual" && (
                <input
                  type="date"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="input mt-2 w-full sm:mt-0 sm:w-auto"
                />
              )}
              {erros.prazo && <p className="w-full text-xs font-medium text-critico">{erros.prazo}</p>}
            </div>
          </section>
        </div>

        {/* Coluna lateral — prévia + lembretes */}
        <div className="space-y-5">
          <section className="card overflow-hidden">
            <div className="bg-navy-900 px-5 py-4 text-white">
              <span className="flex items-center gap-2 text-sm font-medium text-white/70">
                <CalendarClock size={16} className="text-gold" /> Prévia do prazo
              </span>
            </div>
            <div className="p-5 text-center">
              {previa && prazoFinal ? (
                <>
                  <div className="font-serif text-3xl font-bold text-ink">{formatarData(prazoFinal)}</div>
                  <div className="mt-1 text-sm text-muted">{diasUteisLabel(previa.dias)} restantes</div>
                  <div className="mt-3 flex justify-center">
                    <UrgencyBadge urgencia={previa.urgencia} />
                  </div>
                  <div className={`mt-4 rounded-xl ${URGENCIA[previa.urgencia].bg} p-3 text-xs ${URGENCIA[previa.urgencia].text}`}>
                    {URGENCIA[previa.urgencia].desc}
                  </div>
                </>
              ) : (
                <p className="py-6 text-sm text-muted">
                  {prazoCalculado === null
                    ? "Este procedimento não tem contagem automática — defina a data de referência manual."
                    : "Informe o termo inicial para calcular o prazo."}
                </p>
              )}
            </div>
          </section>

          <section className="card p-5">
            <h3 className="text-base">Lembretes automáticos</h3>
            <p className="text-xs text-muted">Dias úteis de antecedência para alertar</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {LEMBRETES.map((d) => {
                const on = lembretes.includes(d);
                return (
                  <button
                    type="button"
                    key={d}
                    onClick={() => toggleLembrete(d)}
                    className={
                      on
                        ? "rounded-xl border border-gold bg-gold-bg py-2 text-sm font-semibold text-ink"
                        : "rounded-xl border border-line-2 py-2 text-sm text-body-2 hover:bg-canvas"
                    }
                  >
                    {d} dia{d > 1 ? "s" : ""}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2 text-xs text-muted">
              <Info size={14} className="mt-0.5 shrink-0" />
              Enviados por e-mail (SMTP) e WhatsApp (Z-API) conforme as configurações.
            </div>
          </section>

          {editando && (
            <div>
              <label className="label">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as never)} className="input">
                <option>Em andamento</option>
                <option>Suspenso</option>
                <option>Arquivado</option>
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <Link to="/app/processos" className="btn-ghost flex-1">
              Cancelar
            </Link>
            <button type="submit" className="btn-gold flex-1">
              <Save size={16} /> Salvar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
