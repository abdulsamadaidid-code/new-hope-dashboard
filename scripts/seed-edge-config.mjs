/**
 * Seeds the dashboard source into Vercel Edge Config.
 * Requires VERCEL_API_TOKEN (or VERCEL_TOKEN) and EDGE_CONFIG_ID.
 * Optional: VERCEL_TEAM_ID
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const EDGE_CONFIG_KEY = "dashboard";

const GRADES = ["KG1", "KG2", "Grade 1", "Grade 2", "Grade 3", "Grade 4"];

function monthLabel(startMonth, offset) {
  const start = new Date(startMonth);
  const date = new Date(start.getFullYear(), start.getMonth() + offset, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function createDefaultSource() {
  const startMonth = "2026-07-01T00:00:00.000Z";
  const forecastMonths = [
    { monthOffset: 0, students: 13, tuitionRevenue: 926.25, totalExpenses: 0, isActual: true },
    { monthOffset: 1, students: 19, tuitionRevenue: 1353.75, totalExpenses: 0, isActual: false },
    { monthOffset: 2, students: 26, tuitionRevenue: 1852.5, totalExpenses: 0, isActual: false },
    { monthOffset: 3, students: 34, tuitionRevenue: 2422.5, totalExpenses: 0, isActual: false },
    { monthOffset: 4, students: 42, tuitionRevenue: 2992.5, totalExpenses: 0, isActual: false },
    { monthOffset: 5, students: 50, tuitionRevenue: 3562.5, totalExpenses: 0, isActual: false },
    { monthOffset: 6, students: 57, tuitionRevenue: 4061.25, totalExpenses: 0, isActual: false },
    { monthOffset: 7, students: 64, tuitionRevenue: 4560, totalExpenses: 0, isActual: false },
    { monthOffset: 8, students: 70, tuitionRevenue: 4987.5, totalExpenses: 0, isActual: false },
    { monthOffset: 9, students: 75, tuitionRevenue: 5343.75, totalExpenses: 0, isActual: false },
    { monthOffset: 10, students: 80, tuitionRevenue: 5700, totalExpenses: 0, isActual: false },
    { monthOffset: 11, students: 85, tuitionRevenue: 6056.25, totalExpenses: 0, isActual: false },
  ].map((month) => ({
    ...month,
    label: monthLabel(startMonth, month.monthOffset),
  }));

  return {
    updatedAt: new Date().toISOString(),
    startMonth,
    currentMonthIndex: 0,
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
