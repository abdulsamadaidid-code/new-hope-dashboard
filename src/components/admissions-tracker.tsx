import { SectionCard } from "@/components/section-card";
import { copy } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

const rows = [
  { key: "inquiries", label: copy.admissions.inquiries },
  { key: "schoolVisits", label: copy.admissions.schoolVisits },
  { key: "applications", label: copy.admissions.applications },
  { key: "studentsAdmitted", label: copy.admissions.studentsAdmitted },
  { key: "studentsEnrolled", label: copy.admissions.studentsEnrolled },
] as const;

export function AdmissionsTracker({
  admissions,
}: {
  admissions: DashboardData["admissions"];
}) {
  return (
    <SectionCard
      title={copy.sections.admissions}
      hint={copy.sections.admissionsHint}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="pb-2 font-medium">Stage</th>
            <th className="pb-2 text-right font-medium">
              {copy.editor.fields.thisWeek}
            </th>
            <th className="pb-2 text-right font-medium">
              {copy.editor.fields.thisMonth}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, label }) => (
            <tr key={key} className="border-b border-slate-100">
              <td className="py-2.5 text-slate-800">{label}</td>
              <td className="py-2.5 text-right font-medium text-slate-900">
                {formatNumber(admissions[key].week)}
              </td>
              <td className="py-2.5 text-right font-medium text-slate-900">
                {formatNumber(admissions[key].month)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}
