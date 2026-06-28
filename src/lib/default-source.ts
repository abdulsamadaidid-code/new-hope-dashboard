import type { DashboardSource, ForecastMonth, GradeEnrollment } from "./types";
import { GRADES } from "./types";

function monthLabel(startMonth: string, offset: number): string {
  const start = new Date(startMonth);
  const date = new Date(start.getFullYear(), start.getMonth() + offset, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function createDefaultSource(): DashboardSource {
  const startMonth = "2026-07-01T00:00:00.000Z";
  const forecastMonths: ForecastMonth[] = [
    { monthOffset: 0, students: 13, tuitionRevenue: 926.25, totalExpenses: 0, isActual: true, label: "" },
    { monthOffset: 1, students: 19, tuitionRevenue: 1353.75, totalExpenses: 0, isActual: false, label: "" },
    { monthOffset: 2, students: 26, tuitionRevenue: 1852.5, totalExpenses: 0, isActual: false, label: "" },
    { monthOffset: 3, students: 34, tuitionRevenue: 2422.5, totalExpenses: 0, isActual: false, label: "" },
    { monthOffset: 4, students: 42, tuitionRevenue: 2992.5, totalExpenses: 0, isActual: false, label: "" },
    { monthOffset: 5, students: 50, tuitionRevenue: 3562.5, totalExpenses: 0, isActual: false, label: "" },
    { monthOffset: 6, students: 57, tuitionRevenue: 4061.25, totalExpenses: 0, isActual: false, label: "" },
    { monthOffset: 7, students: 64, tuitionRevenue: 4560, totalExpenses: 0, isActual: false, label: "" },
    { monthOffset: 8, students: 70, tuitionRevenue: 4987.5, totalExpenses: 0, isActual: false, label: "" },
    { monthOffset: 9, students: 75, tuitionRevenue: 5343.75, totalExpenses: 0, isActual: false, label: "" },
    { monthOffset: 10, students: 80, tuitionRevenue: 5700, totalExpenses: 0, isActual: false, label: "" },
    { monthOffset: 11, students: 85, tuitionRevenue: 6056.25, totalExpenses: 0, isActual: false, label: "" },
  ].map((month) => ({
    ...month,
    label: monthLabel(startMonth, month.monthOffset),
  }));

  const enrollmentByGrade: GradeEnrollment[] = GRADES.map((grade, index) => ({
    grade,
    current: index === 0 ? 8 : 0,
    target: 18,
  }));

  return {
    updatedAt: new Date().toISOString(),
    startMonth,
    currentMonthIndex: 0,
    enrollmentByGrade,
    assumptions: {
      averageTuition: 75,
      collectionRate: 0.95,
      monthlyOwnerFunding: 3000,
      totalMonthlySalaries: 0,
    },
    admissions: {
      inquiries: { week: 0, month: 0 },
      schoolVisits: { week: 0, month: 0 },
      applications: { week: 0, month: 0 },
      studentsAdmitted: { week: 0, month: 0 },
      studentsEnrolled: { week: 0, month: 0 },
    },
    forecastMonths,
  };
}
