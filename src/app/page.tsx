import { ActionItems } from "@/components/action-items";
import { AdmissionsTracker } from "@/components/admissions-tracker";
import { EnrollmentSection } from "@/components/enrollment-section";
import { FinancialSection } from "@/components/financial-section";
import { KpiCards } from "@/components/kpi-cards";
import { formatGeneratedAt } from "@/lib/format";
import { loadDashboard } from "@/lib/load-dashboard";

export const dynamic = "force-static";

export default function Home() {
  const data = loadDashboard();

  return (
    <main className="dashboard-page mx-auto max-w-7xl flex-1 px-4 py-6 print:max-w-none print:px-2 print:py-2">
      <header className="mb-5 border-b border-slate-200 pb-4 text-center print:mb-3 print:pb-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 print:text-xl">
          New Hope Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {data.currentMonth.label} · Updated {formatGeneratedAt(data.generatedAt)}
        </p>
      </header>

      <div className="space-y-4 print:space-y-3">
        <KpiCards kpis={data.kpis} />

        <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2 print:gap-3">
          <EnrollmentSection enrollment={data.enrollment} />
          <FinancialSection financial={data.financial} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2 print:gap-3">
          <AdmissionsTracker admissions={data.admissions} />
          <ActionItems items={data.actionItems} />
        </div>
      </div>
    </main>
  );
}
