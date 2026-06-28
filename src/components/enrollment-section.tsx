"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

export function EnrollmentSection({
  enrollment,
}: {
  enrollment: DashboardData["enrollment"];
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm print:shadow-none">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
        Enrollment
      </h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 font-medium">Grade</th>
              <th className="pb-2 font-medium">Current</th>
              <th className="pb-2 font-medium">Target</th>
            </tr>
          </thead>
          <tbody>
            {enrollment.byGrade.map((row) => (
              <tr key={row.grade} className="border-b border-slate-100">
                <td className="py-2 text-slate-800">{row.grade}</td>
                <td className="py-2 font-medium text-slate-900">
                  {formatNumber(row.current)}
                </td>
                <td className="py-2 text-slate-700">
                  {formatNumber(row.target)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="h-44 print:h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={enrollment.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={28} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="students"
                stroke="#1d4ed8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
