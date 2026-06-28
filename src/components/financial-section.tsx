"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionCard } from "@/components/section-card";
import { copy } from "@/lib/copy";
import { formatCurrency } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

const rows = [
  { key: "totalMonthlyIncome", label: copy.financial.income },
  { key: "totalMonthlyExpenses", label: copy.financial.expenses },
  { key: "netCashFlow", label: copy.financial.netCashFlow },
  { key: "endingCashBalance", label: copy.financial.cashBalance },
] as const;

export function FinancialSection({
  financial,
}: {
  financial: DashboardData["financial"];
}) {
  const chartData = financial.incomeVsExpenses.map((item) => ({
    ...item,
    name: item.name === "Income" ? copy.chart.income : copy.chart.expenses,
  }));

  return (
    <SectionCard
      title={copy.sections.financial}
      hint={copy.sections.financialHint}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <dl className="space-y-3 text-sm">
          {rows.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center justify-between border-b border-slate-100 pb-2"
            >
              <dt className="text-slate-600">{label}</dt>
              <dd className="font-semibold text-slate-900">
                {formatCurrency(financial[key])}
              </dd>
            </div>
          ))}
        </dl>
        <div className="h-44 print:h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionCard>
  );
}
