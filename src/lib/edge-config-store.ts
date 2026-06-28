import { get } from "@vercel/edge-config";
import { computeDashboard, normalizeSource } from "./compute-dashboard";
import { createDefaultSource } from "./default-source";
import type { DashboardData, DashboardSource } from "./types";
import { EDGE_CONFIG_KEY } from "./types";

export async function readDashboardSource(): Promise<DashboardSource> {
  if (!process.env.EDGE_CONFIG) {
    return createDefaultSource();
  }

  const stored = await get<DashboardSource>(EDGE_CONFIG_KEY);
  if (!stored) {
    return createDefaultSource();
  }

  return normalizeSource(stored);
}

export async function readDashboard(): Promise<DashboardData> {
  const source = await readDashboardSource();
  return computeDashboard(source);
}

interface WriteEnv {
  token: string;
  edgeConfigId: string;
  teamId?: string;
}

function getWriteEnv(): WriteEnv | null {
  const token = process.env.VERCEL_API_TOKEN ?? process.env.VERCEL_TOKEN;
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !edgeConfigId) return null;
  return { token, edgeConfigId, teamId };
}

export async function writeDashboardSource(
  source: DashboardSource,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const env = getWriteEnv();
  if (!env) {
    return {
      ok: false,
      error:
        "Edge Config write is not configured. Set VERCEL_API_TOKEN and EDGE_CONFIG_ID.",
    };
  }

  const payload = normalizeSource({
    ...source,
    updatedAt: new Date().toISOString(),
  });

  const url = new URL(
    `https://api.vercel.com/v1/edge-config/${env.edgeConfigId}/items`,
  );
  if (env.teamId) url.searchParams.set("teamId", env.teamId);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${env.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          operation: "upsert",
          key: EDGE_CONFIG_KEY,
          value: payload,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return {
      ok: false,
      error: `Edge Config update failed (${response.status}): ${errorBody}`,
    };
  }

  const json = (await response.json()) as { status?: string };
  if (json.status !== "ok") {
    return { ok: false, error: "Edge Config update returned an unexpected response." };
  }

  return { ok: true };
}
