"use client";

import { useCallback, useState } from "react";
import { ActionItems } from "@/components/action-items";
import { AdmissionsTracker } from "@/components/admissions-tracker";
import { DashboardEditor } from "@/components/dashboard-editor";
import { EnrollmentSection } from "@/components/enrollment-section";
import { FinancialSection } from "@/components/financial-section";
import { ForecastSection } from "@/components/forecast-section";
import { KpiCards } from "@/components/kpi-cards";
import { copy, friendlyNotice } from "@/lib/copy";
import { formatGeneratedAt } from "@/lib/format";
import type { DashboardData, DashboardSource, ForecastNotice } from "@/lib/types";

export function DashboardShell({
  initialSource,
  initialData,
}: {
  initialSource: DashboardSource;
  initialData: DashboardData;
}) {
  const [source, setSource] = useState(initialSource);
  const [data, setData] = useState(initialData);
  const [notices, setNotices] = useState<ForecastNotice[]>(
    initialData.forecastNotices,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async (nextSource: DashboardSource) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSource),
      });

      const payload = (await response.json()) as {
        source?: DashboardSource;
        data?: DashboardData;
        notices?: ForecastNotice[];
        error?: string;
      };

      if (!response.ok || !payload.source || !payload.data) {
        throw new Error(payload.error ?? copy.errors.saveFailed);
      }

      setSource(payload.source);
      setData(payload.data);
      setNotices(payload.notices ?? payload.data.forecastNotices ?? []);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : copy.errors.saveFailed,
      );
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <main className="dashboard-page mx-auto max-w-7xl flex-1 px-4 py-6 print:max-w-none print:px-2 print:py-2 sm:px-6">
      <header className="mb-6 border-b border-slate-200 pb-5 text-center print:mb-3 print:pb-2">
        <p className="text-sm font-medium text-blue-800">{copy.site.subtitle}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 print:text-xl">
          {copy.site.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {copy.site.viewing(data.currentMonth.label)} ·{" "}
          {copy.site.lastUpdated(formatGeneratedAt(data.generatedAt))}
        </p>
      </header>

      <div className="space-y-5 print:space-y-3">
        <DashboardEditor source={source} onSave={handleSave} saving={saving} />

        {notices.length > 0 ? (
          <div className="space-y-2 print:hidden">
            {notices.map((notice) => (
              <p
                key={notice.message}
                className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${
                  notice.type === "cold_start"
                    ? "border-amber-200 bg-amber-50 text-amber-950"
                    : notice.type === "override_skipped"
                      ? "border-blue-200 bg-blue-50 text-blue-950"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {friendlyNotice(notice)}
              </p>
            ))}
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 print:hidden">
            {error}
          </p>
        ) : null}

        <KpiCards kpis={data.kpis} />

        <div className="grid gap-5 lg:grid-cols-2 print:grid-cols-2 print:gap-3">
          <EnrollmentSection enrollment={data.enrollment} />
          <FinancialSection financial={data.financial} />
        </div>

        <ForecastSection
          forecast={data.forecast}
          currentMonthIndex={data.currentMonth.index}
        />

        <div className="grid gap-5 lg:grid-cols-2 print:grid-cols-2 print:gap-3">
          <AdmissionsTracker admissions={data.admissions} />
          <ActionItems items={data.actionItems} />
        </div>
      </div>
    </main>
  );
}
