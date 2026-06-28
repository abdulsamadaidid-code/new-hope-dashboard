import type { ActionStatus, DashboardData, DashboardSource } from "./types";

function buildActionItems(
  kpis: DashboardData["kpis"],
  enrollment: DashboardData["enrollment"],
  financial: DashboardData["financial"],
  assumptions: DashboardData["assumptions"],
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

  if (items.length === 0) {
    items.push({
      status: "good",
      label: "Financial targets on track",
      action: "Maintain current strategy",
    });
  }

  return items.slice(0, 5);
}

function breakEvenStudents(source: DashboardSource): string {
  const { averageTuition, collectionRate, monthlyOwnerFunding } = source.assumptions;
  const current = source.forecastMonths[source.currentMonthIndex];
  const fixedExpenses = current?.totalExpenses ?? 0;
  const tuitionPerStudent = averageTuition * collectionRate;

  if (fixedExpenses <= 0) return "Enter expense assumptions";
  if (tuitionPerStudent <= 0) return "Enter tuition assumptions";

  const needed = Math.ceil(
    Math.max(0, fixedExpenses - monthlyOwnerFunding) / tuitionPerStudent,
  );
  return String(needed);
}

export function computeDashboard(source: DashboardSource): DashboardData {
  const currentIndex = Math.max(
    0,
    Math.min(source.forecastMonths.length - 1, source.currentMonthIndex),
  );

  let runningCash = 0;
  const forecastMonths = source.forecastMonths.map((month, index) => {
    const totalIncome = month.tuitionRevenue + source.assumptions.monthlyOwnerFunding;
    const netCashFlow = totalIncome - month.totalExpenses;
    runningCash += netCashFlow;

    return {
      ...month,
      isActual: index <= currentIndex,
      totalIncome,
      netCashFlow,
      cashBalance: runningCash,
    };
  });

  const currentMonth = forecastMonths[currentIndex];
  const enrolledTotal = source.enrollmentByGrade.reduce(
    (sum, grade) => sum + grade.current,
    0,
  );
  const totalStudents = enrolledTotal > 0 ? enrolledTotal : currentMonth.students;

  const financial = {
    totalMonthlyIncome: currentMonth.totalIncome,
    totalMonthlyExpenses: currentMonth.totalExpenses,
    netCashFlow: currentMonth.netCashFlow,
    endingCashBalance: currentMonth.cashBalance,
    incomeVsExpenses: [
      { name: "Income", value: currentMonth.totalIncome },
      { name: "Expenses", value: currentMonth.totalExpenses },
    ],
  };

  const enrollment = {
    byGrade: source.enrollmentByGrade,
    trend: forecastMonths.map((month) => ({
      month: month.label,
      students: month.students,
      isActual: month.isActual,
    })),
  };

  const kpis = {
    totalStudents,
    tuitionRevenue: currentMonth.tuitionRevenue,
    totalExpenses: currentMonth.totalExpenses,
    netCashFlow: currentMonth.netCashFlow,
    cashBalance: currentMonth.cashBalance,
  };

  const assumptions = {
    ...source.assumptions,
    breakEvenStudents: breakEvenStudents(source),
  };

  return {
    generatedAt: source.updatedAt,
    currentMonth: {
      index: currentIndex,
      label: currentMonth.label,
      startMonth: source.startMonth,
    },
    kpis,
    enrollment,
    financial,
    admissions: source.admissions,
    assumptions,
    forecast: { months: forecastMonths },
    actionItems: buildActionItems(kpis, enrollment, financial, assumptions),
  };
}

export function normalizeSource(input: DashboardSource): DashboardSource {
  return {
    ...input,
    updatedAt: input.updatedAt || new Date().toISOString(),
    currentMonthIndex: Math.max(
      0,
      Math.min(input.forecastMonths.length - 1, input.currentMonthIndex),
    ),
    forecastMonths: input.forecastMonths.map((month, index) => ({
      ...month,
      monthOffset: month.monthOffset ?? index,
      isActual: index <= input.currentMonthIndex,
    })),
  };
}
