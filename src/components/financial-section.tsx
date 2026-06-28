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
import { formatCurrency } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

const rows = [
  { key: "totalMonthlyIncome", label: "Total Monthly Income" },
  { key: "totalMonthlyExpenses", label: "Total Monthly Expenses" },
  { key: "netCashFlow", label: "Net Cash Flow" },
  { key: "endingCashBalance", label: "Ending Cash Balance" },
] as const;

export function FinancialSection({
  financial,
}: {
  financial: DashboardData["financial"];
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm print:shadow-none">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
        Financial Health
      </h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <dl className="space-y-2 text-sm">
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
            <BarChart data={financial.incomeVsExpenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
