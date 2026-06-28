import type { ForecastNotice, ValueSource } from "./types";

/** User-facing labels — keep technical keys internal only */
export const copy = {
  site: {
    title: "New Hope School",
    subtitle: "School health at a glance",
    viewing: (month: string) => `Reviewing ${month}`,
    lastUpdated: (when: string) => `Last updated ${when}`,
  },
  editor: {
    title: "Update your numbers",
    intro:
      "Enter this month's results below. Future months update automatically when you save.",
    open: "Update numbers",
    close: "Done editing",
    save: "Save and refresh projections",
    saving: "Saving…",
    discard: "Discard changes",
    useAuto: "Use automatic estimate",
    sections: {
      enrollment: "Students by grade",
      enrollmentHint: "How many students you have now, and your goal per grade.",
      admissions: "Admissions this period",
      admissionsHint: "Track interest from first inquiry through enrollment.",
      settings: "School settings",
      settingsHint: "Tuition, funding, and how your costs are structured.",
      monthly: "Month-by-month figures",
      monthlyHint:
        "Record completed months. For upcoming months, tuition is calculated for you.",
    },
    fields: {
      current: "Enrolled now",
      target: "Goal",
      thisWeek: "This week",
      thisMonth: "This month",
      averageTuition: "Tuition per student ($)",
      collectionRate: "Share of tuition collected",
      ownerFunding: "Owner investment / month ($)",
      salaries: "Staff salaries / month ($)",
      reportingMonth: "Which month are you reviewing?",
      expenseName: "Cost",
      expenseType: "How it behaves",
      expenseAmount: "Amount / month ($)",
      fixed: "Same each month",
      variable: "Grows with enrollment",
      students: "Students",
      tuition: "Tuition collected",
      expenses: "Operating costs",
      recordedMonth: "Completed",
      upcomingMonth: "Upcoming",
      tuitionAuto: "Calculated from enrollment",
    },
    footerExpenses: (amount: string) => `This month's costs: ${amount}`,
  },
  badges: {
    actual: "Recorded",
    forecast: "Estimated",
    manual_override: "You set this",
  } satisfies Record<ValueSource, string>,
  badgesExplain: {
    actual: "A real number you entered for a completed month.",
    forecast: "Calculated from your recent trends and admissions activity.",
    manual_override: "You chose this number — it won't change unless you edit or reset it.",
  } satisfies Record<ValueSource, string>,
  chart: {
    actual: "Recorded",
    forecast: "Estimated",
    actualStudents: "Students (recorded)",
    forecastStudents: "Students (estimated)",
    income: "Income",
    expenses: "Expenses",
  },
  kpi: {
    totalStudents: "Total students",
    tuitionRevenue: "Tuition collected",
    totalExpenses: "Operating costs",
    netCashFlow: "Left over this month",
    cashBalance: "Cash in the bank",
  },
  sections: {
    enrollment: "Enrollment",
    enrollmentHint: "Students by grade and how enrollment is growing.",
    financial: "Financial health",
    financialHint: "How money is flowing this month.",
    forecast: "12-month outlook",
    forecastHint:
      "Recorded months are solid. Dashed lines and italic numbers are estimates.",
    forecastLegend: "Solid = recorded · Dashed = estimated · 📌 = you set this",
    admissions: "Admissions tracker",
    admissionsHint: "How families are moving through your admissions process.",
    actions: "What to focus on",
    actionsHint: "Based on your current numbers and projections.",
  },
  financial: {
    income: "Income this month",
    expenses: "Expenses this month",
    netCashFlow: "Left over this month",
    cashBalance: "Cash in the bank",
  },
  admissions: {
    inquiries: "Inquiries",
    schoolVisits: "School visits",
    applications: "Applications",
    studentsAdmitted: "Admitted",
    studentsEnrolled: "Enrolled",
  },
  forecastTable: {
    month: "Month",
    students: "Students",
    tuition: "Tuition",
    expenses: "Costs",
    netCashFlow: "Left over",
    cashBalance: "Cash balance",
  },
  notices: {
    coldStartAdmissions:
      "We're still learning your admissions patterns — early estimates use your default assumptions.",
    coldStartEnrollment:
      "Not enough history yet — upcoming enrollment follows your opening plan until you record more months.",
    overrideSkipped: (months: string) =>
      `Projections refreshed. These months kept your custom numbers: ${months}.`,
  },
  actions: {
    enrollmentBelowTarget: {
      label: "Enrollment is below your goal",
      action: "Focus on admissions outreach and family follow-up.",
    },
    expensesExceedIncome: {
      label: "Spending is higher than income",
      action: "Review non-essential costs for this month.",
    },
    payrollHigh: {
      label: "Staff costs are a large share of income",
      action: "Pause new hiring until revenue catches up.",
    },
    cashLow: {
      label: "Cash is tight for this month's costs",
      action: "Look for ways to conserve cash right away.",
    },
    forecastEnrollmentLow: {
      label: "Enrollment may stay below goal",
      action: "Strengthen admissions and marketing over the next few months.",
    },
    forecastCashNegative: {
      label: "Cash may run low in the months ahead",
      action: "Start cash conservation now — don't wait.",
    },
    forecastExpensesHigh: {
      label: "Costs may grow faster than income",
      action: "Check variable costs tied to enrollment.",
    },
    onTrack: {
      label: "You're on track",
      action: "Keep doing what you're doing — check back next month.",
    },
  },
  errors: {
    saveFailed: "We couldn't save your changes. Please try again.",
  },
} as const;

export function friendlyNotice(notice: ForecastNotice): string {
  if (notice.type === "cold_start") {
    if (notice.message.includes("admissions")) {
      return copy.notices.coldStartAdmissions;
    }
    if (notice.message.includes("enrollment")) {
      return copy.notices.coldStartEnrollment;
    }
  }
  if (notice.type === "override_skipped") {
    const match = notice.message.match(/unchanged: (.+)\.$/);
    return copy.notices.overrideSkipped(match?.[1] ?? "some months");
  }
  return notice.message;
}

export function friendlyExplain(
  source: ValueSource,
  explain?: string,
): string | undefined {
  if (explain) return explain;
  return copy.badgesExplain[source];
}
