"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import type { DashboardSource, ForecastMonth } from "@/lib/types";

const admissionsRows = [
  { key: "inquiries", label: "Inquiries" },
  { key: "schoolVisits", label: "School Visits" },
  { key: "applications", label: "Applications" },
  { key: "studentsAdmitted", label: "Students Admitted" },
  { key: "studentsEnrolled", label: "Students Enrolled" },
] as const;

function NumberInput({
  value,
  onChange,
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value) || 0)}
      className={`w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 ${className}`}
    />
  );
}

export function DashboardEditor({
  source,
  onSave,
  saving,
}: {
  source: DashboardSource;
  onSave: (source: DashboardSource) => Promise<void>;
  saving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DashboardSource>(source);

  const hasChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(source),
    [draft, source],
  );

  function updateGrade(
    index: number,
    field: "current" | "target",
    value: number,
  ) {
    setDraft((prev) => ({
      ...prev,
      enrollmentByGrade: prev.enrollmentByGrade.map((grade, gradeIndex) =>
        gradeIndex === index ? { ...grade, [field]: value } : grade,
      ),
    }));
  }

  function updateAdmission(
    key: (typeof admissionsRows)[number]["key"],
    period: "week" | "month",
    value: number,
  ) {
    setDraft((prev) => ({
      ...prev,
      admissions: {
        ...prev.admissions,
        [key]: {
          ...prev.admissions[key],
          [period]: value,
        },
      },
    }));
  }

  function updateForecast(
    index: number,
    field: keyof Pick<ForecastMonth, "students" | "tuitionRevenue" | "totalExpenses">,
    value: number,
  ) {
    setDraft((prev) => ({
      ...prev,
      forecastMonths: prev.forecastMonths.map((month, monthIndex) =>
        monthIndex === index ? { ...month, [field]: value } : month,
      ),
    }));
  }

  function updateAssumption(
    field: keyof DashboardSource["assumptions"],
    value: number,
  ) {
    setDraft((prev) => ({
      ...prev,
      assumptions: {
        ...prev.assumptions,
        [field]: value,
      },
    }));
  }

  async function handleSave() {
    await onSave(draft);
    setOpen(false);
  }

  return (
    <section className="print:hidden">
      <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Update dashboard data
            </h2>
            <p className="text-xs text-slate-600">
              Edits save to Vercel Edge Config and appear immediately — no rebuild.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft(source);
              setOpen((value) => !value);
            }}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            {open ? "Close editor" : "Edit data"}
          </button>
        </div>

        {open ? (
          <div className="mt-4 space-y-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-white p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Enrollment by grade
                </h3>
                <table className="mt-2 w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2">Grade</th>
                      <th className="pb-2">Current</th>
                      <th className="pb-2">Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.enrollmentByGrade.map((grade, index) => (
                      <tr key={grade.grade}>
                        <td className="py-1 pr-2 text-slate-800">{grade.grade}</td>
                        <td className="py-1 pr-2">
                          <NumberInput
                            value={grade.current}
                            onChange={(value) => updateGrade(index, "current", value)}
                          />
                        </td>
                        <td className="py-1">
                          <NumberInput
                            value={grade.target}
                            onChange={(value) => updateGrade(index, "target", value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-md border border-slate-200 bg-white p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Admissions counts
                </h3>
                <table className="mt-2 w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2">Metric</th>
                      <th className="pb-2">This week</th>
                      <th className="pb-2">This month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admissionsRows.map(({ key, label }) => (
                      <tr key={key}>
                        <td className="py-1 pr-2 text-slate-800">{label}</td>
                        <td className="py-1 pr-2">
                          <NumberInput
                            value={draft.admissions[key].week}
                            onChange={(value) => updateAdmission(key, "week", value)}
                          />
                        </td>
                        <td className="py-1">
                          <NumberInput
                            value={draft.admissions[key].month}
                            onChange={(value) => updateAdmission(key, "month", value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Assumptions
              </h3>
              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm text-slate-700">
                  Average tuition
                  <NumberInput
                    className="mt-1"
                    value={draft.assumptions.averageTuition}
                    onChange={(value) => updateAssumption("averageTuition", value)}
                  />
                </label>
                <label className="text-sm text-slate-700">
                  Collection rate
                  <NumberInput
                    className="mt-1"
                    value={draft.assumptions.collectionRate}
                    onChange={(value) => updateAssumption("collectionRate", value)}
                  />
                </label>
                <label className="text-sm text-slate-700">
                  Owner funding / month
                  <NumberInput
                    className="mt-1"
                    value={draft.assumptions.monthlyOwnerFunding}
                    onChange={(value) =>
                      updateAssumption("monthlyOwnerFunding", value)
                    }
                  />
                </label>
                <label className="text-sm text-slate-700">
                  Monthly salaries
                  <NumberInput
                    className="mt-1"
                    value={draft.assumptions.totalMonthlySalaries}
                    onChange={(value) =>
                      updateAssumption("totalMonthlySalaries", value)
                    }
                  />
                </label>
              </div>
              <label className="mt-3 block text-sm text-slate-700">
                Current reporting month
                <select
                  value={draft.currentMonthIndex}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      currentMonthIndex: Number(event.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                >
                  {draft.forecastMonths.map((month, index) => (
                    <option key={month.monthOffset} value={index}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                12-month forecast
              </h3>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2">Month</th>
                      <th className="pb-2">Students</th>
                      <th className="pb-2">Tuition revenue</th>
                      <th className="pb-2">Expenses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.forecastMonths.map((month, index) => (
                      <tr key={month.monthOffset}>
                        <td className="py-1 pr-2 text-slate-800">{month.label}</td>
                        <td className="py-1 pr-2">
                          <NumberInput
                            value={month.students}
                            onChange={(value) =>
                              updateForecast(index, "students", value)
                            }
                          />
                        </td>
                        <td className="py-1 pr-2">
                          <NumberInput
                            value={month.tuitionRevenue}
                            onChange={(value) =>
                              updateForecast(index, "tuitionRevenue", value)
                            }
                          />
                        </td>
                        <td className="py-1">
                          <NumberInput
                            value={month.totalExpenses}
                            onChange={(value) =>
                              updateForecast(index, "totalExpenses", value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={saving || !hasChanges}
                onClick={handleSave}
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setDraft(source)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
              <p className="text-xs text-slate-500">
                Current month expenses:{" "}
                {formatCurrency(
                  draft.forecastMonths[draft.currentMonthIndex]?.totalExpenses ?? 0,
                )}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
