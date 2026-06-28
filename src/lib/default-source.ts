import type { DashboardSource, ForecastMonthStored } from "./types";
import { GRADES } from "./types";
import {
  createMonthValue,
  defaultConversionRates,
  defaultExpenseCategories,
  migrateLegacyMonth,
  monthKeyFromOffset,
  monthLabel,
  OPENING_ENROLLMENT_PLAN,
} from "./forecast";

export function createDefaultSource(): DashboardSource {
  const startMonth = "2026-07-01T00:00:00.000Z";
  const currentMonthIndex = 0;

  const forecastMonths: ForecastMonthStored[] = OPENING_ENROLLMENT_PLAN.map(
    (students, monthOffset) => {
      const monthKey = monthKeyFromOffset(startMonth, monthOffset);
      const isActual = monthOffset <= currentMonthIndex;
      const source = isActual ? "actual" : "forecast";
      const tuitionRevenue = students * 75 * 0.95;

      return {
        monthKey,
        label: monthLabel(startMonth, monthOffset),
        monthOffset,
        students: createMonthValue(monthKey, students, source),
        tuitionRevenue: createMonthValue(monthKey, tuitionRevenue, source),
        totalExpenses: createMonthValue(monthKey, 0, source),
      };
    },
  );

  return {
    updatedAt: new Date().toISOString(),
    startMonth,
    currentMonthIndex,
    enrollmentByGrade: GRADES.map((grade, index) => ({
      grade,
      current: index === 0 ? 8 : 0,
      target: 18,
    })),
    assumptions: {
      averageTuition: 75,
      collectionRate: 0.95,
      monthlyOwnerFunding: 3000,
      totalMonthlySalaries: 0,
      defaultConversionRates: defaultConversionRates(),
      openingEnrollmentPlan: [...OPENING_ENROLLMENT_PLAN],
    },
    admissions: {
      inquiries: { week: 0, month: 0 },
      schoolVisits: { week: 0, month: 0 },
      applications: { week: 0, month: 0 },
      studentsAdmitted: { week: 0, month: 0 },
      studentsEnrolled: { week: 0, month: 0 },
    },
    admissionsByMonth: [],
    expenseCategories: defaultExpenseCategories(),
    forecastMonths,
  };
}
