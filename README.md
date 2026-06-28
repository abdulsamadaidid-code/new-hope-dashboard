# New Hope Dashboard

Management dashboard for New Hope School — reads from the startup financial model workbook and deploys to Vercel.

## Update data

1. Edit `data/New_Hope_Startup_Financial_Model_Template.xlsx`
2. Redeploy (or run `npm run import-data` locally)

The import script runs automatically before `dev` and `build`.

## Local development

```bash
npm install
npm run dev
```

## Deploy

Push to GitHub; Vercel rebuilds and refreshes dashboard data from the workbook on each deploy.
