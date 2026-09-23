# Investarterpoint[README.md](https://github.com/user-attachments/files/32562529/README.md)
# Northstar — investment research portfolio

A working company dashboard built with React, TypeScript, Tailwind CSS, Recharts, and Vinext (a Vite-based implementation of the Next.js App Router). The API uses standard Request/Response objects. A separate Python service is not required for this version.

## Start locally

With Node.js 22.13+ and npm installed:

```sh
npm ci
npm run dev
```

Open http://localhost:5173. Keep the terminal running; Ctrl+C stops the website. Editing a source file updates the preview automatically.

On this computer, Codex used its bundled Node runtime because a system-wide Node/npm installation was not present. You can also restart using this project-local script:

```sh
./start-local.sh
```

This fallback uses the dependencies already installed in this folder. Install Node/npm normally before setting up a fresh copy on another computer.

## Try the first version

- Search NVDA, AAPL, or MSFT, or click a sample ticker. Search accepts lowercase and surrounding spaces.
- Select 6M, 1Y, or 2Y to change the price chart's window.
- Switch between revenue, net income, and free cash flow in the annual chart.
- An unsupported ticker displays a helpful error and explicitly identifies the previous company still displayed.
- DCF, IPO, screener, and AI research are labeled placeholder modules.

All numeric values are fictional educational samples, including prices and financial statements. They are not historical records, live data, or investment recommendations. Prices are monthly fixtures spanning January 2024–December 2025. Period buttons select the last 6, 12, or 24 monthly observations; percentage change is last price divided by first visible price minus one. These are sample-window changes, not precisely dated trailing returns.

## Understand the structure

```text
app/page.tsx                    Interactive dashboard and module placeholders
app/globals.css                 Visual theme and responsive layout
app/layout.tsx                  Shared HTML shell and page metadata
app/api/companies/[ticker]/     GET endpoint for a company
lib/company.ts                  Shared TypeScript data contract and units
lib/sample-data.ts              Fictional company data
lib/api.ts                      Browser-to-server request function
components/ui/                  Reusable accessible interface controls
public/favicon.svg              Northstar browser icon
```

Data flows from `sample-data.ts` → API route → `getCompany()` → React state → metrics and charts. React state remembers the selected company and chart period. Tailwind supplies utility classes and shared control styling; named CSS classes keep the dashboard layout easy to trace.

Start learning by changing a company description in `lib/sample-data.ts`. Then adjust the blue theme in `app/globals.css`. Finally add a fourth company matching `Company` in `lib/company.ts` and search its ticker.

## Future FastAPI backend

The frontend needs `GET /api/companies/{ticker}` returning the JSON shape defined in `lib/company.ts`. Inspect `/api/companies/NVDA` locally for a complete example. Return HTTP 404 with an error object when the company does not exist.

To connect FastAPI later, implement that same endpoint, permit the frontend origin with FastAPI's CORS middleware, and put this in `.env.local`:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Restart the frontend after changing environment variables. Keep financial-provider API keys in backend environment variables, never in variables beginning with `NEXT_PUBLIC_`. The browser client already supports this base-URL switch. No Python server is implemented in this MVP.

Future real data should include source links, reporting periods, timestamps, currency, and definitions. Reconcile fiscal periods and stock splits before calculating comparisons. Revenue growth is `(latest / previous - 1) * 100`; net margin is `net income / revenue * 100`. Other ratios in this demo are fixture values.

## Checks

```sh
npx tsc --noEmit
npm run build
```

The starter also includes unused storage and hosting scaffolding for future expansion. You do not need it to learn the dashboard. This version runs locally and has not been published.
