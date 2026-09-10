import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FileText,
  Plus,
  Download,
  Eye,
  User,
  Scale,
  CalendarClock,
  Image as ImageIcon,
} from "lucide-react";
import { useApp } from "@/store/AppContext";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { UrgencyBadge, StatusBadge, Pill } from "@/components/ui/Badge";
import { URGENCIA } from "@/components/ui/urgency";
import { formatarData, diasUteisLabel, moeda } from "@/lib/format";
import type { Arquivo } from "@/data/seed";

/** Regra de negócio dos anexos: tipos aceitos e tamanho máximo (10 MB). */
const TIPOS_ACEITOS = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const TAMANHO_MAX = 10 * 1024 * 1024;

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function ProcessoDetalhe() {
  const { id } = useParams();
  const { getProcesso, removeProcesso, addArquivo, removeArquivo } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmar, setConfirmar] = useState(false);
  const [preview, setPreview] = useState<Arquivo | null>(null);
  const [excluirArquivo, setExcluirArquivo] = useState<Arquivo | null>(null);
  const inputArquivo = useRef<HTMLInputElement>(null);

  const p = id ? getProcesso(id) : undefined;

  if (!p) {
    return (
      <div className="card p-10 text-center">
        <p className="text-muted">Processo não encontrado.</p>
        <Link to="/app/processos" className="btn-ghost mt-4 inline-flex">
          Voltar para processos
        </Link>
      </div>
    );
  }

  const excluir = () => {
    removeProcesso(p.id);
    toast("Processo excluído.", "warning");
    navigate("/app/processos");
  };

  const anexar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!TIPOS_ACEITOS.includes(file.type)) {
      toast("Tipo de arquivo não permitido. Anexe PDF, imagem (PNG/JPG/WebP) ou Word.", "warning");
      return;
    }
    if (file.size > TAMANHO_MAX) {
      toast("Arquivo excede o limite de 10 MB.", "warning");
      return;
    }
    if (p.arquivos.some((a) => a.nome === file.name)) {
      toast("Já existe um anexo com esse nome neste processo.", "warning");
      return;
    }
    addArquivo(p.id, {
      id: `a${Date.now().toString(36)}`,
      nome: file.name,
      tamanho: formatarTamanho(file.size),
      mime: file.type,
      url: URL.createObjectURL(file),
    });
    toast("Arquivo anexado ao processo.");
  };

  const confirmarExclusaoArquivo = () => {
    if (!excluirArquivo) return;
    if (excluirArquivo.url) URL.revokeObjectURL(excluirArquivo.url);
    removeArquivo(p.id, excluirArquivo.id);
    setExcluirArquivo(null);
    toast("Anexo removido.", "warning");
  };

  const ehImagem = (a: Arquivo) => a.mime?.startsWith("image/");
  const ehPdf = (a: Arquivo) => a.mime === "application/pdf";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/app/processos" className="inline-flex items-center gap-1.5 text-sm font-medium text-body-2 hover:text-ink">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <div className="flex gap-2.5">
          <Link to={`/app/processos/${p.id}/editar`} className="btn-ghost">
            <Pencil size={15} /> Editar
          </Link>
          <button onClick={() => setConfirmar(true)} className="btn-danger">
            <Trash2 size={15} /> Excluir
          </button>
        </div>
      </div>

      {/* Cabeçalho */}
      <div className="card overflow-hidden">
        <div className="border-b border-line bg-gradient-to-r from-navy-900 to-navy-700 px-6 py-5 text-white">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-gold">{p.numero}</span>
            <UrgencyBadge urgencia={p.urgencia} />
            <StatusBadge status={p.status} />
          </div>
          <h2 className="mt-2 font-serif text-2xl font-bold text-white">
            {p.tipo} — {p.cliente?.nome}
          </h2>
          <p className="text-white/70">
            {p.area} · {p.objeto}
          </p>
        </div>

        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: User, label: "Cliente", valor: p.cliente?.nome ?? "—" },
            { icon: Scale, label: "Vara / Foro", valor: p.vara || "—" },
            { icon: CalendarClock, label: "Prazo final", valor: `${formatarData(p.prazo)} · ${diasUteisLabel(p.diasUteis)}` },
            { icon: FileText, label: "Valor da causa", valor: moeda(p.valor) },
          ].map((c) => (
            <div key={c.label} className="bg-surface p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
                <c.icon size={14} /> {c.label}
              </div>
              <div className="mt-1.5 font-medium text-body">{c.valor}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Linha do tempo */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-lg">Linha do tempo</h3>
          <p className="text-sm text-muted">Trajetória e cronograma da causa</p>

          <ol className="relative mt-6 space-y-6 border-l-2 border-line pl-6">
            {p.timeline.map((ev, i) => (
              <li key={i} className="relative">
                <span
                  className={`absolute -left-[31px] grid h-5 w-5 place-items-center rounded-full ring-4 ring-surface ${
                    ev.done ? "bg-baixo" : `${URGENCIA[p.urgencia].dot}`
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-body">{ev.titulo}</span>
                  <Pill>{formatarData(ev.data)}</Pill>
                  {!ev.done && <UrgencyBadge urgencia={p.urgencia} />}
                </div>
                <p className="mt-1 text-sm text-body-2">{ev.desc}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Prazo + arquivos */}
        <div className="space-y-5">
          <div className={`card p-5 ${URGENCIA[p.urgencia].bg}`}>
            <div className="text-xs uppercase tracking-wide text-body-2">Prazo monitorado</div>
            <div className="mt-1 font-serif text-3xl font-bold text-ink">{formatarData(p.prazo)}</div>
            <div className={`mt-1 text-sm font-semibold ${URGENCIA[p.urgencia].text}`}>
              {diasUteisLabel(p.diasUteis)} restantes
            </div>
            <div className="mt-3 text-xs text-body-2">
              Lembretes: {p.lembretes.map((d) => `${d}d`).join(" · ") || "nenhum"}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base">Arquivos</h3>
              <button
                onClick={() => inputArquivo.current?.click()}
                className="text-sm font-semibold text-gold-600 hover:underline"
              >
                <Plus size={14} className="mr-1 inline" /> Adicionar
              </button>
              <input
                ref={inputArquivo}
                type="file"
                accept={TIPOS_ACEITOS.join(",")}
                onChange={anexar}
                className="hidden"
              />
            </div>
            <p className="mt-1 text-xs text-muted">PDF, imagem ou Word — até 10 MB por arquivo.</p>
            <ul className="mt-3 space-y-2">
              {p.arquivos.length === 0 && (
                <li className="rounded-xl border border-dashed border-line-2 py-6 text-center text-sm text-muted">
                  Nenhum arquivo anexado.
                </li>
              )}
              {p.arquivos.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <button
                    onClick={() => setPreview(a)}
                    className={`grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg ${
                      ehImagem(a) ? "bg-medio-bg text-medio" : "bg-critico-bg text-critico"
                    }`}
                    title="Pré-visualizar"
                  >
                    {ehImagem(a) && a.url ? (
                      <img src={a.url} alt="" className="h-9 w-9 object-cover" />
                    ) : ehImagem(a) ? (
                      <ImageIcon size={16} />
                    ) : (
                      <FileText size={16} />
                    )}
                  </button>
                  <button onClick={() => setPreview(a)} className="min-w-0 flex-1 text-left">
                    <div className="truncate text-sm font-medium text-body hover:underline">{a.nome}</div>
                    <div className="text-xs text-muted">{a.tamanho}</div>
                  </button>
                  <button onClick={() => setPreview(a)} className="text-muted hover:text-ink" title="Pré-visualizar">
                    <Eye size={16} />
                  </button>
                  {a.url && (
                    <a href={a.url} download={a.nome} className="text-muted hover:text-ink" title="Baixar">
                      <Download size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => setExcluirArquivo(a)}
                    className="text-muted hover:text-critico"
                    title="Excluir anexo"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Pré-visualização do anexo */}
      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview?.nome ?? "Anexo"}
        subtitle={`${preview?.tamanho ?? ""}${preview?.mime ? ` · ${preview.mime}` : ""}`}
        size="lg"
        footer={
          <>
            {preview?.url && (
              <a href={preview.url} download={preview.nome} className="btn-ghost">
                <Download size={15} /> Baixar
              </a>
            )}
            <button onClick={() => setPreview(null)} className="btn-primary">
              Fechar
            </button>
          </>
        }
      >
        {preview && preview.url && ehImagem(preview) && (
          <img src={preview.url} alt={preview.nome} className="mx-auto max-h-[55vh] rounded-xl" />
        )}
        {preview && preview.url && ehPdf(preview) && (
          <iframe src={preview.url} title={preview.nome} className="h-[55vh] w-full rounded-xl border border-line" />
        )}
        {preview && preview.url && !ehImagem(preview) && !ehPdf(preview) && (
          <div className="rounded-xl border border-dashed border-line-2 py-12 text-center text-sm text-muted">
            Pré-visualização não disponível para este formato — use o botão “Baixar”.
          </div>
        )}
        {preview && !preview.url && (
          <div className="rounded-xl border border-dashed border-line-2 py-12 text-center text-sm text-muted">
            Arquivo de demonstração sem conteúdo — anexe um arquivo real para pré-visualizar.
          </div>
        )}
      </Modal>

      {/* Confirmação de exclusão de anexo */}
      <Modal
        open={excluirArquivo !== null}
        onClose={() => setExcluirArquivo(null)}
        title="Excluir anexo"
        subtitle="Esta ação não poderá ser desfeita."
        footer={
          <>
            <button onClick={() => setExcluirArquivo(null)} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={confirmarExclusaoArquivo} className="btn-danger">
              <Trash2 size={15} /> Excluir anexo
            </button>
          </>
        }
      >
        <p className="text-sm text-body-2">
          Remover o arquivo <strong>{excluirArquivo?.nome}</strong> deste processo?
        </p>
      </Modal>

      <Modal
        open={confirmar}
        onClose={() => setConfirmar(false)}
        title="Excluir processo"
        subtitle="Esta ação não poderá ser desfeita."
        footer={
          <>
            <button onClick={() => setConfirmar(false)} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={excluir} className="btn-danger">
              <Trash2 size={15} /> Excluir definitivamente
            </button>
          </>
        }
      >
        <p className="text-sm text-body-2">
          Tem certeza que deseja remover o processo{" "}
          <span className="font-mono text-ink">{p.numero}</span> ({p.cliente?.nome})? Todas as
          informações de prazo e cronograma serão perdidas.
        </p>
      </Modal>
    </div>
  );
}
