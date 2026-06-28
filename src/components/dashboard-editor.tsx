"use client";

import { useEffect, useMemo, useState } from "react";
import { SourceBadge } from "@/components/source-badge";
import { copy } from "@/lib/copy";
import { formatCurrency } from "@/lib/format";
import { createMonthValue } from "@/lib/forecast";
import type {
  DashboardSource,
  ExpenseCategory,
  ForecastMonthStored,
} from "@/lib/types";

const admissionsRows = [
  { key: "inquiries", label: copy.admissions.inquiries },
  { key: "schoolVisits", label: copy.admissions.schoolVisits },
  { key: "applications", label: copy.admissions.applications },
  { key: "studentsAdmitted", label: copy.admissions.studentsAdmitted },
  { key: "studentsEnrolled", label: copy.admissions.studentsEnrolled },
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
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
    />
  );
}

function EditorSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
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

  function updateMonthMetric(index: number, field: MetricField, value: number) {
    setDraft((prev) => {
      const isActual = index <= prev.currentMonthIndex;
      const sourceTag = isActual ? "actual" : "manual_override";

      if (!isActual && field === "tuitionRevenue") {
        return prev;
      }

      const fieldLabels = {
        students: copy.editor.fields.students,
        tuitionRevenue: copy.editor.fields.tuition,
        totalExpenses: copy.editor.fields.expenses,
      };

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
                ? `You entered ${fieldLabels[field]} for this completed month.`
                : `You chose this ${fieldLabels[field].toLowerCase()} for an upcoming month.`,
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
            "Will use the automatic estimate when you save.",
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
        <td className="py-2.5 pr-3 text-slate-800">
          <div className="font-medium">{month.label}</div>
          <div className="text-xs text-slate-500">
            {isActual
              ? copy.editor.fields.recordedMonth
              : copy.editor.fields.upcomingMonth}
          </div>
        </td>
        <td className="py-2.5 pr-3">
          <div className="space-y-1.5">
            <NumberInput
              value={month.students.value}
              onChange={(value) => updateMonthMetric(index, "students", value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge
                source={month.students.source}
                explain={month.students.explain}
              />
              {!isActual && month.students.source === "manual_override" ? (
                <button
                  type="button"
                  onClick={() => resetMonthMetric(index, "students")}
                  className="text-xs font-medium text-blue-700 hover:underline"
                >
                  {copy.editor.useAuto}
                </button>
              ) : null}
            </div>
          </div>
        </td>
        <td className="py-2.5 pr-3">
          <div className="space-y-1.5">
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
                  : copy.editor.fields.tuitionAuto
              }
            />
          </div>
        </td>
        <td className="py-2.5">
          <div className="space-y-1.5">
            <NumberInput
              value={month.totalExpenses.value}
              onChange={(value) =>
                updateMonthMetric(index, "totalExpenses", value)
              }
            />
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge
                source={month.totalExpenses.source}
                explain={month.totalExpenses.explain}
              />
              {!isActual && month.totalExpenses.source === "manual_override" ? (
                <button
                  type="button"
                  onClick={() => resetMonthMetric(index, "totalExpenses")}
                  className="text-xs font-medium text-blue-700 hover:underline"
                >
                  {copy.editor.useAuto}
                </button>
              ) : null}
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <section className="print:hidden">
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {copy.editor.title}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              {copy.editor.intro}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft(source);
              setOpen((value) => !value);
            }}
            className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-800"
          >
            {open ? copy.editor.close : copy.editor.open}
          </button>
        </div>

        {open ? (
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <EditorSection
                title={copy.editor.sections.enrollment}
                hint={copy.editor.sections.enrollmentHint}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2">Grade</th>
                      <th className="pb-2">{copy.editor.fields.current}</th>
                      <th className="pb-2">{copy.editor.fields.target}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.enrollmentByGrade.map((grade, index) => (
                      <tr key={grade.grade}>
                        <td className="py-2 pr-2 text-slate-800">{grade.grade}</td>
                        <td className="py-2 pr-2">
                          <NumberInput
                            value={grade.current}
                            onChange={(value) => updateGrade(index, "current", value)}
                          />
                        </td>
                        <td className="py-2">
                          <NumberInput
                            value={grade.target}
                            onChange={(value) => updateGrade(index, "target", value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </EditorSection>

              <EditorSection
                title={copy.editor.sections.admissions}
                hint={copy.editor.sections.admissionsHint}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2">Stage</th>
                      <th className="pb-2">{copy.editor.fields.thisWeek}</th>
                      <th className="pb-2">{copy.editor.fields.thisMonth}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admissionsRows.map(({ key, label }) => (
                      <tr key={key}>
                        <td className="py-2 pr-2 text-slate-800">{label}</td>
                        <td className="py-2 pr-2">
                          <NumberInput
                            value={draft.admissions[key].week}
                            onChange={(value) => updateAdmission(key, "week", value)}
                          />
                        </td>
                        <td className="py-2">
                          <NumberInput
                            value={draft.admissions[key].month}
                            onChange={(value) => updateAdmission(key, "month", value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </EditorSection>
            </div>

            <EditorSection
              title={copy.editor.sections.settings}
              hint={copy.editor.sections.settingsHint}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm text-slate-700">
                  {copy.editor.fields.averageTuition}
                  <NumberInput
                    className="mt-1.5"
                    value={draft.assumptions.averageTuition}
                    onChange={(value) => updateAssumption("averageTuition", value)}
                  />
                </label>
                <label className="text-sm text-slate-700">
                  {copy.editor.fields.collectionRate}
                  <NumberInput
                    className="mt-1.5"
                    value={draft.assumptions.collectionRate}
                    onChange={(value) => updateAssumption("collectionRate", value)}
                  />
                </label>
                <label className="text-sm text-slate-700">
                  {copy.editor.fields.ownerFunding}
                  <NumberInput
                    className="mt-1.5"
                    value={draft.assumptions.monthlyOwnerFunding}
                    onChange={(value) =>
                      updateAssumption("monthlyOwnerFunding", value)
                    }
                  />
                </label>
                <label className="text-sm text-slate-700">
                  {copy.editor.fields.salaries}
                  <NumberInput
                    className="mt-1.5"
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
                      <th className="pb-2">{copy.editor.fields.expenseName}</th>
                      <th className="pb-2">{copy.editor.fields.expenseType}</th>
                      <th className="pb-2">{copy.editor.fields.expenseAmount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.expenseCategories.map((category, index) => (
                      <tr key={category.id}>
                        <td className="py-2 pr-2 text-slate-800">{category.name}</td>
                        <td className="py-2 pr-2">
                          <select
                            value={category.isFixed ? "fixed" : "variable"}
                            onChange={(event) =>
                              updateExpenseCategory(
                                index,
                                "isFixed",
                                event.target.value === "fixed",
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
                          >
                            <option value="fixed">{copy.editor.fields.fixed}</option>
                            <option value="variable">
                              {copy.editor.fields.variable}
                            </option>
                          </select>
                        </td>
                        <td className="py-2">
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

              <label className="mt-4 block text-sm text-slate-700">
                {copy.editor.fields.reportingMonth}
                <select
                  value={draft.currentMonthIndex}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      currentMonthIndex: Number(event.target.value),
                    }))
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
                >
                  {draft.forecastMonths.map((month, index) => (
                    <option key={month.monthKey} value={index}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>
            </EditorSection>

            <EditorSection
              title={copy.editor.sections.monthly}
              hint={copy.editor.sections.monthlyHint}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2">{copy.forecastTable.month}</th>
                      <th className="pb-2">{copy.editor.fields.students}</th>
                      <th className="pb-2">{copy.editor.fields.tuition}</th>
                      <th className="pb-2">{copy.editor.fields.expenses}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.forecastMonths.map((month, index) =>
                      renderMonthRow(month, index),
                    )}
                  </tbody>
                </table>
              </div>
            </EditorSection>

            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <button
                type="button"
                disabled={saving || !hasChanges}
                onClick={handleSave}
                className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? copy.editor.saving : copy.editor.save}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setDraft(source)}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {copy.editor.discard}
              </button>
              <p className="text-sm text-slate-500">
                {copy.editor.footerExpenses(
                  formatCurrency(
                    draft.forecastMonths[draft.currentMonthIndex]?.totalExpenses
                      .value ?? 0,
                  ),
                )}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
