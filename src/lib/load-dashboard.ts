import fs from "fs";
import path from "path";
import type { DashboardData } from "./types";

export function loadDashboard(): DashboardData {
  const jsonPath = path.join(process.cwd(), "src/data/dashboard.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  return JSON.parse(raw) as DashboardData;
}
