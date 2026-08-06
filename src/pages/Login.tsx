import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, ShieldCheck, Bell, CalendarClock } from "lucide-react";
import { Brand } from "@/components/Brand";
import { useApp } from "@/store/AppContext";

export function Login() {
  const { login, usuario } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("advogado@escritorio.adv.br");
  const [senha, setSenha] = useState("demonstracao");

  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    login();
    navigate("/app");
  };

  const entrarDemo = () => {
    login();
    navigate("/app");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Painel de marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(60rem 60rem at -10% -10%, rgba(224,168,58,.18), transparent 60%), radial-gradient(50rem 50rem at 110% 110%, rgba(59,91,219,.18), transparent 60%)",
          }}
        />
        <Brand dark className="relative" />

        <div className="relative max-w-md">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-serif text-4xl font-bold leading-tight text-white"
          >
            Nenhum prazo perdido.
            <span className="block text-gold">Toda atenção ao caso.</span>
          </motion.h2>
          <p className="mt-4 text-white/70">
            Controle inteligente de prazos processuais com contagem em dias úteis, alertas
            cromáticos de urgência e integração com calendários oficiais.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: CalendarClock, t: "Contagem automática em dias úteis" },
              { icon: Bell, t: "Lembretes por e-mail e WhatsApp" },
              { icon: ShieldCheck, t: "Dados processuais protegidos" },
            ].map(({ icon: Icon, t }, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 text-sm text-white/80"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-gold">
                  <Icon size={18} />
                </span>
                {t}
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">© 2026 JurisControle. Todos os direitos reservados.</p>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center bg-canvas px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          <h1 className="text-3xl">Entrar</h1>
          <p className="mt-1 text-sm text-muted">Acesso seguro à plataforma do escritório.</p>

          <form onSubmit={entrar} className="mt-8 space-y-5">
            <div>
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="voce@escritorio.adv.br"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="label mb-0">Senha</label>
                <button type="button" className="text-xs font-semibold text-gold-600 hover:underline">
                  Esqueci minha senha
                </button>
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
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full">
              Entrar <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Não possui conta?{" "}
            <button className="font-semibold text-ink hover:text-gold-600">Criar nova conta</button>
          </p>

          <div className="mt-8 border-t border-line pt-6 text-center">
            <button
              onClick={entrarDemo}
              className="text-sm font-semibold text-gold-600 hover:underline"
            >
              Ver demonstração →
            </button>
            <p className="mt-2 text-xs text-muted">
              Entra direto como {usuario.nome}, sem necessidade de senha.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
