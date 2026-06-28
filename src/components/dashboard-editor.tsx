"use client";

import { useEffect, useMemo, useState } from "react";
import { SourceBadge } from "@/components/source-badge";
import { formatCurrency } from "@/lib/format";
import { createMonthValue } from "@/lib/forecast";
import type {
  DashboardSource,
  ExpenseCategory,
  ForecastMonthStored,
} from "@/lib/types";

const admissionsRows = [
  { key: "inquiries", label: "Inquiries" },
  { key: "schoolVisits", label: "School Visits" },
  { key: "applications", label: "Applications" },
  { key: "studentsAdmitted", label: "Students Admitted" },
  { key: "studentsEnrolled", label: "Students Enrolled" },
] as const;

type MetricField = "students" | "tuitionRevenue" | "totalExpenses";

function NumberInput({
  value,
  onChange,
  disabled = false,
  className = "",
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type="number"
      disabled={disabled}
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value) || 0)}
      className={`w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
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

  useEffect(() => {
    if (!open) setDraft(source);
  }, [source, open]);

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

  function updateMonthMetric(
    index: number,
    field: MetricField,
    value: number,
  ) {
    setDraft((prev) => {
      const month = prev.forecastMonths[index];
      const isActual = index <= prev.currentMonthIndex;
      const sourceTag = isActual ? "actual" : "manual_override";

      if (!isActual && field === "tuitionRevenue") {
        return prev;
      }

      return {
        ...prev,
        forecastMonths: prev.forecastMonths.map((item, itemIndex) => {
          if (itemIndex !== index) return item;
          return {
            ...item,
            [field]: createMonthValue(
              item.monthKey,
              value,
              sourceTag,
              isActual
                ? `Entered as ${field} for closed month`
                : `Pinned ${field} override`,
            ),
          };
        }),
      };
    });
  }

  function resetMonthMetric(index: number, field: MetricField) {
    setDraft((prev) => ({
      ...prev,
      forecastMonths: prev.forecastMonths.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        return {
          ...item,
          [field]: createMonthValue(
            item.monthKey,
            item[field].value,
            "forecast",
            "Reset to auto — will recalculate on save",
          ),
        };
      }),
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

  function updateExpenseCategory(
    index: number,
    field: keyof Pick<ExpenseCategory, "amount" | "isFixed">,
    value: number | boolean,
  ) {
    setDraft((prev) => ({
      ...prev,
      expenseCategories: prev.expenseCategories.map((category, categoryIndex) =>
        categoryIndex === index
          ? { ...category, [field]: value }
          : category,
      ),
    }));
  }

  async function handleSave() {
    await onSave(draft);
    setOpen(false);
  }

  function renderMonthRow(month: ForecastMonthStored, index: number) {
    const isActual = index <= draft.currentMonthIndex;

    return (
      <tr key={month.monthKey} className={isActual ? "bg-slate-50/80" : ""}>
        <td className="py-2 pr-2 text-slate-800">
          <div className="font-medium">{month.label}</div>
          <div className="text-xs text-slate-500">
            {isActual ? "Closed month" : "Future month"}
          </div>
        </td>
        <td className="py-2 pr-2">
          <div className="flex items-center gap-2">
            <NumberInput
              value={month.students.value}
              onChange={(value) => updateMonthMetric(index, "students", value)}
            />
            <SourceBadge
              source={month.students.source}
              explain={month.students.explain}
            />
            {!isActual && month.students.source === "manual_override" ? (
              <button
                type="button"
                onClick={() => resetMonthMetric(index, "students")}
                className="text-xs text-blue-700 hover:underline"
              >
                Reset to auto
              </button>
            ) : null}
          </div>
        </td>
        <td className="py-2 pr-2">
          <div className="flex items-center gap-2">
            <NumberInput
              value={month.tuitionRevenue.value}
              disabled={!isActual}
              onChange={(value) =>
                updateMonthMetric(index, "tuitionRevenue", value)
              }
            />
            <SourceBadge
              source={isActual ? month.tuitionRevenue.source : "forecast"}
              explain={
                isActual
                  ? month.tuitionRevenue.explain
                  : "Derived from enrollment × tuition rate"
              }
            />
          </div>
        </td>
        <td className="py-2">
          <div className="flex items-center gap-2">
            <NumberInput
              value={month.totalExpenses.value}
              onChange={(value) =>
                updateMonthMetric(index, "totalExpenses", value)
              }
            />
            <SourceBadge
              source={month.totalExpenses.source}
              explain={month.totalExpenses.explain}
            />
            {!isActual && month.totalExpenses.source === "manual_override" ? (
              <button
                type="button"
                onClick={() => resetMonthMetric(index, "totalExpenses")}
                className="text-xs text-blue-700 hover:underline"
              >
                Reset to auto
              </button>
            ) : null}
          </div>
        </td>
      </tr>
    );
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
              Closed months save as actuals. Future months auto-forecast unless you pin a value.
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
                Assumptions & expense categories
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

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2">Expense</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Monthly amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.expenseCategories.map((category, index) => (
                      <tr key={category.id}>
                        <td className="py-1 pr-2 text-slate-800">{category.name}</td>
                        <td className="py-1 pr-2">
                          <select
                            value={category.isFixed ? "fixed" : "variable"}
                            onChange={(event) =>
                              updateExpenseCategory(
                                index,
                                "isFixed",
                                event.target.value === "fixed",
                              )
                            }
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                          >
                            <option value="fixed">Fixed</option>
                            <option value="variable">Variable</option>
                          </select>
                        </td>
                        <td className="py-1">
                          <NumberInput
                            value={category.amount}
                            onChange={(value) =>
                              updateExpenseCategory(index, "amount", value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    <option key={month.monthKey} value={index}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Monthly actuals & forecast
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Future tuition is always calculated from enrollment. Pin students or expenses to override the engine.
              </p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2">Month</th>
                      <th className="pb-2">Students</th>
                      <th className="pb-2">Tuition revenue</th>
                      <th className="pb-2">Expenses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.forecastMonths.map((month, index) =>
                      renderMonthRow(month, index),
                    )}
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
                {saving ? "Saving…" : "Save & recalculate forecast"}
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
                  draft.forecastMonths[draft.currentMonthIndex]?.totalExpenses
                    .value ?? 0,
                )}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
