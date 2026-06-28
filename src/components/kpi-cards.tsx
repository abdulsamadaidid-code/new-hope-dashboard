import { SectionCard } from "@/components/section-card";
import { copy } from "@/lib/copy";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

const cards = [
  { key: "totalStudents", label: copy.kpi.totalStudents, format: formatNumber },
  { key: "tuitionRevenue", label: copy.kpi.tuitionRevenue, format: formatCurrency },
  { key: "totalExpenses", label: copy.kpi.totalExpenses, format: formatCurrency },
  { key: "netCashFlow", label: copy.kpi.netCashFlow, format: formatCurrency },
  { key: "cashBalance", label: copy.kpi.cashBalance, format: formatCurrency },
] as const;

export function KpiCards({ kpis }: { kpis: DashboardData["kpis"] }) {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-5 print:grid-cols-5 print:gap-2">
      {cards.map(({ key, label, format }) => (
        <article
          key={key}
          className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm print:rounded-lg print:shadow-none"
        >
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 print:text-xl">
            {format(kpis[key])}
          </p>
        </article>
      ))}
    </section>
  );
}
