import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, Plus, MoreHorizontal, Send, Wallet, ArrowDownToLine, TrendingUp, TrendingDown } from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis, PieChart, Pie, Cell,
} from "recharts";
import { Card } from "@/components/np/Card";
import { Button } from "@/components/np/Button";
import { StatusBadge } from "@/components/np/Badge";
import { Logo } from "@/components/np/Logo";
import {
  formatMoney,
  relativeTime,
  initials,
  avatarColor,
  type Transaction,
} from "@/lib/mock";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — NanoPay" }] }),
  component: Dashboard,
});

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
] as const;

function useCountUp(target: number, dur = 700) {
  const [n, setN] = useState(target);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = n;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return n;
}

function Dashboard() {
  const user = useAuth((s) => s.user)!;
  const [reveal, setReveal] = useState(false);
  const [rangeIdx, setRangeIdx] = useState(1);
  const range = RANGES[rangeIdx];

  const balance = 12480.42;
  const balanceAnim = useCountUp(balance);
  const [recent, setRecent] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [recentError, setRecentError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoadingRecent(true);
    setRecentError(null);

    api
      .getTransactions()
      .then((txs) => {
        if (!alive) return;
        const list = Array.isArray(txs) ? txs : [];
        setRecent(list.slice(0, 7));
      })
      .catch((e) => {
        if (!alive) return;
        setRecentError(e instanceof Error ? e.message : "Failed to load recent transactions");
      })
      .finally(() => {
        if (!alive) return;
        setLoadingRecent(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const [series, setSeries] = useState<Array<{ date: string; amount: number }>>([]);
  const [breakdown, setBreakdown] = useState<Array<{ name: string; value: number }>>([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [chartsError, setChartsError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setChartsLoading(true);
    setChartsError(null);

    Promise.all([api.getSpendingSeries(range.days), api.getCategoryBreakdown(30)])
      .then(([s, b]) => {
        if (!alive) return;
        setSeries(Array.isArray(s) ? s : []);
        setBreakdown(Array.isArray(b) ? b : []);
      })
      .catch((e) => {
        if (!alive) return;
        setChartsError(e instanceof Error ? e.message : "Failed to load charts");
      })
      .finally(() => {
        if (!alive) return;
        setChartsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [range.days]);

  const total = breakdown.reduce((a, b) => a + b.value, 0);
  const colors = ["#3b82f6", "#8b5cf6", "#22c55e", "#eab308", "#ef4444", "#06b6d4", "#f97316"];


  const txToday = 184.5;
  const txMonth = 2840.18;

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      {/* Hero balance + actions */}
      <section className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <Card className="relative overflow-hidden p-6 sm:p-7">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(circle at 0% 0%, rgba(99,102,241,0.35), transparent 50%), radial-gradient(circle at 100% 100%, rgba(59,130,246,0.30), transparent 55%), linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 100%)",
            }}
          />
          <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-widest text-white/60">
                Available balance
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div
                  className={cn(
                    "font-mono text-[44px] font-bold leading-none tracking-tight text-white sm:text-[48px] transition-all duration-300",
                    !reveal && "blur-[14px] select-none",
                  )}
                >
                  {formatMoney(balanceAnim)}
                </div>
                <button
                  onClick={() => setReveal((v) => !v)}
                  aria-label={reveal ? "Hide balance" : "Show balance"}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-5 max-w-[440px]">
                <Stat label="Today" value={formatMoney(txToday)} progress={0.18} />
                <Stat label="This month" value={formatMoney(txMonth)} delta={+12.4} />
              </div>
            </div>

            <div className="relative mx-auto h-[200px] w-[320px] max-w-full overflow-hidden rounded-[18px] bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#6366f1] p-5 text-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                  <Logo />
                  <svg width="32" height="24" viewBox="0 0 34 26" aria-hidden>
                    <rect width="34" height="26" rx="4" fill="#fbbf24" />
                    <path d="M6 6h22M6 13h22M6 20h22" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
                  </svg>
                </div>
                <div>
                  <div className="font-mono text-[15px] tracking-[0.22em] opacity-90">
                    •••• •••• •••• {user.cardLast4}
                  </div>
                  <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest opacity-90">
                    {user.firstName} {user.lastName}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <ActionTile to="/send" icon={<Send className="h-5 w-5" />} label="Send" />
          <ActionTile icon={<Plus className="h-5 w-5" />} label="Add Money" />
          <ActionTile icon={<ArrowDownToLine className="h-5 w-5" />} label="Withdraw" />
          <ActionTile icon={<MoreHorizontal className="h-5 w-5" />} label="More" />
        </div>
      </section>

      {/* Analytics */}
      <section className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-semibold">Spending</h3>
              <p className="text-[12px] text-[var(--text-muted)]">Last {range.label}</p>
            </div>
            <div className="inline-flex rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-1">
              {RANGES.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setRangeIdx(i)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                    rangeIdx === i
                      ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ left: 0, right: 0, top: 6, bottom: 0 }}>
                <defs>
                  <linearGradient id="sp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickFormatter={(d: string) => d.slice(5)}
                  minTickGap={28}
                />
                <YAxis
                  hide
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <RTooltip
                  cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "3 3" }}
                  contentStyle={{
                    background: "#1a2235",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "#f8fafc",
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={((v: number) => [formatMoney(v), "Spent"]) as any}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#60a5fa"
                  strokeWidth={2.5}
                  fill="url(#sp)"
                  animationDuration={700}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h3 className="text-[15px] font-semibold">By category</h3>
          <p className="text-[12px] text-[var(--text-muted)]">Last 30 days</p>
          <div className="mt-2 h-[200px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={breakdown}
                  innerRadius={56}
                  outerRadius={84}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  animationDuration={700}
                >
                {breakdown.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <RTooltip
                  contentStyle={{
                    background: "#1a2235",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "#f8fafc",
                  }}
                  formatter={((v: number, n: string) => [formatMoney(v), n]) as any}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-y-1.5 text-[12px]">
            {breakdown.map((b, i) => (
              <li key={b.name} className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="h-2 w-2 rounded-full" style={{ background: colors[i % colors.length] }} />
                <span className="truncate">{b.name}</span>
                <span className="ml-auto font-mono text-[var(--text-muted)]">
                  {Math.round((b.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Recent transactions */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-[15px] font-semibold">Recent transactions</h3>
          <Link to="/transactions" className="text-[12px] font-medium text-[var(--brand-400)] hover:text-[var(--brand-300)]">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="border-y border-[var(--border-subtle)] bg-[var(--bg-base)]/50 text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Party</th>
                <th className="px-3 py-2.5 text-left font-medium">Reference</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {loadingRecent && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <p className="text-[14px] font-medium">Loading recent transactions…</p>
                  </td>
                </tr>
              )}

              {!loadingRecent && recentError && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <p className="text-[14px] font-medium text-[var(--danger-400)]">{recentError}</p>
                  </td>
                </tr>
              )}

              {!loadingRecent && !recentError && recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <p className="text-[14px] font-medium">No recent transactions</p>
                  </td>
                </tr>
              )}

              {!loadingRecent && !recentError &&
                recent.map((t) => {
                const credit = t.type === "receive" || t.type === "deposit";
                const Icon = credit ? ArrowDownLeft : ArrowUpRight;
                return (
                  <tr
                    key={t.id}
                    className="group border-b border-[var(--border-subtle)] last:border-0 transition-colors hover:bg-[var(--bg-elevated)]/50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "grid h-9 w-9 place-items-center rounded-full",
                            credit ? "bg-[var(--success-500)]/15 text-[var(--success-400)]" : "bg-[var(--brand-500)]/15 text-[var(--brand-400)]",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-medium">{t.counterparty}</div>
                          <div className="truncate text-[12px] text-[var(--text-muted)]">{t.counterpartyEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px] text-[var(--text-muted)]">{t.reference}</td>
                    <td className={cn("px-3 py-3 text-right font-mono text-[14px] font-semibold", credit ? "text-[var(--success-400)]" : "text-[var(--text-primary)]")}>
                      {credit ? "+" : "−"}{formatMoney(t.amount)}
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-5 py-3 text-right text-[12px] text-[var(--text-secondary)]" title={new Date(t.createdAt).toLocaleString()}>
                      {relativeTime(t.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({
  label, value, progress, delta,
}: { label: string; value: string; progress?: number; delta?: number }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/55">{label}</p>
      <p className="mt-1 font-mono text-[18px] font-semibold text-white">{value}</p>
      {typeof progress === "number" && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-white/70" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
      {typeof delta === "number" && (
        <p className={cn("mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium", delta >= 0 ? "text-[var(--success-400)]" : "text-[var(--danger-400)]")}>
          {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {delta >= 0 ? "+" : ""}{delta.toFixed(1)}% vs last month
        </p>
      )}
    </div>
  );
}

function ActionTile({ icon, label, to }: { icon: React.ReactNode; label: string; to?: string }) {
  const inner = (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
      className="group flex h-full flex-col items-start justify-between gap-6 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-colors hover:border-[var(--brand-500)]/60 hover:shadow-[var(--shadow-glow-brand)]"
    >
      <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--bg-elevated)] text-[var(--brand-400)] transition-colors group-hover:bg-[var(--brand-500)]/20">
        {icon}
      </span>
      <span className="text-[13px] font-semibold">{label}</span>
    </motion.div>
  );
  if (to) return <Link to={to}>{inner}</Link>;
  return <button type="button" className="text-left">{inner}</button>;
}

void Wallet;
