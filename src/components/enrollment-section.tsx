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
import { copy } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

export function EnrollmentSection({
  enrollment,
}: {
  enrollment: DashboardData["enrollment"];
}) {
  const actualData = enrollment.trend.filter((point) => point.isActual);
  const upcomingData = enrollment.trend.filter((point) => !point.isActual);
  const bridgePoint = actualData.at(-1);
  const upcomingLine =
    bridgePoint && upcomingData.length > 0
      ? [bridgePoint, ...upcomingData]
      : upcomingData;

  return (
    <SectionCard
      title={copy.sections.enrollment}
      hint={copy.sections.enrollmentHint}
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 font-medium">Grade</th>
              <th className="pb-2 font-medium">{copy.editor.fields.current}</th>
              <th className="pb-2 font-medium">{copy.editor.fields.target}</th>
            </tr>
          </thead>
          <tbody>
            {enrollment.byGrade.map((row) => (
              <tr key={row.grade} className="border-b border-slate-100">
                <td className="py-2.5 text-slate-800">{row.grade}</td>
                <td className="py-2.5 font-medium text-slate-900">
                  {formatNumber(row.current)}
                </td>
                <td className="py-2.5 text-slate-700">
                  {formatNumber(row.target)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="h-44 print:h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="month"
                allowDuplicatedCategory={false}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} width={28} />
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
