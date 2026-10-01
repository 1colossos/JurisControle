import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Users,
  Wallet,
  Settings,
  LogOut,
} from "lucide-react";
import { Brand } from "./Brand";
import { useApp } from "@/store/AppContext";
import { cn } from "@/lib/cn";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/processos", label: "Processos", icon: FileText },
  { to: "/app/clientes", label: "Clientes", icon: Users },
  { to: "/app/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useApp();
  const navigate = useNavigate();

  return (
    <aside className="flex h-full w-64 flex-col bg-navy-900 text-white/80">
      <div className="px-6 py-5">
        <Brand dark />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-gold text-ink shadow-soft"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
