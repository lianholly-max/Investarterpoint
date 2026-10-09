"""Add a free SEC financials page to your existing Codespaces project.
Run: python3 add_sec.py
This writes source files locally; it does not publish or commit anything.
"""
from pathlib import Path
from datetime import datetime
import re
import sys

FILES = {
'app/api/sec-financials/[ticker]/route.ts': r'''import { normalize, type Facts, type Financials } from '@/lib/sec-financials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
type Listing = { cik_str: number; ticker: string; title: string };
let listings: { time: number; rows: Listing[] } | undefined;
let listingRequest: Promise<Listing[]> | undefined;
const cache = new Map<string, { time: number; data: Financials }>();
const pending = new Map<string, Promise<Financials>>();
let nextRequest = 0;
let cooldownUntil = 0;

async function secJSON(url: string, userAgent: string) {
  if (Date.now() < cooldownUntil) throw new ApiError('SEC access is temporarily limited. Please try again in a few minutes.', 503);
  // At most ~3 outgoing starts per second in this server process; no automatic retries.
  const start = Math.max(Date.now(), nextRequest);
  nextRequest = start + 350;
  await new Promise(resolve => setTimeout(resolve, Math.max(0, start-Date.now())));
  if (Date.now() < cooldownUntil) throw new ApiError('SEC access is temporarily limited. Please try again later.', 503);
  let response: Response;
  try {
    response = await fetch(url, { headers: { 'User-Agent': userAgent, Accept: 'application/json' }, signal: AbortSignal.timeout(20000), cache: 'no-store' });
  } catch { throw new ApiError('The SEC request timed out or could not connect. Try again later.', 502); }
  if (response.status === 403 || response.status === 429) {
    cooldownUntil = Date.now() + 60000;
    throw new ApiError('SEC access was blocked or rate-limited. Check your server contact setting and try again later. No sample data was substituted.', 503);
  }
  if (response.status === 404) throw new ApiError('SEC company facts are unavailable for this ticker.', 404);
  if (!response.ok) throw new ApiError('SEC data is temporarily unavailable. Please try again later.', 502);
  try { return await response.json(); } catch { throw new ApiError('SEC returned an unexpected response. Please try again later.', 502); }
}
async function tickerList(userAgent: string): Promise<Listing[]> {
  if (listings && Date.now()-listings.time < 86400000) return listings.rows;
  if (!listingRequest) listingRequest = (async () => {
    const json = await secJSON('https://www.sec.gov/files/company_tickers.json', userAgent);
    const rows = Object.values(json as Record<string, Listing>).filter(row =>
      typeof row.ticker === 'string' && Number.isInteger(row.cik_str) && row.cik_str > 0);
    if (!rows.length) throw new ApiError('SEC ticker directory is unavailable.', 502);
    listings = { time: Date.now(), rows };
    return rows;
  })().finally(() => { listingRequest = undefined; });
  return listingRequest;
}
async function load(ticker: string, userAgent: string) {
  const rows = await tickerList(userAgent);
  const listing = rows.find(row => row.ticker.toUpperCase() === ticker);
  if (!listing) throw new ApiError('Ticker not found in the SEC directory. Try AAPL, MSFT, or NVDA.', 404);
  const cik = String(listing.cik_str).padStart(10, '0');
  const raw = await secJSON(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, userAgent) as Facts;
  let data: Financials;
  try { data = normalize(raw, ticker, cik); }
  catch(e) { throw new ApiError(e instanceof Error ? e.message : 'Unsupported company financials.', 422); }
  if (cache.size >= 100) cache.delete(cache.keys().next().value!);
  cache.set(ticker, { time: Date.now(), data });
  return data;
}
export async function GET(_request: Request, context: { params: Promise<{ ticker: string }> }) {
  try {
    const { ticker: input } = await context.params;
    const ticker = input.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(ticker)) throw new ApiError('Enter a valid ticker, for example AAPL.', 400);
    const userAgent = process.env.SEC_USER_AGENT?.trim();
    if (!userAgent || !/^[^\r\n]{3,160}\s+[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userAgent) || /example\.com|YOUR_EMAIL|your-email/i.test(userAgent))
      throw new ApiError('Setup needed: set SEC_USER_AGENT to your app name and real contact email in .env.local, then restart the server.', 503);
    const saved = cache.get(ticker);
    if (saved && Date.now()-saved.time < 3600000) return Response.json(saved.data, { headers: { 'Cache-Control': 'public, max-age=300' } });
    if (!pending.has(ticker)) {
      if (pending.size >= 5) throw new ApiError('The server is busy. Please try again shortly.', 429);
      pending.set(ticker, load(ticker, userAgent).finally(()=>{pending.delete(ticker);}));
    }
    return Response.json(await pending.get(ticker), { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch(e) {
    const status = e instanceof ApiError ? e.status : 502;
    return Response.json({ error: e instanceof ApiError ? e.message : 'Could not load SEC financials. Please try again later.' },
      { status, headers: { 'Cache-Control': 'no-store', ...(status===503 || status===429 ? { 'Retry-After':'60' } : {}) } });
  }
}
''',
'app/financials/page.tsx': r''''use client';
import { useEffect, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Financials } from '@/lib/sec-financials';
const number = (v: number | null) => v === null ? '—' : v.toLocaleString('en-US', { maximumFractionDigits: 1 });
export default function SECFinancials() {
  const [ticker, setTicker] = useState('AAPL');
  const [data, setData] = useState<Financials | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(()=>()=>controller.current?.abort(), []);
  async function search() {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setBusy(true); setError(''); setData(null);
    try {
      const response = await fetch(`/api/sec-financials/${encodeURIComponent(ticker.trim().toUpperCase())}`, { signal: request.signal });
      const result = await response.json() as Financials & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not load financials.');
      if (!Array.isArray(result.years) || !result.years.length) throw new Error('No annual data returned.');
      setData(result); setTicker(result.ticker);
    } catch(e) { if (!request.signal.aborted) setError(e instanceof Error ? e.message : 'Could not load financials.'); }
    finally { if (!request.signal.aborted) setBusy(false); }
  }
  const latest = data?.years.at(-1);
  const margin = latest && latest.income !== null && latest.revenue > 0 ? latest.income/latest.revenue*100 : null;
  return <main className="mx-auto max-w-6xl space-y-6">
    <a href="/" className="text-sm text-blue-700 underline">← Back to dashboard & DCF</a>
    <header><p className="eyebrow">COMPANY FILINGS</p><h1>SEC financials</h1><p className="mt-3 text-sm leading-6 text-slate-600">Reported annual results from SEC EDGAR. This page contains no sample figures or stock-price quotes.</p></header>
    <form className="panel flex flex-wrap items-end gap-3 p-5" onSubmit={e=>{e.preventDefault();void search();}}>
      <label className="min-w-0 flex-1 text-sm font-medium" htmlFor="sec-ticker">Company ticker<Input id="sec-ticker" className="mt-2 bg-white" value={ticker} maxLength={15} onChange={e=>setTicker(e.target.value)} placeholder="AAPL, MSFT, NVDA…" autoComplete="off" required/></label>
      <Button type="submit" disabled={busy || !ticker.trim()}>{busy?'Loading filings…':'Load real financials'}</Button>
    </form>
    {busy && <p role="status" className="text-sm text-slate-600">Fetching SEC filings. The first request may take several seconds.</p>}
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {!data && !busy && !error && <p className="text-sm text-slate-600">Enter a ticker above. Coverage depends on available standard US-GAAP tags in annual 10-K filings.</p>}
    {data && latest && <>
      <section><h2>{data.name} · {data.ticker}</h2><p className="mt-2 text-sm text-slate-600">Latest supported annual period: {latest.start} to {latest.end}. Source filed {latest.filed}.</p><p className="mt-1 text-xs text-slate-500">Fetched {data.fetchedAt.replace('T',' ').slice(0,19)} UTC · values shown in USD millions · not live quotes</p></section>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
        ['Revenue',`$${number(latest.revenue)}M`],['Net income',latest.income===null?'—':`$${number(latest.income)}M`],
        ['Net margin',margin===null?'—':`${number(margin)}%`],['CFO less capex',latest.freeCashFlow===null?'—':`$${number(latest.freeCashFlow)}M`],
      ].map(([label,value])=><section className="panel p-5" key={label}><p className="text-sm text-slate-600">{label}</p><p className="mt-3 break-words text-2xl font-semibold text-blue-700">{value}</p></section>)}</div>
      <section className="panel min-w-0 p-5"><h3>Annual revenue · USD millions</h3><div className="mt-4 h-64 min-w-0" role="img" aria-label="Revenue chart; exact values and source links are in the table below."><ResponsiveContainer width="100%" height="100%"><BarChart data={data.years}><CartesianGrid vertical={false}/><XAxis dataKey="end" tick={{fontSize:12}}/><YAxis width={75} tickFormatter={v=>number(v)} tick={{fontSize:12}}/><Tooltip formatter={v=>[`$${number(Number(v))}M`,'Revenue']}/><Bar dataKey="revenue" fill="#3264ed" radius={[4,4,0,0]} isAnimationActive={false}/></BarChart></ResponsiveContainer></div></section>
      <section className="panel min-w-0 p-5"><h3 className="mb-4">Annual statements · USD millions</h3><Table><TableHeader><TableRow>{['Period ended','Revenue','Net income','Operating cash flow','Capex','CFO − capex','Filing'].map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{data.years.map(row=><TableRow key={row.end}><TableCell><span>{row.end}</span><small className="block text-slate-500">from {row.start}</small></TableCell>{[row.revenue,row.income,row.operating,row.capex,row.freeCashFlow].map((v,i)=><TableCell key={i} className="text-right tabular-nums">{number(v)}</TableCell>)}<TableCell><a className="text-blue-700 underline" href={row.source} target="_blank" rel="noreferrer">Filed {row.filed} ↗</a></TableCell></TableRow>)}</TableBody></Table></section>
    </>}
    <section className="panel p-5 text-sm leading-7 text-slate-600"><h3>Read the figures in context</h3><p>These are annual reporting periods, not calendar-year or trailing-twelve-month estimates. For each period, the table selects the latest available revenue filing and matches the other facts to that same period and filing. Later filings can revise earlier results.</p><p className="mt-2">A dash means a supported matching fact is missing or ambiguous, not zero. Company-specific tags, non-USD reporting, and IFRS are not supported in this first connection. Check the linked statements before using figures in research.</p><p className="mt-2">CFO less capex is calculated here from reported operating cash flow and purchases of property, plant, and equipment. It is not automatically the unlevered free cash flow used by your DCF model. The DCF remains a separate editable scenario.</p><p className="mt-2">The original dashboard still uses sample data. Stock quotes, market cap, and P/E require a separately licensed market-data connection.</p></section>
  </main>;
}
''',
'lib/sec-financials.ts': r'''// SEC Company Facts uses raw dollars. Convert once to millions for display.
export type Fact = { val: number; start?: string; end: string; filed: string; form: string; accn: string };
export type Facts = { cik: number; entityName: string; facts?: Record<string, Record<string, { units?: Record<string, Fact[]> }>> };
export type Annual = { start: string; end: string; filed: string; source: string; revenue: number; income: number | null; operating: number | null; capex: number | null; freeCashFlow: number | null };
export type Financials = { ticker: string; cik: string; name: string; fetchedAt: string; years: Annual[] };
const tags = {
  revenue: ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet', 'RevenueFromContractWithCustomerIncludingAssessedTax'],
  income: ['NetIncomeLoss', 'ProfitLoss'],
  operating: ['NetCashProvidedByUsedInOperatingActivities'],
  capex: ['PaymentsToAcquirePropertyPlantAndEquipment'],
};
const day = 86400000;
function annual(f: Fact) {
  const duration = (Date.parse(f.end) - Date.parse(f.start ?? '')) / day;
  return ['10-K', '10-K/A'].includes(f.form) && duration >= 330 && duration <= 380
    && Number.isFinite(f.val) && /^\d{10}-\d{2}-\d{6}$/.test(f.accn)
    && /^\d{4}-\d{2}-\d{2}$/.test(f.filed);
}
export function normalize(raw: Facts, ticker: string, cik: string): Financials {
  const gaap = raw.facts?.['us-gaap'];
  if (!gaap || Number(raw.cik) !== Number(cik)) throw new Error('No supported US-GAAP company facts are available.');
  // Prefer the latest filing, then the preferred revenue tag. Never add competing tags.
  const candidates = tags.revenue.flatMap((tag, priority) =>
    (gaap[tag]?.units?.USD ?? []).filter(annual).map(f => ({ ...f, priority }))
  ).sort((a,b) => b.filed.localeCompare(a.filed) || a.priority-b.priority || b.accn.localeCompare(a.accn));
  const periods = new Map<string, (typeof candidates)[number]>();
  for (const f of candidates) if (!periods.has(f.end)) periods.set(f.end, f);
  // Reject conflicting values for the same tag and filing instead of guessing.
  const pick = (names: string[], anchor: Fact): number | null => {
    for (const name of names) {
      const matches = (gaap[name]?.units?.USD ?? []).filter(f => annual(f) &&
        f.start === anchor.start && f.end === anchor.end && f.accn === anchor.accn);
      const values = [...new Set(matches.map(f => f.val))];
      if (values.length > 1) return null;
      if (values.length === 1) return values[0] / 1e6;
    }
    return null;
  };
  const years: Annual[] = [...periods.values()].sort((a,b)=>a.end.localeCompare(b.end)).slice(-4).map(f => {
    const revenue = pick(tags.revenue, f);
    const operating = pick(tags.operating, f);
    const capex = pick(tags.capex, f);
    return {
      start: f.start!, end: f.end, filed: f.filed,
      source: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${f.accn.replaceAll('-', '')}/${f.accn}-index.html`,
      revenue: revenue ?? NaN, income: pick(tags.income, f), operating, capex,
      freeCashFlow: operating !== null && capex !== null && capex >= 0 ? operating-capex : null,
    };
  }).filter(f => Number.isFinite(f.revenue));
  if (!years.length) throw new Error('No supported annual USD revenue facts were found. This starter supports standard US-GAAP tags in 10-K filings, not every security.');
  return { ticker, cik, name: raw.entityName, fetchedAt: new Date().toISOString(), years };
}
''',
}

def main():
    root = Path.cwd()
    page = root / 'app/page.tsx'
    if not page.is_file() or not (root / 'package.json').is_file():
        sys.exit('Run this from your website folder containing package.json.')
    original = page.read_text()
    if 'SEC-FINANCIALS-LINK' in original:
        sys.exit('SEC financials is already installed. No files were changed.')
    matches = list(re.finditer(r'<main(?:\s[^>]*)?>', original))
    if len(matches) != 1:
        sys.exit('The dashboard structure changed. No files were changed. Ask for help connecting the new page.')
    for name in FILES:
        if (root / name).exists():
            sys.exit(f'{name} already exists. No files were changed.')
    link = """
          {/* SEC-FINANCIALS-LINK */}
          <div className="panel mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-slate-600">Real annual company filings are now available.</p>
            <a href="/financials" className="text-sm font-semibold text-blue-700 underline">Open SEC financials →</a>
          </div>
"""
    pos = matches[0].end()
    updated = original[:pos] + link + original[pos:]
    ignore = root / '.gitignore'
    old_ignore = ignore.read_text() if ignore.exists() else None
    # Keep environment values and generated files out of Git even if the original ignore file was not uploaded.
    rules = ['node_modules/', 'dist/', '.next/', '.vinext/', '.wrangler/', '.sites-runtime/', '*.tsbuildinfo', 'next-env.d.ts', '.env*', '!.env.example']
    new_ignore = (old_ignore or '').rstrip() + '\n\n# Local data and generated files\n' + '\n'.join(rules) + '\n'
    backup = Path.home() / '.investment-dashboard-backups' / ('sec-' + datetime.now().strftime('%Y%m%d-%H%M%S-%f'))
    backup.mkdir(parents=True)
    # .txt prevents the editor from type-checking a backup outside the project.
    (backup / 'page.tsx.txt').write_text(original)
    if old_ignore is not None:
        (backup / 'gitignore.txt').write_text(old_ignore)
    created = []
    try:
        for name, content in FILES.items():
            target = root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content)
            created.append(target)
        page.write_text(updated)
        ignore.write_text(new_ignore)
    except Exception:
        page.write_text(original)
        if old_ignore is not None: ignore.write_text(old_ignore)
        else: ignore.unlink(missing_ok=True)
        for target in created: target.unlink(missing_ok=True)
        raise
    print('Installed SEC financials. Your DCF calculator and existing page text were preserved.')
    print('Next, create or edit .env.local and set:')
    print('SEC_USER_AGENT="InvestartPoint YOUR_REAL_CONTACT_EMAIL"')
    print('Use your real email, keep this file private, then restart the development server.')
    print('Open the dashboard and select Open SEC financials.')
    print(f'Backup: {backup}')

if __name__ == '__main__':
    main()
  
