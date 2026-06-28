import { DashboardShell } from "@/components/dashboard-shell";
import { computeDashboard } from "@/lib/compute-dashboard";
import { readDashboardSource } from "@/lib/edge-config-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const source = await readDashboardSource();
  const data = computeDashboard(source);

  return <DashboardShell initialSource={source} initialData={data} />;
}
