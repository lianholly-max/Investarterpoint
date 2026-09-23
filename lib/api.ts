import type { Company } from "./company";
// Set this base URL to a FastAPI server later; keep the same response contract.
export async function getCompany(
  ticker: string,
  signal?: AbortSignal,
): Promise<Company> {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
  const response = await fetch(
    `${base}/api/companies/${encodeURIComponent(ticker.trim().toUpperCase())}`,
    { signal },
  );
  if (response.status === 404)
    throw new Error(
      "Ticker unavailable in this demo. Try NVDA, AAPL, or MSFT.",
    );
  if (!response.ok)
    throw new Error("Could not load the company. Please try again.");
  return response.json();
}
