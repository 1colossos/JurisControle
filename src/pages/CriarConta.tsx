import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Logo } from "@/components/Brand";
import { useApp } from "@/store/AppContext";
import { useToast } from "@/components/ui/Toast";
import { AREAS_ATUACAO } from "@/data/seed";
import {
  UFS,
  idadeMinima,
  maskTelefone,
  somenteDigitos,
  validarEmail,
  validarNomeCompleto,
  validarOAB,
  validarSenha,
  validarTelefone,
} from "@/lib/validators";

interface FormConta {
  email: string;
  nome: string;
  nascimento: string;
  oab: string;
  areas: string[];
  telefone: string;
  uf: string;
  escritorio: string;
  senha: string;
  confirmar: string;
}

const vazio: FormConta = {
  email: "",
  nome: "",
  nascimento: "",
  oab: "",
  areas: [],
  telefone: "",
  uf: "",
  escritorio: "",
  senha: "",
  confirmar: "",
};

export function CriarConta() {
  const { setUsuario } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormConta>(vazio);
  const [erros, setErros] = useState<Partial<Record<keyof FormConta, string>>>({});

  const set = <K extends keyof FormConta>(k: K, v: FormConta[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleArea = (a: string) =>
    set("areas", form.areas.includes(a) ? form.areas.filter((x) => x !== a) : [...form.areas, a]);

  const validar = (): boolean => {
    const e: typeof erros = {};
    if (!validarEmail(form.email.trim())) e.email = "Informe um e-mail válido (máx. 254 caracteres).";
    if (!validarNomeCompleto(form.nome)) e.nome = "Informe seu nome completo (nome e sobrenome, apenas letras).";
    if (!idadeMinima(form.nascimento, 18)) e.nascimento = "Data inválida — é preciso ter ao menos 18 anos.";
    if (!validarOAB(form.oab)) e.oab = "Informe o número da OAB (3 a 6 dígitos).";
    if (form.areas.length === 0) e.areas = "Selecione ao menos uma área de atuação.";
    if (!validarTelefone(form.telefone)) e.telefone = "Informe telefone com DDD, ex.: (11) 98888-7766.";
    if (!form.uf) e.uf = "Selecione a UF de atuação.";
    if (!validarSenha(form.senha)) e.senha = "Mínimo de 8 caracteres, com letras e números.";
    if (form.confirmar !== form.senha) e.confirmar = "As senhas não conferem.";
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const criar = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validar()) return;
    setUsuario({
      nome: form.nome.trim(),
      oab: `OAB/${form.uf} ${somenteDigitos(form.oab)}`,
      email: form.email.trim(),
      telefone: form.telefone,
      escritorio: form.escritorio.trim(),
      uf: form.uf,
      dataNascimento: form.nascimento,
      areas: form.areas,
    });
    toast("Conta criada com sucesso! Faça login para continuar.");
    navigate("/");
  };

  const campo = (k: keyof FormConta) =>
    erros[k] ? <p className="mt-1 text-xs font-medium text-critico">{erros[k]}</p> : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={56} />
          <h1 className="mt-3 text-2xl">Criar nova conta</h1>
          <p className="mt-1 text-sm text-muted">
            Preencha seus dados profissionais para começar a usar o JurisControle.
          </p>
        </div>

        <form onSubmit={criar} className="card grid gap-4 p-7 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <label className="label">Nome completo</label>
            <input
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              maxLength={120}
              placeholder="Maria da Silva Oliveira"
              className="input"
            />
            {campo("nome")}
          </div>

          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              maxLength={254}
              placeholder="voce@escritorio.adv.br"
              className="input"
            />
            {campo("email")}
          </div>

          <div>
            <label className="label">Data de nascimento</label>
            <input
              type="date"
              value={form.nascimento}
              onChange={(e) => set("nascimento", e.target.value)}
              className="input"
            />
            {campo("nascimento")}
          </div>

          <div>
            <label className="label">Carteira OAB (nº)</label>
            <input
              value={form.oab}
              onChange={(e) => set("oab", somenteDigitos(e.target.value).slice(0, 6))}
              inputMode="numeric"
              placeholder="123456"
              className="input font-mono"
            />
            {campo("oab")}
          </div>

          <div>
            <label className="label">Telefone (com DDD)</label>
            <input
              value={form.telefone}
              onChange={(e) => set("telefone", maskTelefone(e.target.value))}
              inputMode="tel"
              placeholder="(11) 98888-7766"
              className="input"
            />
            {campo("telefone")}
          </div>

          <div>
            <label className="label">UF de atuação</label>
            <select value={form.uf} onChange={(e) => set("uf", e.target.value)} className="input">
              <option value="">Selecione…</option>
              {UFS.map((uf) => (
                <option key={uf}>{uf}</option>
              ))}
            </select>
            {campo("uf")}
          </div>

          <div>
            <label className="label">Escritório (opcional)</label>
            <input
              value={form.escritorio}
              onChange={(e) => set("escritorio", e.target.value)}
              maxLength={120}
              placeholder="Nome do escritório, se houver"
              className="input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Áreas de atuação</label>
            <div className="flex flex-wrap gap-2">
              {AREAS_ATUACAO.map((a) => {
                const on = form.areas.includes(a);
                return (
                  <button
                    type="button"
                    key={a}
                    onClick={() => toggleArea(a)}
                    className={
                      on
                        ? "rounded-xl border border-gold bg-gold-bg px-3.5 py-2 text-sm font-semibold text-ink"
                        : "rounded-xl border border-line-2 px-3.5 py-2 text-sm text-body-2 hover:bg-canvas"
                    }
                  >
                    {a}
                  </button>
                );
              })}
            </div>
            {campo("areas")}
          </div>

          <div>
            <label className="label">Senha</label>
            <input
              type="password"
              value={form.senha}
              onChange={(e) => set("senha", e.target.value)}
              maxLength={64}
              placeholder="Mínimo 8 caracteres"
              className="input"
              autoComplete="new-password"
            />
            {campo("senha")}
          </div>

          <div>
            <label className="label">Confirmar senha</label>
            <input
              type="password"
              value={form.confirmar}
              onChange={(e) => set("confirmar", e.target.value)}
              maxLength={64}
              placeholder="Repita a senha"
              className="input"
              autoComplete="new-password"
            />
            {campo("confirmar")}
          </div>

          <div className="sm:col-span-2 mt-2 flex items-center justify-between gap-3">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-body-2 hover:text-ink">
              <ArrowLeft size={16} /> Voltar para o login
            </Link>
            <button type="submit" className="btn-primary">
              <UserPlus size={16} /> Criar conta
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
