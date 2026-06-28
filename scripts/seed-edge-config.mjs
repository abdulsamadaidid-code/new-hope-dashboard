/**
 * Seeds the dashboard source into Vercel Edge Config.
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const EDGE_CONFIG_KEY = "dashboard";

// Reuse compiled defaults via dynamic import of the built module is awkward in mjs;
// keep a minimal inline seed aligned with createDefaultSource.
const GRADES = ["KG1", "KG2", "Grade 1", "Grade 2", "Grade 3", "Grade 4"];
const OPENING = [13, 19, 26, 34, 42, 50, 57, 64, 70, 75, 80, 85];

function monthKey(startMonth, offset) {
  const start = new Date(startMonth);
  const date = new Date(start.getFullYear(), start.getMonth() + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(startMonth, offset) {
  const start = new Date(startMonth);
  const date = new Date(start.getFullYear(), start.getMonth() + offset, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function metric(monthKey, value, source) {
  return {
    month: monthKey,
    value,
    source,
    lastUpdated: new Date().toISOString(),
  };
}

function createDefaultSource() {
  const startMonth = "2026-07-01T00:00:00.000Z";
  const currentMonthIndex = 0;

  const forecastMonths = OPENING.map((students, monthOffset) => {
    const key = monthKey(startMonth, monthOffset);
    const isActual = monthOffset <= currentMonthIndex;
    const source = isActual ? "actual" : "forecast";
    return {
      monthKey: key,
      label: monthLabel(startMonth, monthOffset),
      monthOffset,
      students: metric(key, students, source),
      tuitionRevenue: metric(key, students * 75 * 0.95, source),
      totalExpenses: metric(key, 0, source),
    };
  });

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
      defaultConversionRates: {
        inquiryToVisit: 0.6,
        visitToApplication: 0.5,
        applicationToAdmitted: 0.7,
        admittedToEnrolled: 0.85,
        usingDefaults: true,
      },
      openingEnrollmentPlan: [...OPENING],
    },
    admissions: {
      inquiries: { week: 0, month: 0 },
      schoolVisits: { week: 0, month: 0 },
      applications: { week: 0, month: 0 },
      studentsAdmitted: { week: 0, month: 0 },
      studentsEnrolled: { week: 0, month: 0 },
    },
    admissionsByMonth: [],
    expenseCategories: [
      { id: "rent", name: "Rent", isFixed: true, amount: 0 },
      { id: "salaries", name: "Salaries", isFixed: true, amount: 0 },
      { id: "utilities", name: "Utilities & supplies", isFixed: false, amount: 0 },
      { id: "marketing", name: "Marketing & admissions", isFixed: false, amount: 0 },
    ],
    forecastMonths,
  };
}

async function main() {
  const token = process.env.VERCEL_API_TOKEN ?? process.env.VERCEL_TOKEN;
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !edgeConfigId) {
    console.error("Set VERCEL_API_TOKEN and EDGE_CONFIG_ID before seeding.");
    process.exit(1);
  }

  const url = new URL(
    `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
  );
  if (teamId) url.searchParams.set("teamId", teamId);

  const source = createDefaultSource();

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ operation: "upsert", key: EDGE_CONFIG_KEY, value: source }],
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    console.error(`Seed failed (${response.status}):`, body);
    process.exit(1);
  }

  console.log("Seeded dashboard data to Edge Config.");
  console.log(body);
}

main();
