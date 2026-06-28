"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionCard } from "@/components/section-card";
import { ValueCell } from "@/components/source-badge";
import { copy } from "@/lib/copy";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

export function ForecastSection({
  forecast,
  currentMonthIndex,
}: {
  forecast: DashboardData["forecast"];
  currentMonthIndex: number;
}) {
  const chartData = forecast.months.map((month) => ({
    label: month.label,
    students: month.students.value,
    isActual: month.isActual,
  }));

  const actualData = chartData.filter((point) => point.isActual);
  const upcomingData = chartData.filter((point) => !point.isActual);
  const bridgePoint = actualData.at(-1);
  const upcomingLine =
    bridgePoint && upcomingData.length > 0
      ? [bridgePoint, ...upcomingData]
      : upcomingData;

  return (
    <SectionCard
      title={copy.sections.forecast}
      hint={copy.sections.forecastHint}
    >
      <p className="-mt-2 mb-3 text-xs text-slate-500 print:hidden">
        {copy.sections.forecastLegend}
      </p>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 font-medium">{copy.forecastTable.month}</th>
                <th className="pb-2 font-medium">{copy.forecastTable.students}</th>
                <th className="pb-2 font-medium">{copy.forecastTable.tuition}</th>
                <th className="pb-2 font-medium">{copy.forecastTable.expenses}</th>
                <th className="pb-2 font-medium">{copy.forecastTable.netCashFlow}</th>
                <th className="pb-2 font-medium">{copy.forecastTable.cashBalance}</th>
              </tr>
            </thead>
            <tbody>
              {forecast.months.map((month) => (
                <tr
                  key={month.monthOffset}
                  className={`border-b border-slate-100 ${
                    month.monthOffset === currentMonthIndex ? "bg-blue-50/80" : ""
                  }`}
                >
                  <td className="py-2.5 font-medium text-slate-800">
                    {month.label}
                    {month.monthOffset === currentMonthIndex ? (
                      <span className="ml-2 text-xs font-normal text-blue-700">
                        (current)
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2.5">
                    <ValueCell
                      value={month.students.value}
                      source={month.students.source}
                      explain={month.students.explain}
                      formatted={formatNumber(month.students.value)}
                    />
                  </td>
                  <td className="py-2.5">
                    <ValueCell
                      value={month.tuitionRevenue.value}
                      source={month.tuitionRevenue.source}
                      explain={month.tuitionRevenue.explain}
                      formatted={formatCurrency(month.tuitionRevenue.value)}
                    />
                  </td>
                  <td className="py-2.5">
                    <ValueCell
                      value={month.totalExpenses.value}
                      source={month.totalExpenses.source}
                      explain={month.totalExpenses.explain}
                      formatted={formatCurrency(month.totalExpenses.value)}
                    />
                  </td>
                  <td className="py-2.5 text-slate-700">
                    {formatCurrency(month.netCashFlow)}
                  </td>
                  <td className="py-2.5 text-slate-700">
                    {formatCurrency(month.cashBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="h-52 print:h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                allowDuplicatedCategory={false}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} width={32} />
              <Tooltip />
              <Legend />
              <Line
                name={copy.chart.actualStudents}
                data={actualData}
                type="monotone"
                dataKey="students"
                stroke="#1d4ed8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                name={copy.chart.forecastStudents}
                data={upcomingLine}
                type="monotone"
                dataKey="students"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionCard>
  );
}
