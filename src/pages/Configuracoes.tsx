import { useRef, useState } from "react";
import { User, Mail, MessageCircle, Bell, Palette, Camera, Trash2, Sun, Moon, Save } from "lucide-react";
import { useApp } from "@/store/AppContext";
import { useToast } from "@/components/ui/Toast";
import { Toggle } from "@/components/ui/Toggle";
import { cn } from "@/lib/cn";
import { iniciais } from "@/lib/format";
import { AREAS_ATUACAO } from "@/data/seed";
import { UFS, maskTelefone, validarEmail, validarNomeCompleto, validarTelefone } from "@/lib/validators";

const TABS = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "aparencia", label: "Aparência", icon: Palette },
  { id: "email", label: "E-mail", icon: Mail },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "alertas", label: "Alertas", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

const FOTO_MAX = 3 * 1024 * 1024; // 3 MB

export function Configuracoes() {
  const { usuario, setUsuario, tema, setTema } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState<TabId>("perfil");
  const [perfil, setPerfil] = useState(usuario);
  const inputFoto = useRef<HTMLInputElement>(null);

  const [smtp, setSmtp] = useState({
    servidor: "smtp.escritorio.adv.br",
    porta: "587",
    usuario: usuario.email,
    senha: "",
  });
  const [zapi, setZapi] = useState({ instancia: "", token: "", numero: "" });
  const [alertas, setAlertas] = useState({
    email: true,
    whatsapp: true,
    app: true,
    resumoDiario: false,
    criticos: true,
  });

  const escolherFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Escolha um arquivo de imagem (PNG, JPG…).", "warning");
      return;
    }
    if (file.size > FOTO_MAX) {
      toast("A foto deve ter no máximo 3 MB.", "warning");
      return;
    }
    if (perfil.foto) URL.revokeObjectURL(perfil.foto);
    setPerfil({ ...perfil, foto: URL.createObjectURL(file) });
  };

  const removerFoto = () => {
    if (perfil.foto) URL.revokeObjectURL(perfil.foto);
    setPerfil({ ...perfil, foto: undefined });
  };

  const toggleArea = (a: string) =>
    setPerfil((p) => ({
      ...p,
      areas: p.areas.includes(a) ? p.areas.filter((x) => x !== a) : [...p.areas, a],
    }));

  const salvar = () => {
    if (tab === "perfil") {
      if (!validarNomeCompleto(perfil.nome)) {
        toast("Informe o nome completo (nome e sobrenome).", "warning");
        return;
      }
      if (!validarEmail(perfil.email.trim())) {
        toast("Informe um e-mail profissional válido.", "warning");
        return;
      }
      if (!validarTelefone(perfil.telefone)) {
        toast("Informe um telefone com DDD, ex.: (11) 98888-7766.", "warning");
        return;
      }
      setUsuario(perfil);
    }
    toast("Configurações salvas com sucesso.");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex justify-end">
        <button onClick={salvar} className="btn-primary">
          <Save size={16} /> Salvar alterações
        </button>
      </div>

      {/* Tabs */}
      <div className="card flex flex-wrap gap-1 p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition",
              tab === t.id ? "bg-canvas text-ink shadow-soft" : "text-body-2 hover:text-ink",
            )}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "perfil" && (
        <section className="card animate-fade-up p-6">
          <h3 className="text-lg">Dados do advogado</h3>
          <p className="text-sm text-muted">Informações pessoais e profissionais</p>

          {/* Foto de perfil */}
          <div className="mt-5 flex items-center gap-4">
            {perfil.foto ? (
              <img
                src={perfil.foto}
                alt={perfil.nome}
                className="h-20 w-20 rounded-full object-cover ring-2 ring-line"
              />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-full bg-navy-900 text-xl font-semibold text-white">
                {iniciais(perfil.nome)}
              </span>
            )}
            <div className="space-y-2">
              <button onClick={() => inputFoto.current?.click()} className="btn-ghost">
                <Camera size={15} /> {perfil.foto ? "Trocar foto" : "Anexar foto de perfil"}
              </button>
              {perfil.foto && (
                <button onClick={removerFoto} className="ml-2 btn-danger">
                  <Trash2 size={15} /> Remover
                </button>
              )}
              <p className="text-xs text-muted">PNG ou JPG, até 3 MB. Salve para aplicar.</p>
              <input
                ref={inputFoto}
                type="file"
                accept="image/*"
                onChange={escolherFoto}
                className="hidden"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nome completo</label>
              <input value={perfil.nome} onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })} maxLength={120} className="input" />
            </div>
            <div>
              <label className="label">OAB</label>
              <input value={perfil.oab} onChange={(e) => setPerfil({ ...perfil, oab: e.target.value })} maxLength={20} className="input" />
            </div>
            <div>
              <label className="label">E-mail profissional</label>
              <input value={perfil.email} onChange={(e) => setPerfil({ ...perfil, email: e.target.value })} maxLength={254} className="input" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input value={perfil.telefone} onChange={(e) => setPerfil({ ...perfil, telefone: maskTelefone(e.target.value) })} className="input" />
            </div>
            <div>
              <label className="label">Data de nascimento</label>
              <input type="date" value={perfil.dataNascimento} onChange={(e) => setPerfil({ ...perfil, dataNascimento: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">UF de atuação</label>
              <select value={perfil.uf} onChange={(e) => setPerfil({ ...perfil, uf: e.target.value })} className="input">
                {UFS.map((uf) => (
                  <option key={uf}>{uf}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Escritório (opcional)</label>
              <input value={perfil.escritorio} onChange={(e) => setPerfil({ ...perfil, escritorio: e.target.value })} maxLength={120} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Áreas de atuação</label>
              <div className="flex flex-wrap gap-2">
                {AREAS_ATUACAO.map((a) => {
                  const on = perfil.areas.includes(a);
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
            </div>
          </div>
        </section>
      )}

      {tab === "aparencia" && (
        <section className="card animate-fade-up p-6">
          <h3 className="text-lg">Tema do sistema</h3>
          <p className="text-sm text-muted">
            Um bônus do JurisControle: escolha entre o tema oficial (claro) e o tema escuro.
            A preferência fica salva neste dispositivo.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setTema("light")}
              className={cn(
                "rounded-xl border-2 p-5 text-left transition",
                tema === "light" ? "border-gold bg-gold-bg" : "border-line-2 hover:bg-canvas",
              )}
            >
              <span className="flex items-center gap-2 font-semibold text-body">
                <Sun size={18} className="text-gold-600" /> Tema claro (oficial)
              </span>
              <span className="mt-1 block text-xs text-body-2">
                Visual padrão do JurisControle, com fundo claro e alto contraste.
              </span>
              <span className="mt-3 flex gap-1.5">
                <span className="h-6 w-10 rounded-md border border-line-2 bg-[#f4f6fa]" />
                <span className="h-6 w-10 rounded-md border border-line-2 bg-white" />
                <span className="h-6 w-10 rounded-md bg-[#0e1a36]" />
                <span className="h-6 w-10 rounded-md bg-[#e0a83a]" />
              </span>
            </button>
            <button
              onClick={() => setTema("dark")}
              className={cn(
                "rounded-xl border-2 p-5 text-left transition",
                tema === "dark" ? "border-gold bg-gold-bg" : "border-line-2 hover:bg-canvas",
              )}
            >
              <span className="flex items-center gap-2 font-semibold text-body">
                <Moon size={18} className="text-medio" /> Tema escuro
              </span>
              <span className="mt-1 block text-xs text-body-2">
                Reduz o brilho da tela — ideal para longas jornadas e ambientes escuros.
              </span>
              <span className="mt-3 flex gap-1.5">
                <span className="h-6 w-10 rounded-md bg-[#0a101e]" />
                <span className="h-6 w-10 rounded-md bg-[#131b2e]" />
                <span className="h-6 w-10 rounded-md border border-[#2f3b58] bg-[#252f48]" />
                <span className="h-6 w-10 rounded-md bg-[#e0a83a]" />
              </span>
            </button>
          </div>
        </section>
      )}

      {tab === "email" && (
        <section className="card animate-fade-up p-6">
          <h3 className="text-lg">Configuração de e-mail (SMTP)</h3>
          <p className="text-sm text-muted">Servidor usado para o envio das notificações por e-mail</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Servidor SMTP</label>
              <input value={smtp.servidor} onChange={(e) => setSmtp({ ...smtp, servidor: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Porta</label>
              <input value={smtp.porta} onChange={(e) => setSmtp({ ...smtp, porta: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Usuário</label>
              <input value={smtp.usuario} onChange={(e) => setSmtp({ ...smtp, usuario: e.target.value })} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Senha / Token</label>
              <input type="password" value={smtp.senha} onChange={(e) => setSmtp({ ...smtp, senha: e.target.value })} placeholder="••••••••••••" className="input" />
            </div>
          </div>
          <button onClick={() => toast("E-mail de teste enviado.", "info")} className="btn-ghost mt-5">
            Enviar e-mail de teste
          </button>
        </section>
      )}

      {tab === "whatsapp" && (
        <section className="card animate-fade-up p-6">
          <h3 className="text-lg">Integração WhatsApp (Z-API)</h3>
          <p className="text-sm text-muted">Chaves de acesso para o disparo de mensagens via Z-API</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">ID da instância</label>
              <input value={zapi.instancia} onChange={(e) => setZapi({ ...zapi, instancia: e.target.value })} placeholder="3D1F..." className="input font-mono" />
            </div>
            <div>
              <label className="label">Número remetente</label>
              <input value={zapi.numero} onChange={(e) => setZapi({ ...zapi, numero: maskTelefone(e.target.value) })} placeholder="(98) 90000-0000" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Token</label>
              <input type="password" value={zapi.token} onChange={(e) => setZapi({ ...zapi, token: e.target.value })} placeholder="••••••••••••••••••••" className="input font-mono" />
            </div>
          </div>
          <button onClick={() => toast("Mensagem de teste enviada via Z-API.", "info")} className="btn-ghost mt-5">
            Testar conexão
          </button>
        </section>
      )}

      {tab === "alertas" && (
        <section className="card animate-fade-up divide-y divide-line p-6 [&>*]:py-4 first:[&>*]:pt-0 last:[&>*]:pb-0">
          <div>
            <h3 className="text-lg">Notificações globais</h3>
            <p className="text-sm text-muted">Ative ou desative os canais e regras de alerta</p>
          </div>
          <Toggle checked={alertas.email} onChange={(v) => setAlertas({ ...alertas, email: v })} label="Notificações por e-mail" desc="Envia lembretes de prazos pelo SMTP configurado" />
          <Toggle checked={alertas.whatsapp} onChange={(v) => setAlertas({ ...alertas, whatsapp: v })} label="Notificações por WhatsApp" desc="Dispara mensagens automáticas via Z-API" />
          <Toggle checked={alertas.app} onChange={(v) => setAlertas({ ...alertas, app: v })} label="Notificações no aplicativo" desc="Alertas exibidos dentro do JurisControle" />
          <Toggle checked={alertas.criticos} onChange={(v) => setAlertas({ ...alertas, criticos: v })} label="Alerta extra para prazos críticos" desc="Reforça avisos quando faltam ≤ 3 dias úteis" />
          <Toggle checked={alertas.resumoDiario} onChange={(v) => setAlertas({ ...alertas, resumoDiario: v })} label="Resumo diário" desc="Recebe um panorama das pendências toda manhã" />
        </section>
      )}

      <p className="text-center text-xs text-muted">
        As configurações são aplicadas para todos os processos monitorados pelo escritório.
      </p>
    </div>
  );
}
