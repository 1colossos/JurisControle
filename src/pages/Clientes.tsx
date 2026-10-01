import { useMemo, useState } from "react";
import { Search, Plus, Mail, Phone, MapPin, FileSignature, ScrollText, KeyRound } from "lucide-react";
import { useApp } from "@/store/AppContext";
import { useToast } from "@/components/ui/Toast";
import { gerarDocumentoPdf, DOCUMENTO_LABEL, type TipoDocumento } from "@/lib/documentos";
import { Modal } from "@/components/ui/Modal";
import { Pill } from "@/components/ui/Badge";
import { iniciais } from "@/lib/format";
import {
  maskCPF,
  maskCNPJ,
  maskTelefone,
  validarCPF,
  validarCNPJ,
  validarEmail,
  validarTelefone,
  validarNomeCompleto,
  validarNomeRazao,
} from "@/lib/validators";
import type { Cliente, TipoCliente, EstadoCivil } from "@/data/seed";

const ESTADOS_CIVIS: EstadoCivil[] = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)"];

interface FormCliente {
  nome: string;
  tipo: TipoCliente;
  doc: string;
  email: string;
  tel: string;
  estadoCivil: EstadoCivil | "";
  endereco: string;
}

const vazio: FormCliente = {
  nome: "",
  tipo: "PF",
  doc: "",
  email: "",
  tel: "",
  estadoCivil: "",
  endereco: "",
};

export function Clientes() {
  const { clientes, addCliente, updateCliente, processosPorCliente, usuario } = useApp();
  const toast = useToast();

  const gerarDocumento = (tipo: TipoDocumento, cliente: Cliente) => {
    const ok = gerarDocumentoPdf(tipo, cliente, usuario);
    toast(
      ok
        ? `${DOCUMENTO_LABEL[tipo]} gerado(a) com os dados de ${cliente.nome} — escolha "Salvar como PDF".`
        : "Não foi possível abrir o documento (pop-up bloqueado).",
      ok ? "success" : "warning",
    );
  };
  const [q, setQ] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | TipoCliente>("todos");
  const [aberto, setAberto] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormCliente>(vazio);
  const [erros, setErros] = useState<Partial<Record<keyof FormCliente, string>>>({});

  const filtrados = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return clientes.filter(
      (c) =>
        (tipoFiltro === "todos" || c.tipo === tipoFiltro) &&
        (!termo || c.nome.toLowerCase().includes(termo) || c.doc.includes(termo)),
    );
  }, [clientes, q, tipoFiltro]);

  const abrirNovo = () => {
    setForm(vazio);
    setErros({});
    setEditId(null);
    setAberto(true);
  };
  const abrirEdicao = (c: Cliente) => {
    setForm({
      nome: c.nome,
      tipo: c.tipo,
      doc: c.doc,
      email: c.email,
      tel: c.tel,
      estadoCivil: c.estadoCivil ?? "",
      endereco: c.endereco,
    });
    setErros({});
    setEditId(c.id);
    setAberto(true);
  };

  const setTipo = (tipo: TipoCliente) =>
    setForm((f) => ({ ...f, tipo, doc: "", estadoCivil: tipo === "PJ" ? "" : f.estadoCivil }));

  const validar = (): boolean => {
    const e: typeof erros = {};
    const pf = form.tipo === "PF";

    if (pf ? !validarNomeCompleto(form.nome) : !validarNomeRazao(form.nome)) {
      e.nome = pf
        ? "Informe o nome completo (nome e sobrenome, apenas letras)."
        : "Informe a razão social (3 a 120 caracteres).";
    }
    if (pf && !validarCPF(form.doc)) e.doc = "CPF inválido — confira os dígitos verificadores.";
    if (!pf && !validarCNPJ(form.doc)) e.doc = "CNPJ inválido — confira os dígitos verificadores.";
    if (!validarEmail(form.email.trim())) e.email = "Informe um e-mail válido (máx. 254 caracteres).";
    if (!validarTelefone(form.tel)) e.tel = "Informe telefone com DDD, ex.: (11) 98888-7766.";
    if (pf && !form.estadoCivil) e.estadoCivil = "Selecione o status social.";
    if (form.endereco.trim().length < 3 || form.endereco.trim().length > 120) {
      e.endereco = "Informe o domicílio do cliente (cidade - UF ou endereço).";
    }
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    const dados = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      doc: form.doc,
      email: form.email.trim(),
      tel: form.tel,
      estadoCivil: form.tipo === "PF" && form.estadoCivil ? form.estadoCivil : undefined,
      endereco: form.endereco.trim(),
    };
    if (editId) {
      updateCliente(editId, dados);
      toast("Cliente atualizado.");
    } else {
      addCliente(dados);
      toast("Cliente cadastrado com sucesso.");
    }
    setAberto(false);
  };

  const campo = (k: keyof FormCliente) =>
    erros[k] ? <p className="mt-1 text-xs font-medium text-critico">{erros[k]}</p> : null;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={abrirNovo} className="btn-primary">
          <Plus size={16} /> Novo cliente
        </button>
      </div>

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou documento…"
            className="input pl-10"
          />
        </div>
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value as typeof tipoFiltro)}
          className="input sm:w-44"
        >
          <option value="todos">Todos tipos</option>
          <option value="PF">Pessoa Física</option>
          <option value="PJ">Pessoa Jurídica</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Documento</th>
                <th className="px-5 py-3 font-semibold">Contato</th>
                <th className="px-5 py-3 font-semibold">Domicílio</th>
                <th className="px-5 py-3 font-semibold">Tipo</th>
                <th className="px-5 py-3 text-right font-semibold">Processos</th>
                <th className="px-5 py-3 text-right font-semibold">Documentos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtrados.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => abrirEdicao(c)}
                  className="cursor-pointer transition hover:bg-canvas"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-navy-900 text-xs font-semibold text-white">
                        {iniciais(c.nome)}
                      </span>
                      <div>
                        <span className="font-medium text-body">{c.nome}</span>
                        {c.estadoCivil && (
                          <span className="block text-xs text-muted">{c.estadoCivil}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-body-2">
                    {c.doc}
                    <span className="mt-1 flex items-center gap-1 text-[11px] text-muted" title="Token de acesso ao Portal do Cliente">
                      <KeyRound size={11} /> {c.portalToken}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-body-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Mail size={12} className="text-muted" /> {c.email}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                      <Phone size={12} className="text-muted" /> {c.tel}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-body-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <MapPin size={12} className="text-muted" /> {c.endereco}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Pill>{c.tipo === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}</Pill>
                  </td>
                  <td className="px-5 py-4 text-right font-serif text-lg font-bold text-ink">
                    {processosPorCliente(c.id)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          gerarDocumento("procuracao", c);
                        }}
                        title="Gerar procuração ad judicia"
                        className="rounded-lg p-2 text-muted transition hover:bg-gold-bg hover:text-gold-600"
                      >
                        <FileSignature size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          gerarDocumento("contrato_honorarios", c);
                        }}
                        title="Gerar contrato de honorários"
                        className="rounded-lg p-2 text-muted transition hover:bg-gold-bg hover:text-gold-600"
                      >
                        <ScrollText size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={aberto}
        onClose={() => setAberto(false)}
        title={editId ? "Editar cliente" : "Novo cliente"}
        subtitle="Identificação pessoal e canais de comunicação"
        footer={
          <>
            <button onClick={() => setAberto(false)} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" form="form-cliente" className="btn-gold">
              Salvar
            </button>
          </>
        }
      >
        <form id="form-cliente" onSubmit={salvar} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <label className="label">{form.tipo === "PJ" ? "Razão social" : "Nome completo"}</label>
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              maxLength={120}
              placeholder={form.tipo === "PJ" ? "Empresa Exemplo Ltda." : "Maria da Silva Oliveira"}
              className="input"
            />
            {campo("nome")}
          </div>
          <div>
            <label className="label">Pessoa física ou jurídica</label>
            <select
              value={form.tipo}
              onChange={(e) => setTipo(e.target.value as TipoCliente)}
              className="input"
            >
              <option value="PF">Pessoa Física</option>
              <option value="PJ">Pessoa Jurídica</option>
            </select>
          </div>
          <div>
            <label className="label">{form.tipo === "PJ" ? "CNPJ" : "CPF"}</label>
            <input
              value={form.doc}
              onChange={(e) =>
                setForm({
                  ...form,
                  doc: form.tipo === "PJ" ? maskCNPJ(e.target.value) : maskCPF(e.target.value),
                })
              }
              inputMode="numeric"
              placeholder={form.tipo === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
              className="input font-mono"
            />
            {campo("doc")}
          </div>
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              maxLength={254}
              placeholder="cliente@email.com"
              className="input"
            />
            {campo("email")}
          </div>
          <div>
            <label className="label">Telefone / WhatsApp (com DDD)</label>
            <input
              value={form.tel}
              onChange={(e) => setForm({ ...form, tel: maskTelefone(e.target.value) })}
              inputMode="tel"
              placeholder="(11) 98888-7766"
              className="input"
            />
            {campo("tel")}
          </div>
          {form.tipo === "PF" && (
            <div>
              <label className="label">Status social</label>
              <select
                value={form.estadoCivil}
                onChange={(e) => setForm({ ...form, estadoCivil: e.target.value as EstadoCivil })}
                className="input"
              >
                <option value="">Selecione…</option>
                {ESTADOS_CIVIS.map((ec) => (
                  <option key={ec}>{ec}</option>
                ))}
              </select>
              {campo("estadoCivil")}
            </div>
          )}
          <div className={form.tipo === "PF" ? "" : "sm:col-span-1"}>
            <label className="label">Local do cliente (domicílio)</label>
            <input
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              maxLength={120}
              placeholder="São Paulo - SP"
              className="input"
            />
            {campo("endereco")}
          </div>
        </form>
      </Modal>
    </div>
  );
}
