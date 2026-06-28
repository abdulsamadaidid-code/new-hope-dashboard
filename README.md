# New Hope Dashboard

Management dashboard for New Hope School. Data is stored in **Vercel Edge Config** and updated through the built-in editor — no spreadsheet or rebuild required.

## Live dashboard

https://new-hope-dashboard-nine.vercel.app

## How data works

- **Read:** dashboard loads from Edge Config on each request
- **Write:** use **Edit data** in the dashboard UI — saves via the Vercel REST API
- **No auth:** keep the URL private within your team

## Environment variables

| Variable | Purpose |
|----------|---------|
| `EDGE_CONFIG` | Auto-injected when Edge Config is linked to the Vercel project |
| `VERCEL_API_TOKEN` | API token for saving edits (same as deploy token) |
| `EDGE_CONFIG_ID` | Edge Config store ID (`ecfg_…`) |
| `VERCEL_TEAM_ID` | Team ID if using a Vercel team scope |

Copy `.env.example` to `.env.local` for local development.

## Local development

```bash
npm install
npm run dev
```

Without `EDGE_CONFIG` set locally, the app falls back to built-in default data. Saves require the write env vars.

## Seed Edge Config (first-time setup)

```bash
export VERCEL_API_TOKEN=...
export EDGE_CONFIG_ID=ecfg_...
export VERCEL_TEAM_ID=...   # optional
npm run seed-edge-config
```

## Deploy

Push to `main` on GitHub — Vercel deploys automatically. Updating dashboard numbers does **not** require a redeploy.
