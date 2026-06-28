import { formatNumber } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

const rows = [
  { key: "inquiries", label: "Inquiries" },
  { key: "schoolVisits", label: "School Visits" },
  { key: "applications", label: "Applications" },
  { key: "studentsAdmitted", label: "Students Admitted" },
  { key: "studentsEnrolled", label: "Students Enrolled" },
] as const;

export function AdmissionsTracker({
  admissions,
}: {
  admissions: DashboardData["admissions"];
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm print:shadow-none">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
        Admissions Tracker
      </h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="pb-2 font-medium">Metric</th>
            <th className="pb-2 text-right font-medium">This Week</th>
            <th className="pb-2 text-right font-medium">This Month</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, label }) => (
            <tr key={key} className="border-b border-slate-100">
              <td className="py-2 text-slate-800">{label}</td>
              <td className="py-2 text-right font-medium text-slate-900">
                {formatNumber(admissions[key].week)}
              </td>
              <td className="py-2 text-right font-medium text-slate-900">
                {formatNumber(admissions[key].month)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
