# Northstar — Investment Research Portfolio

A personal investment-analysis website for exploring company fundamentals, financial performance, and valuation concepts.

## Project Status

The first version includes a working Company Dashboard. All financial figures and prices are fictional sample data for educational use.

## Features

- Search sample companies: NVDA, AAPL, and MSFT
- View market capitalization, revenue, profit margin, and free cash flow
- Explore sample price charts across three time windows
- Compare annual revenue, net income, and free cash flow
- View sample profitability and valuation ratios
- Responsive layout for desktop and mobile

## Planned Features

The following modules currently contain placeholders:

- Discounted Cash Flow valuation
- IPO analysis
- Stock screener
- AI-assisted investment research

## Technology

- React and TypeScript
- Vinext — a Vite-based implementation of the Next.js API
- Tailwind CSS
- Recharts
- API route handlers for company data

## Getting Started

Install Node.js 22.13 or newer and npm.

Clone this repository:

```bash
git clone https://github.com/lianholly-max/Investarterpoint.git
cd Investarterpoint
```

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Open the local address printed in the terminal, normally:

```text
http://127.0.0.1:5173
```

## Project Structure

```text
app/
  page.tsx                    Company dashboard
  layout.tsx                  Shared page layout and metadata
  globals.css                 Theme and responsive styles
  api/companies/[ticker]/
    route.ts                  Company API endpoint

lib/
  company.ts                  Shared company data type
  sample-data.ts              Fictional company data
  api.ts                      Frontend API client

components/                   Reusable interface components
hooks/                        Shared React hooks
public/                       Static assets
scripts/                      Development and build scripts
build/                        Supporting build code
vendor/                       Shared styling dependencies
.openai/hosting.json           Starter hosting configuration
```

## Sample API

Request:

```http
GET /api/companies/NVDA
```

Supported sample tickers:

```text
NVDA
AAPL
MSFT
```

Unknown tickers return HTTP 404.

Financial-statement values are expressed in USD billions.
Share prices are expressed in USD.

## Financial Calculations

```text
Revenue growth (%) =
(Current revenue / Previous revenue - 1) × 100

Net profit margin (%) =
Net income / Revenue × 100

Free cash flow margin (%) =
Free cash flow / Revenue × 100

Sample price change (%) =
(Last visible price / First visible price - 1) × 100
```

Chart periods select the last 6, 12, or 24 monthly observations.
The resulting changes describe those sample windows.

Other displayed ratios are illustrative fixture values.

## Connecting a Future Backend

The frontend uses the built-in sample API by default.

To connect a separate backend, create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

The backend must provide:

```http
GET /api/companies/{ticker}
```

Its JSON response must match the `Company` type in `lib/company.ts`.

A FastAPI backend can implement this contract. Configure CORS
to allow the frontend origin and restart the frontend after
changing environment variables.

A separate Python backend is not included in this version.

Keep financial-data provider API keys on the backend.
Never place secret keys in `NEXT_PUBLIC_` variables.

## Validation

Check TypeScript:

```bash
npx tsc --noEmit
```

Build the application:

```bash
npm run build
```

## Learning Goals

- Translate financial concepts into an interactive application
- Structure company data behind an API
- Build reusable React interfaces
- Visualize financial performance
- Develop toward real-data investment research tools

## Disclaimer

This project is an educational portfolio demonstration.
All numeric data is fictional and is not live market data,
reported financial information, or investment advice.
