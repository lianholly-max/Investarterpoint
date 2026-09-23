import { companies } from "@/lib/sample-data";
export async function GET(
  _request: Request,
  context: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await context.params;
  const key = ticker.toUpperCase();
  if (!Object.hasOwn(companies, key))
    return Response.json({ error: "Company not found" }, { status: 404 });
  return Response.json(companies[key]);
}
