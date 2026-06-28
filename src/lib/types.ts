export type ActionStatus = "good" | "warning" | "critical";

export const GRADES = [
  "KG1",
  "KG2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
] as const;

export interface GradeEnrollment {
  grade: string;
  current: number;
  target: number;
}

export interface AdmissionsPeriod {
  week: number;
  month: number;
}

export interface ForecastMonth {
  label: string;
  monthOffset: number;
  students: number;
  tuitionRevenue: number;
  totalExpenses: number;
  isActual: boolean;
}

/** Editable source stored in Edge Config */
export interface DashboardSource {
  updatedAt: string;
  startMonth: string;
  currentMonthIndex: number;
  enrollmentByGrade: GradeEnrollment[];
  assumptions: {
    averageTuition: number;
    collectionRate: number;
    monthlyOwnerFunding: number;
    totalMonthlySalaries: number;
  };
  admissions: {
    inquiries: AdmissionsPeriod;
    schoolVisits: AdmissionsPeriod;
    applications: AdmissionsPeriod;
    studentsAdmitted: AdmissionsPeriod;
    studentsEnrolled: AdmissionsPeriod;
  };
  forecastMonths: ForecastMonth[];
}

/** Computed view rendered on the dashboard */
export interface DashboardData {
  generatedAt: string;
  currentMonth: {
    index: number;
    label: string;
    startMonth: string | null;
  };
  kpis: {
    totalStudents: number;
    tuitionRevenue: number;
    totalExpenses: number;
    netCashFlow: number;
    cashBalance: number;
  };
  enrollment: {
    byGrade: GradeEnrollment[];
    trend: { month: string; students: number; isActual: boolean }[];
  };
  financial: {
    totalMonthlyIncome: number;
    totalMonthlyExpenses: number;
    netCashFlow: number;
    endingCashBalance: number;
    incomeVsExpenses: { name: string; value: number }[];
  };
  admissions: DashboardSource["admissions"];
  assumptions: DashboardSource["assumptions"] & {
    breakEvenStudents: string;
  };
  forecast: {
    months: (ForecastMonth & {
      totalIncome: number;
      netCashFlow: number;
      cashBalance: number;
    })[];
  };
  actionItems: {
    status: ActionStatus;
    label: string;
    action: string;
  }[];
}

export const EDGE_CONFIG_KEY = "dashboard";
