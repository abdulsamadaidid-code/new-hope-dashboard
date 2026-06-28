import { formatCurrency, formatNumber } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

const cards = [
  { key: "totalStudents", label: "Total Students", format: formatNumber },
  { key: "tuitionRevenue", label: "Tuition Revenue", format: formatCurrency },
  { key: "totalExpenses", label: "Total Expenses", format: formatCurrency },
  { key: "netCashFlow", label: "Net Cash Flow", format: formatCurrency },
  { key: "cashBalance", label: "Cash Balance", format: formatCurrency },
] as const;

export function KpiCards({ kpis }: { kpis: DashboardData["kpis"] }) {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-5 print:grid-cols-5 print:gap-2">
      {cards.map(({ key, label, format }) => (
        <article
          key={key}
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm print:shadow-none"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 print:text-xl">
            {format(kpis[key])}
          </p>
        </article>
      ))}
    </section>
  );
}
