import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const WORKBOOK = path.join(
  process.cwd(),
  "data/New_Hope_Startup_Financial_Model_Template.xlsx",
);
const OUTPUT = path.join(process.cwd(), "src/data/dashboard.json");

const GRADES = ["KG1", "KG2", "Grade 1", "Grade 2", "Grade 3", "Grade 4"];
const MONTH_COLS = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];

function cell(sheet, ref) {
  const c = sheet[ref];
  if (!c || c.v === undefined || c.v === null) return null;
  return c.v;
}

function num(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string" && !Number.isNaN(Number(v))) return Number(v);
  return 0;
}

function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") {
    const parts = XLSX.SSF.parse_date_code(v);
    if (!parts) return null;
    return new Date(parts.y, parts.m - 1, parts.d);
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function normalizeStage(stage) {
  return String(stage ?? "")
    .trim()
    .toLowerCase();
}

function stageBucket(stage) {
  const s = normalizeStage(stage);
  if (s.includes("inquir")) return "inquiries";
  if (s.includes("visit")) return "schoolVisits";
  if (s.includes("applic")) return "applications";
  if (s.includes("admit")) return "studentsAdmitted";
  if (s.includes("enroll")) return "studentsEnrolled";
  return null;
}

function monthIndex(startMonth, now = new Date()) {
  const start = parseDate(startMonth);
  if (!start) return 0;
  const diff =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  return Math.max(0, Math.min(11, diff));
}

function forecastValue(sheet, row, index) {
  return num(cell(sheet, `${MONTH_COLS[index]}${row}`));
}

function buildActionItems(data) {
  const items = [];
  const {
    kpis,
    enrollment,
    financial,
    assumptions,
  } = data;

  const totalTarget = enrollment.byGrade.reduce((s, g) => s + g.target, 0);
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

function main() {
  if (!fs.existsSync(WORKBOOK)) {
    console.error(`Workbook not found: ${WORKBOOK}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(WORKBOOK, { cellDates: true });
  const assumptions = wb.Sheets.Assumptions;
  const admissions = wb.Sheets.Admissions;
  const forecast = wb.Sheets["12M_Forecast"];

  const startMonth = cell(assumptions, "B5");
  const currentIndex = monthIndex(startMonth);
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const targetClassSize = num(cell(assumptions, "B10"));
  const currentAdmitted = num(cell(assumptions, "B9"));
  const endingStudents = forecastValue(forecast, 8, currentIndex);

  const enrollmentByGrade = GRADES.map((grade, i) => {
    const row = 6 + i;
    const planStudents = num(cell(assumptions, `G${row}`));
    return {
      grade,
      current: 0,
      target: planStudents > 0 ? planStudents : targetClassSize,
    };
  });

  const admissionsRows = XLSX.utils.sheet_to_json(admissions, {
    range: 3,
    defval: "",
  });

  const admissionsCounts = {
    inquiries: { week: 0, month: 0 },
    schoolVisits: { week: 0, month: 0 },
    applications: { week: 0, month: 0 },
    studentsAdmitted: { week: 0, month: 0 },
    studentsEnrolled: { week: 0, month: 0 },
  };

  for (const row of admissionsRows) {
    const date = parseDate(row.Date);
    const grade = String(row.Grade ?? "").trim();
    const stage = row.Stage;
    const bucket = stageBucket(stage);
    if (!bucket) continue;

    const inWeek = date && date >= weekStart && date <= now;
    const inMonth = date && date >= monthStart && date <= now;

    if (inWeek) admissionsCounts[bucket].week += 1;
    if (inMonth) admissionsCounts[bucket].month += 1;

    if (bucket === "studentsEnrolled" && grade) {
      const match = enrollmentByGrade.find(
        (g) => g.grade.toLowerCase() === grade.toLowerCase(),
      );
      if (match) match.current += 1;
    }
  }

  const enrolledTotal = enrollmentByGrade.reduce((s, g) => s + g.current, 0);
  if (enrolledTotal === 0 && currentAdmitted > 0) {
    enrollmentByGrade[0].current = currentAdmitted;
  }

  const enrollmentTrend = MONTH_COLS.map((col, i) => ({
    month: `M${i + 1}`,
    students: num(cell(forecast, `${col}8`)),
  }));

  const totalMonthlyIncome = forecastValue(forecast, 13, currentIndex);
  const totalMonthlyExpenses = forecastValue(forecast, 26, currentIndex);
  const tuitionRevenue = forecastValue(forecast, 11, currentIndex);
  const netCashFlow = forecastValue(forecast, 27, currentIndex);
  const cashBalance = forecastValue(forecast, 28, currentIndex);
  const totalStudents =
    enrolledTotal > 0 ? enrolledTotal : endingStudents || currentAdmitted;

  const payload = {
    generatedAt: now.toISOString(),
    currentMonth: {
      index: currentIndex,
      label: `Month ${currentIndex + 1}`,
      startMonth: parseDate(startMonth)?.toISOString() ?? null,
    },
    kpis: {
      totalStudents,
      tuitionRevenue,
      totalExpenses: totalMonthlyExpenses,
      netCashFlow,
      cashBalance,
    },
    enrollment: {
      byGrade: enrollmentByGrade,
      trend: enrollmentTrend,
    },
    financial: {
      totalMonthlyIncome,
      totalMonthlyExpenses,
      netCashFlow,
      endingCashBalance: cashBalance,
      incomeVsExpenses: [
        { name: "Income", value: totalMonthlyIncome },
        { name: "Expenses", value: totalMonthlyExpenses },
      ],
    },
    admissions: admissionsCounts,
    assumptions: {
      averageTuition: num(cell(assumptions, "B7")),
      collectionRate: num(cell(assumptions, "B8")),
      monthlyOwnerFunding: num(cell(assumptions, "B6")),
      totalMonthlySalaries: num(cell(assumptions, "D22")),
      breakEvenStudents: String(cell(forecast, "P8") ?? ""),
    },
    actionItems: [],
  };

  payload.actionItems = buildActionItems(payload);

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(payload, null, 2));
  console.log(`Dashboard data written to ${OUTPUT}`);
}

main();
