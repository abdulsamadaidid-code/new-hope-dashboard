import {
  computeConversionRates,
  isLegacyForecastMonth,
  migrateLegacyMonth,
  monthKeyFromOffset,
  monthLabel,
  processSourceUpdate,
  recalculateForecasts,
} from "./forecast";
import { createDefaultSource } from "./default-source";
import type {
  DashboardData,
  DashboardSource,
  ForecastMonthView,
  LegacyForecastMonth,
} from "./types";

function breakEvenStudents(source: DashboardSource): string {
  const { averageTuition, collectionRate, monthlyOwnerFunding } = source.assumptions;
  const current = source.forecastMonths[source.currentMonthIndex];
  const fixedExpenses = current?.totalExpenses.value ?? 0;
  const tuitionPerStudent = averageTuition * collectionRate;

  if (fixedExpenses <= 0) return "Enter expense assumptions";
  if (tuitionPerStudent <= 0) return "Enter tuition assumptions";

  const needed = Math.ceil(
    Math.max(0, fixedExpenses - monthlyOwnerFunding) / tuitionPerStudent,
  );
  return String(needed);
}

function buildActionItems(
  kpis: DashboardData["kpis"],
  enrollment: DashboardData["enrollment"],
  financial: DashboardData["financial"],
  assumptions: DashboardData["assumptions"],
  forecastMonths: ForecastMonthView[],
  currentIndex: number,
) {
  const items: DashboardData["actionItems"] = [];
  const totalTarget = enrollment.byGrade.reduce((sum, grade) => sum + grade.target, 0);

  if (kpis.totalStudents < totalTarget) {
    items.push({
      status: "warning",
      label: "Enrollment below target",
      action: "Increase admissions and marketing efforts",
    });
  }

  if (financial.totalMonthlyExpenses > financial.totalMonthlyIncome) {
    items.push({
      status: "critical",
      label: "Expenses exceed income",
      action: "Review discretionary spending",
    });
  }

  const payrollRatio =
    financial.totalMonthlyIncome > 0
      ? assumptions.totalMonthlySalaries / financial.totalMonthlyIncome
      : 0;

  if (payrollRatio > 0.5 && assumptions.totalMonthlySalaries > 0) {
    items.push({
      status: "warning",
      label: "Payroll exceeds target ratio",
      action: "Delay additional hiring",
    });
  }

  if (
    kpis.cashBalance < financial.totalMonthlyExpenses &&
    financial.totalMonthlyExpenses > 0
  ) {
    items.push({
      status: "critical",
      label: "Cash balance below one month's expenses",
      action: "Implement cash conservation measures",
    });
  }

  const futureMonths = forecastMonths.slice(currentIndex + 1);
  let belowTargetStreak = 0;
  let maxBelowTargetStreak = 0;
  for (const month of futureMonths) {
    if (month.students.value < totalTarget) {
      belowTargetStreak += 1;
      maxBelowTargetStreak = Math.max(maxBelowTargetStreak, belowTargetStreak);
    } else {
      belowTargetStreak = 0;
    }
  }

  if (maxBelowTargetStreak >= 2) {
    items.push({
      status: "warning",
      label: "Forecast enrollment trending below target",
      action: "Increase admissions and marketing efforts",
    });
  }

  const negativeCashMonth = futureMonths.find((month) => month.cashBalance < 0);
  if (negativeCashMonth) {
    items.push({
      status: "critical",
      label: "Forecast cash balance may go negative",
      action: `Implement cash conservation measures now (${negativeCashMonth.label})`,
    });
  }

  const compareWindow = futureMonths.slice(0, 3);
  if (compareWindow.length >= 2) {
    const first = compareWindow[0];
    const last = compareWindow[compareWindow.length - 1];
    const incomeGrowth =
      last.totalIncome > 0
        ? (last.totalIncome - first.totalIncome) / Math.max(first.totalIncome, 1)
        : 0;
    const expenseGrowth =
      last.totalExpenses.value > 0
        ? (last.totalExpenses.value - first.totalExpenses.value) /
          Math.max(first.totalExpenses.value, 1)
        : 0;

    if (expenseGrowth > incomeGrowth + 0.05) {
      items.push({
        status: "warning",
        label: "Forecast expenses outpacing revenue growth",
        action: "Review variable cost assumptions",
      });
    }
  }

  if (items.length === 0) {
    items.push({
      status: "good",
      label: "Financial targets on track",
      action: "Maintain current strategy",
    });
  }

  return items.slice(0, 5);
}

export function normalizeSource(input: DashboardSource): DashboardSource {
  const currentMonthIndex = Math.max(
    0,
    Math.min((input.forecastMonths?.length ?? 1) - 1, input.currentMonthIndex ?? 0),
  );

  const startMonth = input.startMonth || createDefaultSource().startMonth;

  const forecastMonths = (input.forecastMonths ?? []).map((month, index) => {
    if (isLegacyForecastMonth(month as unknown as LegacyForecastMonth)) {
      return migrateLegacyMonth(
        month as unknown as LegacyForecastMonth,
        startMonth,
        currentMonthIndex,
      );
    }

    const stored = month as DashboardSource["forecastMonths"][number];
    return {
      ...stored,
      monthKey: stored.monthKey || monthKeyFromOffset(startMonth, index),
      label: stored.label || monthLabel(startMonth, index),
      monthOffset: stored.monthOffset ?? index,
      students: {
        ...stored.students,
        month: stored.students.month || monthKeyFromOffset(startMonth, index),
      },
      tuitionRevenue: {
        ...stored.tuitionRevenue,
        month: stored.tuitionRevenue.month || monthKeyFromOffset(startMonth, index),
      },
      totalExpenses: {
        ...stored.totalExpenses,
        month: stored.totalExpenses.month || monthKeyFromOffset(startMonth, index),
      },
    };
  });

  return {
    ...createDefaultSource(),
    ...input,
    updatedAt: input.updatedAt || new Date().toISOString(),
    startMonth,
    currentMonthIndex,
    assumptions: {
      ...createDefaultSource().assumptions,
      ...input.assumptions,
      defaultConversionRates: {
        ...createDefaultSource().assumptions.defaultConversionRates,
        ...input.assumptions?.defaultConversionRates,
      },
      openingEnrollmentPlan:
        input.assumptions?.openingEnrollmentPlan ??
        createDefaultSource().assumptions.openingEnrollmentPlan,
    },
    admissionsByMonth: input.admissionsByMonth ?? [],
    expenseCategories:
      input.expenseCategories ?? createDefaultSource().expenseCategories,
    forecastMonths,
  };
}

export function computeDashboard(source: DashboardSource): DashboardData {
  const normalized = normalizeSource(source);
  const { source: recalculated, notices } = recalculateForecasts(normalized);
  const currentIndex = Math.max(
    0,
    Math.min(recalculated.forecastMonths.length - 1, recalculated.currentMonthIndex),
  );

  let runningCash = 0;
  const forecastMonths: ForecastMonthView[] = recalculated.forecastMonths.map(
    (month, index) => {
      const totalIncome =
        month.tuitionRevenue.value + recalculated.assumptions.monthlyOwnerFunding;
      const netCashFlow = totalIncome - month.totalExpenses.value;
      runningCash += netCashFlow;

      return {
        monthKey: month.monthKey,
        label: month.label,
        monthOffset: month.monthOffset,
        students: month.students,
        tuitionRevenue: month.tuitionRevenue,
        totalExpenses: month.totalExpenses,
        isActual: index <= currentIndex,
        totalIncome,
        netCashFlow,
        cashBalance: runningCash,
      };
    },
  );

  const currentMonth = forecastMonths[currentIndex];
  const enrolledTotal = recalculated.enrollmentByGrade.reduce(
    (sum, grade) => sum + grade.current,
    0,
  );
  const totalStudents =
    enrolledTotal > 0 ? enrolledTotal : currentMonth.students.value;

  const financial = {
    totalMonthlyIncome: currentMonth.totalIncome,
    totalMonthlyExpenses: currentMonth.totalExpenses.value,
    netCashFlow: currentMonth.netCashFlow,
    endingCashBalance: currentMonth.cashBalance,
    incomeVsExpenses: [
      { name: "Income", value: currentMonth.totalIncome },
      { name: "Expenses", value: currentMonth.totalExpenses.value },
    ],
  };

  const enrollment = {
    byGrade: recalculated.enrollmentByGrade,
    trend: forecastMonths.map((month) => ({
      month: month.label,
      students: month.students.value,
      source: month.students.source,
      isActual: month.isActual,
    })),
  };

  const kpis = {
    totalStudents,
    tuitionRevenue: currentMonth.tuitionRevenue.value,
    totalExpenses: currentMonth.totalExpenses.value,
    netCashFlow: currentMonth.netCashFlow,
    cashBalance: currentMonth.cashBalance,
  };

  const monthKeys = recalculated.forecastMonths.map((month) => month.monthKey);
  const activeConversionRates = computeConversionRates(
    recalculated.admissionsByMonth,
    recalculated.assumptions.defaultConversionRates,
    currentIndex,
    monthKeys,
  );

  const assumptions = {
    averageTuition: recalculated.assumptions.averageTuition,
    collectionRate: recalculated.assumptions.collectionRate,
    monthlyOwnerFunding: recalculated.assumptions.monthlyOwnerFunding,
    totalMonthlySalaries: recalculated.assumptions.totalMonthlySalaries,
    openingEnrollmentPlan: recalculated.assumptions.openingEnrollmentPlan,
    breakEvenStudents: breakEvenStudents(recalculated),
    activeConversionRates,
  };

  return {
    generatedAt: recalculated.updatedAt,
    currentMonth: {
      index: currentIndex,
      label: currentMonth.label,
      startMonth: recalculated.startMonth,
      monthKey: currentMonth.monthKey,
    },
    kpis,
    enrollment,
    financial,
    admissions: recalculated.admissions,
    assumptions,
    forecast: { months: forecastMonths },
    actionItems: buildActionItems(
      kpis,
      enrollment,
      financial,
      assumptions,
      forecastMonths,
      currentIndex,
    ),
    forecastNotices: notices,
  };
}

export function prepareSourceForSave(source: DashboardSource) {
  return processSourceUpdate(normalizeSource(source));
}

export { recalculateForecasts };
