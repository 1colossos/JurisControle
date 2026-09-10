import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MailCheck, Send } from "lucide-react";
import { Logo } from "@/components/Brand";
import { maskCPF, somenteDigitos, validarCPF, validarEmail } from "@/lib/validators";

export function EsqueciSenha() {
  const [credencial, setCredencial] = useState("");
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);

  const onCredencial = (v: string) => {
    setCredencial(/^[\d.-]*$/.test(v) && somenteDigitos(v).length > 0 ? maskCPF(v) : v);
  };

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarCPF(credencial) && !validarEmail(credencial.trim())) {
      setErro("Informe um CPF válido (000.000.000-00) ou um e-mail válido.");
      return;
    }
    setErro("");
    setEnviado(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={64} />
          <h1 className="mt-4 text-2xl">Recuperar senha</h1>
          <p className="mt-1 text-sm text-muted">
            Informe seu CPF ou e-mail e enviaremos um link para redefinir a senha.
          </p>
        </div>

        <div className="card p-7">
          {enviado ? (
            <div className="text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-baixo-bg text-baixo">
                <MailCheck size={22} />
              </span>
              <h2 className="mt-4 text-lg">Verifique seu e-mail</h2>
              <p className="mt-2 text-sm text-body-2">
                Se houver uma conta associada a <strong>{credencial}</strong>, você receberá em
                instantes um link para redefinição de senha. Confira também a caixa de spam.
              </p>
              <Link to="/" className="btn-primary mt-6 w-full">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={enviar} className="space-y-4" noValidate>
              <div>
                <label className="label">CPF ou e-mail cadastrado</label>
                <input
                  required
                  value={credencial}
                  onChange={(e) => onCredencial(e.target.value)}
                  className="input"
                  placeholder="000.000.000-00 ou voce@escritorio.adv.br"
                />
              </div>

              {erro && (
                <p className="rounded-xl bg-critico-bg px-3.5 py-2.5 text-xs font-medium text-critico">
                  {erro}
                </p>
              )}

              <button type="submit" className="btn-primary w-full">
                <Send size={16} /> Enviar link de recuperação
              </button>
            </form>
          )}
        </div>

        {!enviado && (
          <p className="mt-5 text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-body-2 hover:text-ink">
              <ArrowLeft size={16} /> Voltar para o login
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  );
}
