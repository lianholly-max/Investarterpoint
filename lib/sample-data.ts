import type { Company } from "./company";
// Educational fixtures, deliberately separate from the UI and API transport.
function prices(base: number) {
  return [
    0.67, 0.7, 0.69, 0.74, 0.72, 0.77, 0.81, 0.78, 0.82, 0.79, 0.76, 0.85, 0.89,
    0.86, 0.9, 0.94, 0.88, 0.91, 0.96, 0.93, 0.98, 0.95, 0.97, 1,
  ].map((v, i) => ({
    date: new Date(Date.UTC(2024, i, 1)).toISOString().slice(0, 10),
    price: +(base * v).toFixed(2),
  }));
}
function annual(rows: number[][]) {
  return rows.map(([revenue, income, fcf], i) => ({
    year: String(2022 + i),
    revenue,
    income,
    fcf,
  }));
}
export const companies: Record<string, Company> = {
  NVDA: {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    sector: "Semiconductors",
    description:
      "Designs accelerated computing platforms, graphics processors, and software for AI, data centers, gaming, and professional visualization.",
    cap: 3280,
    pe: 48.6,
    gross: 74.2,
    roe: 91.4,
    roic: 58.3,
    prices: prices(134.8),
    financials: annual([
      [27, 4.4, 3.8],
      [44, 12.5, 11.2],
      [76, 33.4, 29.1],
      [118, 62.5, 54.2],
    ]),
  },
  AAPL: {
    ticker: "AAPL",
    name: "Apple Inc.",
    sector: "Consumer technology",
    description:
      "Creates consumer devices, software, and services across a connected ecosystem of personal computing, entertainment, and communications products.",
    cap: 3010,
    pe: 31.2,
    gross: 45.8,
    roe: 142.1,
    roic: 48.7,
    prices: prices(201.4),
    financials: annual([
      [365, 91, 88],
      [380, 95, 94],
      [397, 99, 101],
      [418, 108, 112],
    ]),
  },
  MSFT: {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    sector: "Software & cloud",
    description:
      "Develops software, cloud infrastructure, productivity tools, and AI services for individuals and organizations.",
    cap: 3150,
    pe: 35.4,
    gross: 69.3,
    roe: 34.2,
    roic: 25.8,
    prices: prices(423.6),
    financials: annual([
      [198, 70, 65],
      [216, 76, 68],
      [245, 89, 75],
      [281, 103, 84],
    ]),
  },
};
