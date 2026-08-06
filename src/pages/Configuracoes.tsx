import { useState } from "react";
import { User, Mail, MessageCircle, Bell } from "lucide-react";
import { useApp } from "@/store/AppContext";
import { useToast } from "@/components/ui/Toast";
import { Toggle } from "@/components/ui/Toggle";
import { Save } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "email", label: "E-mail", icon: Mail },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "alertas", label: "Alertas", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Configuracoes() {
  const { usuario, setUsuario } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState<TabId>("perfil");
  const [perfil, setPerfil] = useState(usuario);

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

  const salvar = () => {
    if (tab === "perfil") setUsuario(perfil);
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
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nome completo</label>
              <input value={perfil.nome} onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">OAB</label>
              <input value={perfil.oab} onChange={(e) => setPerfil({ ...perfil, oab: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">E-mail profissional</label>
              <input value={perfil.email} onChange={(e) => setPerfil({ ...perfil, email: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input value={perfil.telefone} onChange={(e) => setPerfil({ ...perfil, telefone: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Escritório</label>
              <input value={perfil.escritorio} onChange={(e) => setPerfil({ ...perfil, escritorio: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">UF de atuação</label>
              <input value={perfil.uf} onChange={(e) => setPerfil({ ...perfil, uf: e.target.value })} className="input" />
            </div>
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
              <input value={zapi.numero} onChange={(e) => setZapi({ ...zapi, numero: e.target.value })} placeholder="(98) 90000-0000" className="input" />
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
