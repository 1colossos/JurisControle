import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowRight, UserRound } from "lucide-react";
import { Logo } from "@/components/Brand";
import { useApp } from "@/store/AppContext";
import { validarCPF, validarEmail, somenteDigitos, maskCPF } from "@/lib/validators";

export function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [credencial, setCredencial] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const onCredencial = (v: string) => {
    // Se só houver dígitos/pontuação de CPF, aplica a máscara de CPF.
    setCredencial(/^[\d.-]*$/.test(v) && somenteDigitos(v).length > 0 ? maskCPF(v) : v);
  };

  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    const ehCPF = validarCPF(credencial);
    const ehEmail = validarEmail(credencial.trim());
    if (!ehCPF && !ehEmail) {
      setErro("Informe um CPF válido (000.000.000-00) ou um e-mail válido.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setErro("");
    login();
    navigate("/app");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(40rem 40rem at -5% -10%, rgba(224,168,58,.12), transparent 60%), radial-gradient(40rem 40rem at 105% 110%, rgba(59,91,219,.10), transparent 60%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        {/* Logo do sistema */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={72} />
          <h1 className="mt-4 text-3xl">JurisControle</h1>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            Gestão Jurídica
          </p>
        </div>

        <div className="card p-7">
          <h2 className="text-xl">Entrar</h2>
          <p className="mt-1 text-sm text-muted">Acesse com seu CPF ou e-mail cadastrado.</p>

          <form onSubmit={entrar} className="mt-6 space-y-4" noValidate>
            <div>
              <label className="label">CPF ou e-mail</label>
              <div className="relative">
                <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  required
                  value={credencial}
                  onChange={(e) => onCredencial(e.target.value)}
                  className="input pl-10"
                  placeholder="000.000.000-00 ou voce@escritorio.adv.br"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="label mb-0">Senha</label>
                <Link to="/esqueci-senha" className="text-xs font-semibold text-gold-600 hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {erro && (
              <p className="rounded-xl bg-critico-bg px-3.5 py-2.5 text-xs font-medium text-critico">
                {erro}
              </p>
            )}

            <button type="submit" className="btn-primary w-full">
              Entrar <ArrowRight size={16} />
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted">
          Novo por aqui?{" "}
          <Link to="/criar-conta" className="font-semibold text-ink hover:text-gold-600">
            Crie sua conta.
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-muted">
          É cliente do escritório?{" "}
          <Link to="/portal" className="font-semibold text-gold-600 hover:underline">
            Acesse o Portal do Cliente.
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-muted">
          © 2026 JurisControle. Todos os direitos reservados.
        </p>
      </motion.div>
    </div>
  );
}
