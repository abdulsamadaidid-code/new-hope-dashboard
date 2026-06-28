import { NextResponse } from "next/server";
import { computeDashboard, normalizeSource } from "@/lib/compute-dashboard";
import {
  readDashboardSource,
  writeDashboardSource,
} from "@/lib/edge-config-store";
import type { DashboardSource } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const source = await readDashboardSource();
  const data = computeDashboard(source);
  return NextResponse.json({ source, data });
}

export async function PATCH(request: Request) {
  let body: DashboardSource;

  try {
    body = (await request.json()) as DashboardSource;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.enrollmentByGrade || !body.forecastMonths) {
    return NextResponse.json(
      { error: "Missing required dashboard fields." },
      { status: 400 },
    );
  }

  const source = normalizeSource(body);
  const result = await writeDashboardSource(source);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const data = computeDashboard(source);
  return NextResponse.json({ source, data });
}
