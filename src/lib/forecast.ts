import type {
  AdmissionsMonthRecord,
  ConversionRates,
  DashboardSource,
  ExpenseCategory,
  ForecastMonthStored,
  ForecastNotice,
  LegacyForecastMonth,
  MonthValue,
  RecalculateResult,
  ValueSource,
} from "./types";

export const SMOOTHING_ALPHA = 0.45;
export const COLD_START_MIN_RECORDS = 8;
export const MIN_ACTUAL_MONTHS_FOR_SMOOTHING = 2;
export const TRAILING_WINDOW_MONTHS = 3;

const DEFAULT_CONVERSION_RATES: ConversionRates = {
  inquiryToVisit: 0.6,
  visitToApplication: 0.5,
  applicationToAdmitted: 0.7,
  admittedToEnrolled: 0.85,
  usingDefaults: true,
};

export function monthKeyFromOffset(startMonth: string, offset: number): string {
  const start = new Date(startMonth);
  const date = new Date(start.getFullYear(), start.getMonth() + offset, 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function monthLabel(startMonth: string, offset: number): string {
  const start = new Date(startMonth);
  const date = new Date(start.getFullYear(), start.getMonth() + offset, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function createMonthValue(
  month: string,
  value: number,
  source: ValueSource,
  explain?: string,
): MonthValue {
  return {
    month,
    value,
    source,
    lastUpdated: new Date().toISOString(),
    explain,
  };
}

function totalAdmissionsRecords(history: AdmissionsMonthRecord[]): number {
  return history.reduce(
    (sum, record) =>
      sum +
      record.inquiries +
      record.schoolVisits +
      record.applications +
      record.studentsAdmitted +
      record.studentsEnrolled,
    0,
  );
}

export function computeConversionRates(
  history: AdmissionsMonthRecord[],
  defaults: ConversionRates,
  currentMonthIndex: number,
  monthKeys: string[],
): ConversionRates {
  const windowKeys = monthKeys.slice(
    Math.max(0, currentMonthIndex - TRAILING_WINDOW_MONTHS + 1),
    currentMonthIndex + 1,
  );
  const window = history.filter((record) => windowKeys.includes(record.month));

  if (totalAdmissionsRecords(window) < COLD_START_MIN_RECORDS) {
    return { ...defaults, usingDefaults: true };
  }

  const sum = (field: keyof AdmissionsMonthRecord) =>
    window.reduce((total, record) => total + Number(record[field] ?? 0), 0);

  const inquiries = sum("inquiries");
  const visits = sum("schoolVisits");
  const applications = sum("applications");
  const admitted = sum("studentsAdmitted");
  const enrolled = sum("studentsEnrolled");

  const safeRate = (numerator: number, denominator: number, fallback: number) =>
    denominator > 0 ? numerator / denominator : fallback;

  return {
    inquiryToVisit: safeRate(visits, inquiries, defaults.inquiryToVisit),
    visitToApplication: safeRate(applications, visits, defaults.visitToApplication),
    applicationToAdmitted: safeRate(
      admitted,
      applications,
      defaults.applicationToAdmitted,
    ),
    admittedToEnrolled: safeRate(enrolled, admitted, defaults.admittedToEnrolled),
    usingDefaults: false,
  };
}

export function projectFunnelEnrollment(
  inquiries: number,
  rates: ConversionRates,
): number {
  return (
    inquiries *
    rates.inquiryToVisit *
    rates.visitToApplication *
    rates.applicationToAdmitted *
    rates.admittedToEnrolled
  );
}

function exponentialSmoothingDeltas(actualDeltas: number[]): number {
  if (actualDeltas.length === 0) return 0;
  return actualDeltas.reduce(
    (smoothed, delta) => SMOOTHING_ALPHA * delta + (1 - SMOOTHING_ALPHA) * smoothed,
    actualDeltas[0],
  );
}

function deriveTuitionRatePerStudent(
  months: ForecastMonthStored[],
  currentMonthIndex: number,
  fallbackRate: number,
): number {
  for (let index = currentMonthIndex; index >= 0; index -= 1) {
    const month = months[index];
    if (month.students.value > 0 && month.students.source === "actual") {
      return month.tuitionRevenue.value / month.students.value;
    }
  }
  return fallbackRate;
}

function sumExpenseCategories(categories: ExpenseCategory[]): {
  fixed: number;
  variablePerStudent: number;
} {
  return categories.reduce(
    (totals, category) => {
      if (category.isFixed) {
        totals.fixed += category.amount;
      } else {
        totals.variablePerStudent += category.amount;
      }
      return totals;
    },
    { fixed: 0, variablePerStudent: 0 },
  );
}

function forecastExpenseTotal(
  categories: ExpenseCategory[],
  forecastEnrollment: number,
  lastActualEnrollment: number,
): { total: number; explain: string } {
  const { fixed, variablePerStudent } = sumExpenseCategories(categories);
  const scaledVariable =
    lastActualEnrollment > 0
      ? variablePerStudent * (forecastEnrollment / lastActualEnrollment)
      : variablePerStudent * forecastEnrollment;

  const total = fixed + scaledVariable;
  return {
    total,
    explain: `Fixed costs ($${fixed.toFixed(0)}) + variable costs scaled to ${forecastEnrollment} students ($${scaledVariable.toFixed(0)})`,
  };
}

function conservativeEnrollment(
  smoothed: number,
  funnel: number,
): { value: number; explain: string } {
  if (funnel <= 0) {
    return {
      value: Math.max(0, Math.round(smoothed)),
      explain: `Smoothed enrollment trend: ${smoothed.toFixed(1)} new students/month`,
    };
  }

  const roundedSmoothed = Math.max(0, Math.round(smoothed));
  const roundedFunnel = Math.max(0, Math.round(funnel));
  const disagreement =
    Math.abs(roundedSmoothed - roundedFunnel) /
    Math.max(roundedSmoothed, roundedFunnel, 1);

  if (disagreement > 0.1) {
    const value = Math.min(roundedSmoothed, roundedFunnel);
    return {
      value,
      explain: `Conservative blend of trend (${roundedSmoothed}) and admissions funnel (${roundedFunnel})`,
    };
  }

  return {
    value: roundedSmoothed,
    explain: `Smoothed enrollment trend: ${roundedSmoothed} students`,
  };
}

function syncCurrentMonthAdmissions(source: DashboardSource): DashboardSource {
  const currentKey = monthKeyFromOffset(
    source.startMonth,
    source.currentMonthIndex,
  );
  const currentRecord: AdmissionsMonthRecord = {
    month: currentKey,
    inquiries: source.admissions.inquiries.month,
    schoolVisits: source.admissions.schoolVisits.month,
    applications: source.admissions.applications.month,
    studentsAdmitted: source.admissions.studentsAdmitted.month,
    studentsEnrolled: source.admissions.studentsEnrolled.month,
  };

  const hasRecord = source.admissionsByMonth.some(
    (record) => record.month === currentKey,
  );

  return {
    ...source,
    admissionsByMonth: hasRecord
      ? source.admissionsByMonth.map((record) =>
          record.month === currentKey ? currentRecord : record,
        )
      : [...source.admissionsByMonth, currentRecord],
  };
}

export function recalculateForecasts(source: DashboardSource): RecalculateResult {
  const notices: ForecastNotice[] = [];
  const skippedOverrides: string[] = [];
  const synced = syncCurrentMonthAdmissions(source);
  const currentIndex = Math.max(
    0,
    Math.min(synced.forecastMonths.length - 1, synced.currentMonthIndex),
  );
  const monthKeys = synced.forecastMonths.map((month) => month.monthKey);
  const rates = computeConversionRates(
    synced.admissionsByMonth,
    synced.assumptions.defaultConversionRates,
    currentIndex,
    monthKeys,
  );

  if (rates.usingDefaults) {
    notices.push({
      type: "cold_start",
      message:
        "Using default admissions assumptions — not enough admissions history yet.",
    });
  }

  const actualCount = synced.forecastMonths
    .slice(0, currentIndex + 1)
    .filter((month) => month.students.source === "actual").length;

  if (actualCount < MIN_ACTUAL_MONTHS_FOR_SMOOTHING) {
    notices.push({
      type: "cold_start",
      message:
        "Using opening enrollment plan — fewer than 2 closed months of actual enrollment.",
    });
  }

  const actualDeltas: number[] = [];
  for (let index = 1; index <= currentIndex; index += 1) {
    actualDeltas.push(
      synced.forecastMonths[index].students.value -
        synced.forecastMonths[index - 1].students.value,
    );
  }

  const smoothedDelta = exponentialSmoothingDeltas(actualDeltas);
  const tuitionRate = deriveTuitionRatePerStudent(
    synced.forecastMonths,
    currentIndex,
    synced.assumptions.averageTuition * synced.assumptions.collectionRate,
  );
  const lastActualEnrollment =
    synced.forecastMonths[currentIndex]?.students.value || 0;

  const updatedMonths: ForecastMonthStored[] = [];

  for (let index = 0; index < synced.forecastMonths.length; index += 1) {
    const month = synced.forecastMonths[index];

    if (index <= currentIndex) {
      updatedMonths.push({
        ...month,
        tuitionRevenue:
          month.tuitionRevenue.source === "actual"
            ? month.tuitionRevenue
            : createMonthValue(
                month.monthKey,
                month.students.value * tuitionRate,
                "actual",
                `${month.students.value} students × $${tuitionRate.toFixed(2)} per student`,
              ),
      });
      continue;
    }

    if (month.students.source === "manual_override") {
      skippedOverrides.push(month.label);
      const enrollment = month.students.value;
      const expenses =
        month.totalExpenses.source === "manual_override"
          ? month.totalExpenses
          : (() => {
              const forecast = forecastExpenseTotal(
                synced.expenseCategories,
                enrollment,
                lastActualEnrollment,
              );
              return createMonthValue(
                month.monthKey,
                forecast.total,
                "forecast",
                forecast.explain,
              );
            })();

      updatedMonths.push({
        ...month,
        tuitionRevenue: createMonthValue(
          month.monthKey,
          enrollment * tuitionRate,
          "forecast",
          `${enrollment} students × $${tuitionRate.toFixed(2)} per student`,
        ),
        totalExpenses: expenses,
      });
      continue;
    }

    const previousEnrollment =
      index === 0 ? month.students.value : updatedMonths[index - 1].students.value;

    const openingPlan =
      synced.assumptions.openingEnrollmentPlan[index] ??
      synced.assumptions.openingEnrollmentPlan.at(-1) ??
      previousEnrollment;

    let enrollmentValue: number;
    let enrollmentExplain: string;

    if (actualCount < MIN_ACTUAL_MONTHS_FOR_SMOOTHING) {
      enrollmentValue = openingPlan;
      enrollmentExplain = `Opening plan default: ${openingPlan} students`;
    } else {
      const admissionsRecord = synced.admissionsByMonth.find(
        (record) => record.month === month.monthKey,
      );
      const funnel = admissionsRecord
        ? projectFunnelEnrollment(admissionsRecord.inquiries, rates)
        : 0;
      const blended = conservativeEnrollment(
        previousEnrollment + smoothedDelta,
        funnel,
      );
      enrollmentValue = blended.value;
      enrollmentExplain = blended.explain;
    }

    const expenses =
      month.totalExpenses.source === "manual_override"
        ? (skippedOverrides.push(`${month.label} expenses`), month.totalExpenses)
        : (() => {
            const forecast = forecastExpenseTotal(
              synced.expenseCategories,
              enrollmentValue,
              lastActualEnrollment,
            );
            return createMonthValue(
              month.monthKey,
              forecast.total,
              "forecast",
              forecast.explain,
            );
          })();

    updatedMonths.push({
      ...month,
      students: createMonthValue(
        month.monthKey,
        enrollmentValue,
        "forecast",
        enrollmentExplain,
      ),
      tuitionRevenue: createMonthValue(
        month.monthKey,
        enrollmentValue * tuitionRate,
        "forecast",
        `${enrollmentValue} students × $${tuitionRate.toFixed(2)} per student`,
      ),
      totalExpenses: expenses,
    });
  }

  if (skippedOverrides.length > 0) {
    notices.push({
      type: "override_skipped",
      message: `Forecast updated, but pinned values were left unchanged: ${skippedOverrides.join(", ")}.`,
    });
  }

  return {
    source: {
      ...synced,
      forecastMonths: updatedMonths,
      updatedAt: new Date().toISOString(),
    },
    notices,
  };
}

export function processSourceUpdate(source: DashboardSource): RecalculateResult {
  return recalculateForecasts(source);
}

export function isLegacyForecastMonth(
  month: LegacyForecastMonth | ForecastMonthStored,
): month is LegacyForecastMonth {
  return typeof (month as LegacyForecastMonth).students === "number";
}

export function migrateLegacyMonth(
  month: LegacyForecastMonth,
  startMonth: string,
  currentMonthIndex: number,
): ForecastMonthStored {
  const monthKey = monthKeyFromOffset(startMonth, month.monthOffset);
  const isActual = month.monthOffset <= currentMonthIndex;
  const source: ValueSource = isActual ? "actual" : "forecast";

  return {
    monthKey,
    label: month.label || monthLabel(startMonth, month.monthOffset),
    monthOffset: month.monthOffset,
    students: createMonthValue(monthKey, month.students, source),
    tuitionRevenue: createMonthValue(monthKey, month.tuitionRevenue, source),
    totalExpenses: createMonthValue(monthKey, month.totalExpenses, source),
  };
}

export function defaultExpenseCategories(): ExpenseCategory[] {
  return [
    { id: "rent", name: "Rent", isFixed: true, amount: 0 },
    { id: "salaries", name: "Salaries", isFixed: true, amount: 0 },
    {
      id: "utilities",
      name: "Utilities & supplies",
      isFixed: false,
      amount: 0,
    },
    {
      id: "marketing",
      name: "Marketing & admissions",
      isFixed: false,
      amount: 0,
    },
  ];
}

export function defaultConversionRates(): ConversionRates {
  return { ...DEFAULT_CONVERSION_RATES };
}

export const OPENING_ENROLLMENT_PLAN = [
  13, 19, 26, 34, 42, 50, 57, 64, 70, 75, 80, 85,
];
