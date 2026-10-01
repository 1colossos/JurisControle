/* ============================================================
   Gráficos do dashboard financeiro (Recharts): barras Receitas ×
   Despesas (6 meses) e rosca de despesas por categoria. Paleta
   categórica validada para daltonismo nos dois temas; a rosca
   carrega rótulos diretos (exigência de contraste no tema claro).
   ============================================================ */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "@/store/AppContext";
import { moeda } from "@/lib/format";
import type { FatiaCategoria, PontoMensal } from "@/lib/financeiro";

/** Paleta categórica validada (CVD ΔE ≥ 8 nos pares adjacentes, ambos os temas). */
const CORES = {
  light: { receitas: "#2a78d6", despesas: "#eb6834", fatias: ["#2a78d6", "#eb6834", "#1baf7a"], surface: "#ffffff", grid: "#e6e9f1", texto: "#8a93a6" },
  dark: { receitas: "#3987e5", despesas: "#d95926", fatias: ["#3987e5", "#d95926", "#199e70"], surface: "#131b2e", grid: "#252f48", texto: "#7a869e" },
};

function CardTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string; payload?: FatiaCategoria }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-lift">
      {label && <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-body-2">{p.payload?.label ?? p.name}</span>
          <span className="ml-auto pl-4 font-semibold text-body">{moeda(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function LegendaChip({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-body-2">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: cor }} />
      {children}
    </span>
  );
}

const eixoMoedaCurta = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)} mil` : String(v));

export function GraficoReceitasDespesas({ dados }: { dados: PontoMensal[] }) {
  const { tema } = useApp();
  const c = CORES[tema];
  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg">Receitas × Despesas</h3>
          <p className="text-sm text-muted">Últimos 6 meses, por mês de vencimento</p>
        </div>
        <div className="flex gap-4">
          <LegendaChip cor={c.receitas}>Receitas</LegendaChip>
          <LegendaChip cor={c.despesas}>Despesas</LegendaChip>
        </div>
      </div>
      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} barGap={4} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} strokeWidth={1} />
            <XAxis dataKey="mes" tickLine={false} axisLine={{ stroke: c.grid }} tick={{ fill: c.texto, fontSize: 12 }} />
            <YAxis tickFormatter={eixoMoedaCurta} tickLine={false} axisLine={false} tick={{ fill: c.texto, fontSize: 12 }} width={44} />
            <Tooltip cursor={{ fill: c.grid, opacity: 0.35 }} content={<CardTooltip />} />
            <Bar dataKey="receitas" name="Receitas" fill={c.receitas} radius={[4, 4, 0, 0]} maxBarSize={26} />
            <Bar dataKey="despesas" name="Despesas" fill={c.despesas} radius={[4, 4, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function GraficoDespesasCategoria({ fatias }: { fatias: FatiaCategoria[] }) {
  const { tema } = useApp();
  const c = CORES[tema];
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  return (
    <div className="card p-6">
      <h3 className="text-lg">Despesas por categoria</h3>
      <p className="text-sm text-muted">Acumulado do semestre (operacionais + custas)</p>
      <div className="mt-2 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Pie
              data={fatias}
              dataKey="valor"
              nameKey="label"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke={c.surface}
              strokeWidth={2}
              labelLine={false}
              label={({ cx, cy, midAngle, outerRadius, percent }) => {
                const ang = (-(midAngle ?? 0) * Math.PI) / 180;
                const r = (outerRadius as number) + 14;
                const x = (cx as number) + r * Math.cos(ang);
                const y = (cy as number) + r * Math.sin(ang);
                return (
                  <text
                    x={x}
                    y={y}
                    fill={c.texto}
                    fontSize={12}
                    textAnchor={x > (cx as number) ? "start" : "end"}
                    dominantBaseline="central"
                  >
                    {Math.round((percent ?? 0) * 100)}%
                  </text>
                );
              }}
            >
              {fatias.map((f, i) => (
                <Cell key={f.categoria} fill={c.fatias[i % c.fatias.length]} />
              ))}
            </Pie>
            <Tooltip content={<CardTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Rótulos diretos com valores: identidade nunca depende só da cor. */}
      <ul className="mt-3 space-y-2">
        {fatias.map((f, i) => (
          <li key={f.categoria} className="flex items-center gap-2.5 text-sm">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.fatias[i % c.fatias.length] }} />
            <span className="text-body-2">{f.label}</span>
            <span className="ml-auto font-semibold text-body">{moeda(f.valor)}</span>
            <span className="w-10 text-right text-xs text-muted">
              {total > 0 ? Math.round((f.valor / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
