export type ActionStatus = "good" | "warning" | "critical";
export type ValueSource = "actual" | "forecast" | "manual_override";

export const GRADES = [
  "KG1",
  "KG2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
] as const;

export interface MonthValue {
  month: string;
  value: number;
  source: ValueSource;
  lastUpdated: string;
  explain?: string;
}

export interface GradeEnrollment {
  grade: string;
  current: number;
  target: number;
}

export interface AdmissionsPeriod {
  week: number;
  month: number;
}

export interface AdmissionsMonthRecord {
  month: string;
  inquiries: number;
  schoolVisits: number;
  applications: number;
  studentsAdmitted: number;
  studentsEnrolled: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  isFixed: boolean;
  amount: number;
}

export interface ConversionRates {
  inquiryToVisit: number;
  visitToApplication: number;
  applicationToAdmitted: number;
  admittedToEnrolled: number;
  usingDefaults: boolean;
}

export interface ForecastMonthStored {
  monthKey: string;
  label: string;
  monthOffset: number;
  students: MonthValue;
  tuitionRevenue: MonthValue;
  totalExpenses: MonthValue;
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
    defaultConversionRates: ConversionRates;
    openingEnrollmentPlan: number[];
  };
  admissions: {
    inquiries: AdmissionsPeriod;
    schoolVisits: AdmissionsPeriod;
    applications: AdmissionsPeriod;
    studentsAdmitted: AdmissionsPeriod;
    studentsEnrolled: AdmissionsPeriod;
  };
  admissionsByMonth: AdmissionsMonthRecord[];
  expenseCategories: ExpenseCategory[];
  forecastMonths: ForecastMonthStored[];
}

export interface ForecastNotice {
  type: "cold_start" | "override_skipped" | "info";
  message: string;
}

export interface RecalculateResult {
  source: DashboardSource;
  notices: ForecastNotice[];
}

/** Computed month for display */
export interface ForecastMonthView {
  monthKey: string;
  label: string;
  monthOffset: number;
  students: MonthValue;
  tuitionRevenue: MonthValue;
  totalExpenses: MonthValue;
  isActual: boolean;
  totalIncome: number;
  netCashFlow: number;
  cashBalance: number;
}

/** Computed view rendered on the dashboard */
export interface DashboardData {
  generatedAt: string;
  currentMonth: {
    index: number;
    label: string;
    startMonth: string | null;
    monthKey: string;
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
    trend: {
      month: string;
      students: number;
      source: ValueSource;
      isActual: boolean;
    }[];
  };
  financial: {
    totalMonthlyIncome: number;
    totalMonthlyExpenses: number;
    netCashFlow: number;
    endingCashBalance: number;
    incomeVsExpenses: { name: string; value: number }[];
  };
  admissions: DashboardSource["admissions"];
  assumptions: Omit<DashboardSource["assumptions"], "defaultConversionRates"> & {
    breakEvenStudents: string;
    activeConversionRates: ConversionRates;
  };
  forecast: {
    months: ForecastMonthView[];
  };
  actionItems: {
    status: ActionStatus;
    label: string;
    action: string;
  }[];
  forecastNotices: ForecastNotice[];
}

export const EDGE_CONFIG_KEY = "dashboard";

/** @deprecated Legacy shape for migration */
export interface LegacyForecastMonth {
  label: string;
  monthOffset: number;
  students: number;
  tuitionRevenue: number;
  totalExpenses: number;
  isActual?: boolean;
}
