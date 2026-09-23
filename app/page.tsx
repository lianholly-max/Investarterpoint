"use client";
import { useEffect, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calculator,
  ChevronRight,
  FlaskConical,
  Layers3,
  LayoutDashboard,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCompany } from "@/lib/api";
import type { Company } from "@/lib/company";

const modules = [
  { name: "Company dashboard", icon: LayoutDashboard, detail: "" },
  {
    name: "DCF valuation",
    icon: Calculator,
    detail:
      "Explore intrinsic value with cash-flow forecasts, discount rates, and sensitivity analysis.",
  },
  {
    name: "IPO analysis",
    icon: TrendingUp,
    detail:
      "Study offering terms, fundamentals, dilution, and listing performance.",
  },
  {
    name: "Stock screener",
    icon: SlidersHorizontal,
    detail:
      "Find companies by growth, profitability, valuation, and financial strength.",
  },
  {
    name: "AI research",
    icon: Sparkles,
    detail:
      "Develop source-linked investment theses, bull and bear cases, and risk summaries.",
  },
];
const usd = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function Home() {
  const [company, setCompany] = useState<Company | null>(null);
  const [query, setQuery] = useState("NVDA");
  const [module, setModule] = useState(0);
  const [period, setPeriod] = useState("1Y");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  // Cancel stale searches so a slow response never replaces a newer selection.
  async function load(ticker: string) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    try {
      const data = await getCompany(ticker, controller.signal);
      setCompany(data);
      setQuery(data.ticker);
    } catch (err) {
      if (!controller.signal.aborted)
        setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  useEffect(() => {
    void load("NVDA");
    return () => request.current?.abort();
  }, []);
  const latest = company?.financials.at(-1);
  const previous = company?.financials.at(-2);
  const points =
    company?.prices.slice(-({ "6M": 6, "1Y": 12, "2Y": 24 }[period] ?? 12)) ??
    [];
  const price = points.at(-1)?.price ?? 0;
  const change = points.length ? (price / points[0].price - 1) * 100 : 0;
  const ModuleIcon = modules[module].icon;
  return (
    <SidebarProvider>
      <Sidebar className="research-sidebar">
        <SidebarHeader className="brand">
          <span className="brand-icon">
            <BarChart3 size={23} />
          </span>
          <span>
            Northstar<span className="brand-sub">INVESTMENT RESEARCH</span>
          </span>
        </SidebarHeader>
        <SidebarContent className="px-4">
          <p className="nav-label">WORKSPACE</p>
          <SidebarMenu>
            {modules.map((item, i) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  onClick={() => setModule(i)}
                  isActive={module === i}
                  className="nav-item"
                >
                  <item.icon />
                  <span>{item.name}</span>
                  {i > 0 && <span className="soon-dot" aria-label="Planned" />}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="sidebar-note">
            <FlaskConical size={20} />
            <h3>A research workbench</h3>
            <p>
              Explore the fundamentals.
              <br />
              Build your own conviction.
            </p>
            <span>PORTFOLIO PROJECT · V0.1</span>
          </div>
        </SidebarContent>
        <SidebarFooter className="sidebar-footer">
          <div className="avatar">N</div>
          <div>
            Independent research<small>Learning by building</small>
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <SidebarTrigger className="md:hidden" />
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{modules[module].name}</strong>
          </div>
          <span className="sample-tag">
            <FlaskConical size={14} />
            Sample data
          </span>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <p className="eyebrow">THE RESEARCH DESK</p>
              <h1>{modules[module].name}</h1>
              <p className="muted">
                A clearer view of the business behind the ticker.
              </p>
            </div>
            <span className="edition">
              RESEARCH EDITION <span>0{module + 1} / 05</span>
            </span>
          </div>
          {module !== 0 ? (
            <section className="placeholder panel">
              <div className="placeholder-icon">
                <ModuleIcon size={32} />
              </div>
              <span className="sample-tag">Planned module</span>
              <h2>{modules[module].name}</h2>
              <p>{modules[module].detail}</p>
              <p className="muted">
                This module is a placeholder in the first version.
              </p>
              <Button onClick={() => setModule(0)}>
                Back to company dashboard
              </Button>
            </section>
          ) : (
            <>
              <section className="search-section">
                <form
                  className="search-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (query.trim()) void load(query);
                  }}
                >
                  <Search size={19} />
                  <label htmlFor="ticker" className="sr-only">
                    Company ticker
                  </label>
                  <Input
                    id="ticker"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter a ticker, e.g. NVDA"
                    maxLength={15}
                    autoComplete="off"
                  />
                  <Button type="submit" disabled={loading || !query.trim()}>
                    {loading ? "Loading…" : "Analyze company"}
                    <ArrowUpRight size={16} />
                  </Button>
                </form>
                <div className="try-tickers">
                  <span>Explore samples</span>
                  {["NVDA", "AAPL", "MSFT"].map((ticker) => (
                    <button
                      key={ticker}
                      disabled={loading}
                      onClick={() => void load(ticker)}
                    >
                      {ticker}
                    </button>
                  ))}
                </div>
              </section>
              {error && (
                <div role="alert" className="error">
                  {error}
                  {company &&
                    ` Showing the previous company: ${company.ticker}.`}
                </div>
              )}
              {loading ? (
                <div
                  role="status"
                  aria-label="Loading company"
                  className="loading-grid"
                >
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton className="h-32 rounded-xl" key={i} />
                  ))}
                  <Skeleton className="col-span-full h-80 rounded-xl" />
                </div>
              ) : company && latest && previous ? (
                <div aria-live="polite">
                  <section className="company-heading">
                    <div className="company-identity">
                      <div className="company-mark">{company.ticker[0]}</div>
                      <div>
                        <div className="company-title">
                          <h2>{company.name}</h2>
                          <span className="ticker-badge">{company.ticker}</span>
                        </div>
                        <p className="muted">
                          NASDAQ <span className="separator">/</span>{" "}
                          {company.sector} <span className="separator">/</span>{" "}
                          USD
                        </p>
                      </div>
                    </div>
                    <div className="company-price">
                      <strong>{usd(price)}</strong>
                      <span className="positive">
                        +{change.toFixed(2)}%{" "}
                        <small>over {period} sample</small>
                      </span>
                    </div>
                  </section>
                  <section
                    className="metric-grid"
                    aria-label="Key financial metrics"
                  >
                    {[
                      [
                        "Market capitalization",
                        `$${(company.cap / 1000).toFixed(2)}T`,
                        "Illustrative equity value",
                      ],
                      [
                        "Revenue",
                        `$${latest.revenue.toFixed(1)}B`,
                        `+${((latest.revenue / previous.revenue - 1) * 100).toFixed(1)}% year over year`,
                      ],
                      [
                        "Net profit margin",
                        `${((latest.income / latest.revenue) * 100).toFixed(1)}%`,
                        "Net income / revenue",
                      ],
                      [
                        "Free cash flow",
                        `$${latest.fcf.toFixed(1)}B`,
                        `${((latest.fcf / latest.revenue) * 100).toFixed(1)}% of revenue`,
                      ],
                    ].map(([label, value, caption], i) => (
                      <article className="metric panel" key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                        <small className={i === 1 ? "positive" : ""}>
                          {caption}
                        </small>
                      </article>
                    ))}
                  </section>
                  <div className="chart-grid">
                    <section className="panel price-panel">
                      <div className="panel-heading">
                        <div>
                          <h3>Price performance</h3>
                          <p>Illustrative monthly closing prices</p>
                        </div>
                        <div className="periods" aria-label="Chart time range">
                          {["6M", "1Y", "2Y"].map((value) => (
                            <button
                              key={value}
                              aria-pressed={period === value}
                              onClick={() => setPeriod(value)}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div
                        className="chart"
                        role="img"
                        aria-label={`${company.ticker} sample prices from ${usd(points[0].price)} to ${usd(price)} over ${period}`}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={points}
                            margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
                          >
                            <defs>
                              <linearGradient
                                id="priceFill"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor="#3264ed"
                                  stopOpacity={0.23}
                                />
                                <stop
                                  offset="100%"
                                  stopColor="#3264ed"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="#edf0f5" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(v) =>
                                new Date(`${v}T00:00:00Z`).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    year: "2-digit",
                                    timeZone: "UTC",
                                  },
                                )
                              }
                              axisLine={false}
                              tickLine={false}
                              minTickGap={34}
                              tick={{ fontSize: 12, fill: "#728097" }}
                            />
                            <YAxis
                              domain={["auto", "auto"]}
                              tickFormatter={(v) => `$${v}`}
                              axisLine={false}
                              tickLine={false}
                              width={54}
                              tick={{ fontSize: 12, fill: "#728097" }}
                            />
                            <Tooltip
                              formatter={(v) => [
                                usd(Number(v)),
                                "Sample price",
                              ]}
                            />
                            <Area
                              type="monotone"
                              dataKey="price"
                              stroke="#3264ed"
                              fill="url(#priceFill)"
                              strokeWidth={2.5}
                              isAnimationActive={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="chart-caption">
                        <span>
                          <i />
                          {company.ticker}
                        </span>
                        <span>Historical-style sample · not market data</span>
                      </div>
                    </section>
                    <section className="panel fundamentals">
                      <div className="panel-heading">
                        <div>
                          <h3>At a glance</h3>
                          <p>Profitability & valuation</p>
                        </div>
                        <Layers3 size={19} className="muted" />
                      </div>
                      <dl>
                        {[
                          ["P/E ratio", `${company.pe}×`],
                          ["Gross margin", `${company.gross}%`],
                          ["Return on equity", `${company.roe}%`],
                          ["Return on invested capital", `${company.roic}%`],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <div className="model-note">
                        <BookOpen size={18} />
                        <p>
                          Look beyond a single metric. Growth, quality, and
                          valuation tell the story together.
                        </p>
                      </div>
                    </section>
                  </div>
                  <div className="bottom-grid">
                    <section className="panel financial-panel">
                      <Tabs defaultValue="revenue">
                        <div className="panel-heading">
                          <div>
                            <h3>Financial trajectory</h3>
                            <p>Annual sample financials · USD billions</p>
                          </div>
                        </div>
                        <TabsList className="financial-tabs">
                          <TabsTrigger value="revenue">Revenue</TabsTrigger>
                          <TabsTrigger value="income">Net income</TabsTrigger>
                          <TabsTrigger value="fcf">Free cash flow</TabsTrigger>
                        </TabsList>
                        {["revenue", "income", "fcf"].map((key) => (
                          <TabsContent value={key} key={key}>
                            <div
                              className="bar-chart"
                              role="img"
                              aria-label={`${company.ticker} sample annual ${key}`}
                            >
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={company.financials}
                                  margin={{
                                    top: 14,
                                    right: 20,
                                    left: 0,
                                    bottom: 0,
                                  }}
                                >
                                  <CartesianGrid
                                    vertical={false}
                                    stroke="#edf0f5"
                                  />
                                  <XAxis
                                    dataKey="year"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                  />
                                  <YAxis
                                    tickFormatter={(v) => `$${v}B`}
                                    axisLine={false}
                                    tickLine={false}
                                    width={54}
                                    tick={{ fontSize: 12 }}
                                  />
                                  <Tooltip
                                    formatter={(v) =>
                                      `$${Number(v).toFixed(1)}B`
                                    }
                                  />
                                  <Bar
                                    dataKey={key}
                                    fill="#4775ef"
                                    radius={[5, 5, 0, 0]}
                                    maxBarSize={56}
                                    isAnimationActive={false}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </section>
                    <section className="panel company-about">
                      <p className="eyebrow">THE BUSINESS</p>
                      <h3>About {company.ticker}</h3>
                      <p>{company.description}</p>
                      <div className="about-meta">
                        <span>
                          Sector<strong>{company.sector}</strong>
                        </span>
                        <span>
                          Sample period<strong>FY 2022–2025</strong>
                        </span>
                      </div>
                      <div className="about-footer">
                        Understand the business before the valuation.
                      </div>
                    </section>
                  </div>
                </div>
              ) : null}
              <footer className="page-footer">
                <span>
                  Northstar <span className="separator">/</span> Investment
                  research portfolio
                </span>
                <span>
                  All values are fictional samples for education. Not investment
                  advice.
                </span>
              </footer>
            </>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
