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
    students: month.students,
    netCashFlow: month.netCashFlow,
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
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm print:shadow-none">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Upcoming Months Forecast
        </h2>
        <p className="text-xs text-slate-500">
          Solid = actual · Dashed = projected
        </p>
      </div>

      <div className="mt-3 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 font-medium">Month</th>
                <th className="pb-2 font-medium">Students</th>
                <th className="pb-2 font-medium">Tuition</th>
                <th className="pb-2 font-medium">Expenses</th>
                <th className="pb-2 font-medium">Net Cash Flow</th>
                <th className="pb-2 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {forecast.months.map((month) => (
                <tr
                  key={month.monthOffset}
                  className={`border-b border-slate-100 ${
                    month.monthOffset === currentMonthIndex
                      ? "bg-blue-50"
                      : ""
                  }`}
                >
                  <td className="py-2 font-medium text-slate-800">{month.label}</td>
                  <td className="py-2 text-slate-700">
                    {formatNumber(month.students)}
                  </td>
                  <td className="py-2 text-slate-700">
                    {formatCurrency(month.tuitionRevenue)}
                  </td>
                  <td className="py-2 text-slate-700">
                    {formatCurrency(month.totalExpenses)}
                  </td>
                  <td className="py-2 text-slate-700">
                    {formatCurrency(month.netCashFlow)}
                  </td>
                  <td className="py-2 text-slate-600">
                    {month.isActual ? "Actual" : "Forecast"}
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
                name="Students (actual)"
                data={actualData}
                type="monotone"
                dataKey="students"
                stroke="#1d4ed8"
                strokeWidth={2}
                dot={false}
              />
              <Line
                name="Students (forecast)"
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
    </section>
  );
}
