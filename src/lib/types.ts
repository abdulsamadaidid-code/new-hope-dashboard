export type ActionStatus = "good" | "warning" | "critical";

export interface GradeEnrollment {
  grade: string;
  current: number;
  target: number;
}

export interface AdmissionsPeriod {
  week: number;
  month: number;
}

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
    trend: { month: string; students: number }[];
  };
  financial: {
    totalMonthlyIncome: number;
    totalMonthlyExpenses: number;
    netCashFlow: number;
    endingCashBalance: number;
    incomeVsExpenses: { name: string; value: number }[];
  };
  admissions: {
    inquiries: AdmissionsPeriod;
    schoolVisits: AdmissionsPeriod;
    applications: AdmissionsPeriod;
    studentsAdmitted: AdmissionsPeriod;
    studentsEnrolled: AdmissionsPeriod;
  };
  assumptions: {
    averageTuition: number;
    collectionRate: number;
    monthlyOwnerFunding: number;
    totalMonthlySalaries: number;
    breakEvenStudents: string;
  };
  actionItems: {
    status: ActionStatus;
    label: string;
    action: string;
  }[];
}
