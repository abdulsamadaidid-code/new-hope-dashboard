"use client";

import { useCallback, useState } from "react";
import { ActionItems } from "@/components/action-items";
import { AdmissionsTracker } from "@/components/admissions-tracker";
import { DashboardEditor } from "@/components/dashboard-editor";
import { EnrollmentSection } from "@/components/enrollment-section";
import { FinancialSection } from "@/components/financial-section";
import { ForecastSection } from "@/components/forecast-section";
import { KpiCards } from "@/components/kpi-cards";
import { formatGeneratedAt } from "@/lib/format";
import type { DashboardData, DashboardSource } from "@/lib/types";

export function DashboardShell({
  initialSource,
  initialData,
}: {
  initialSource: DashboardSource;
  initialData: DashboardData;
}) {
  const [source, setSource] = useState(initialSource);
  const [data, setData] = useState(initialData);
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
        error?: string;
      };

      if (!response.ok || !payload.source || !payload.data) {
        throw new Error(payload.error ?? "Failed to save dashboard data.");
      }

      setSource(payload.source);
      setData(payload.data);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save dashboard data.",
      );
    } finally {
      setSaving(false);
    }
  }, []);

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
        <DashboardEditor source={source} onSave={handleSave} saving={saving} />

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 print:hidden">
            {error}
          </p>
        ) : null}

        <KpiCards kpis={data.kpis} />

        <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2 print:gap-3">
          <EnrollmentSection enrollment={data.enrollment} />
          <FinancialSection financial={data.financial} />
        </div>

        <ForecastSection
          forecast={data.forecast}
          currentMonthIndex={data.currentMonth.index}
        />

        <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2 print:gap-3">
          <AdmissionsTracker admissions={data.admissions} />
          <ActionItems items={data.actionItems} />
        </div>
      </div>
    </main>
  );
}
