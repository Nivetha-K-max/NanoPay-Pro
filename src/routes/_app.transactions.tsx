import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, ArrowUpRight, ArrowDownLeft, Copy, Shield, ShieldAlert } from "lucide-react";
import { Card } from "@/components/np/Card";
import { Button } from "@/components/np/Button";
import { Badge, StatusBadge } from "@/components/np/Badge";
import { api } from "@/lib/api";
import { formatMoney, relativeTime, type Transaction, type TxStatus } from "@/lib/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/transactions")({
  head: () => ({ meta: [{ title: "Transactions — NanoPay" }] }),
  component: TxPage,
});

const STATUSES: (TxStatus | "ALL")[] = ["ALL", "SUCCESS", "PENDING", "PROCESSING", "FAILED", "REVERSED"];
const TYPES = ["ALL", "send", "receive", "deposit", "withdraw"] as const;

function TxPage() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("ALL");
  const [type, setType] = useState<(typeof TYPES)[number]>("ALL");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    api
      .getTransactions()
      .then((txs) => {
        if (!alive) return;
        setTransactions(Array.isArray(txs) ? (txs as Transaction[]) : []);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load transactions");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (status !== "ALL" && t.status !== status) return false;
      if (type !== "ALL" && t.type !== type) return false;
      if (q) {
        const s = q.toLowerCase();
        if (
          !t.counterparty.toLowerCase().includes(s) &&
          !t.reference.toLowerCase().includes(s) &&
          !t.counterpartyEmail.toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }, [transactions, status, type, q]);


  const activeFilters = (status !== "ALL" ? 1 : 0) + (type !== "ALL" ? 1 : 0) + (q ? 1 : 0);

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 focus-within:border-[var(--brand-500)]">
            <Search className="h-4 w-4 text-[var(--text-muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, or reference"
              className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--text-muted)]"
            />
          </div>

          <PillGroup
            value={type as string}
            options={TYPES.map((t) => ({ value: t, label: t === "ALL" ? "All types" : cap(t) }))}
            onChange={(v) => setType(v as typeof type)}
          />
          <PillGroup
            value={status}
            options={STATUSES.map((s) => ({ value: s, label: s === "ALL" ? "All status" : s }))}
            onChange={(v) => setStatus(v as typeof status)}
          />

          {activeFilters > 0 && (
            <button
              onClick={() => { setStatus("ALL"); setType("ALL"); setQ(""); }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-500)]/15 px-3 py-1 text-[12px] font-medium text-[var(--brand-400)] hover:bg-[var(--brand-500)]/25"
            >
              <Filter className="h-3 w-3" /> {activeFilters} active
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </Card>

      {/* Table / list */}
      <Card className="overflow-hidden">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/50 text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Party</th>
                <th className="px-3 py-2.5 text-left font-medium">Reference</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                <th className="px-3 py-2.5 text-right font-medium">Fee</th>
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)]">…</div>
                    <p className="mt-3 text-[14px] font-medium">Loading transactions</p>
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <p className="mx-auto max-w-md text-[14px] font-medium text-[var(--danger-400)]">{error}</p>
                  </td>
                </tr>
              )}

              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                      <Search className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-[14px] font-medium">No transactions match your filters</p>
                    <p className="mt-1 text-[12px] text-[var(--text-muted)]">Try clearing some filters or searching for something else.</p>
                  </td>
                </tr>
              )}

              {filtered.map((t) => {
                const credit = t.type === "receive" || t.type === "deposit";
                const Icon = credit ? ArrowDownLeft : ArrowUpRight;
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="group cursor-pointer border-b border-[var(--border-subtle)] last:border-0 transition-colors hover:bg-[var(--bg-elevated)]/60"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className={cn("grid h-9 w-9 place-items-center rounded-full", credit ? "bg-[var(--success-500)]/15 text-[var(--success-400)]" : "bg-[var(--brand-500)]/15 text-[var(--brand-400)]")}>
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
                    <td className="px-3 py-3 text-right font-mono text-[12px] text-[var(--text-muted)]">
                      {t.fee ? formatMoney(t.fee) : "—"}
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

        {/* Mobile cards */}
        <ul className="divide-y divide-[var(--border-subtle)] md:hidden">
          {filtered.map((t) => {
            const credit = t.type === "receive" || t.type === "deposit";
            const Icon = credit ? ArrowDownLeft : ArrowUpRight;
            return (
              <li key={t.id}>
                <button onClick={() => setSelected(t)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <span className={cn("grid h-9 w-9 place-items-center rounded-full", credit ? "bg-[var(--success-500)]/15 text-[var(--success-400)]" : "bg-[var(--brand-500)]/15 text-[var(--brand-400)]")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{t.counterparty}</span>
                    <span className="block truncate text-[12px] text-[var(--text-muted)]">{relativeTime(t.createdAt)}</span>
                  </span>
                  <span className={cn("font-mono text-[14px] font-semibold", credit ? "text-[var(--success-400)]" : "text-[var(--text-primary)]")}>
                    {credit ? "+" : "−"}{formatMoney(t.amount)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <DetailDrawer tx={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function PillGroup({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
            value === o.value ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function DetailDrawer({ tx, onClose }: { tx: Transaction | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!tx) {
    return (
      <AnimatePresence>{null}</AnimatePresence>
    );
  }
  const credit = tx.type === "receive" || tx.type === "deposit";

  const scoreColor =
    tx.fraudScore >= 75 ? "text-[var(--danger-400)]" : tx.fraudScore >= 40 ? "text-[var(--warning-400)]" : "text-[var(--success-400)]";

  const txRef = tx.reference;
  function copyRef() {
    navigator.clipboard?.writeText(txRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const timeline = [
    { label: "Created", at: tx.createdAt },
    { label: "Validated", at: new Date(new Date(tx.createdAt).getTime() + 1500).toISOString() },
    tx.status === "SUCCESS" ? { label: "Settled", at: new Date(new Date(tx.createdAt).getTime() + 4200).toISOString() } : null,
    tx.status === "FAILED" ? { label: "Failed", at: new Date(new Date(tx.createdAt).getTime() + 3500).toISOString() } : null,
  ].filter(Boolean) as { label: string; at: string }[];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50"
      >
        <button onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Close" />
        <motion.aside
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="absolute right-0 top-0 h-full w-full max-w-[480px] overflow-y-auto border-l border-[var(--border-default)] bg-[var(--bg-base)]"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/90 px-5 py-3 backdrop-blur-xl">
            <h3 className="text-[15px] font-semibold">Transaction</h3>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5">
            <div className="text-center">
              <span className={cn("inline-grid h-12 w-12 place-items-center rounded-full", credit ? "bg-[var(--success-500)]/15 text-[var(--success-400)]" : "bg-[var(--brand-500)]/15 text-[var(--brand-400)]")}>
                {credit ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
              </span>
              <p className="mt-3 text-[12px] uppercase tracking-widest text-[var(--text-muted)]">{cap(tx.type)}</p>
              <p className={cn("mt-1 font-mono text-[40px] font-bold leading-none", credit ? "text-[var(--success-400)]" : "text-[var(--text-primary)]")}>
                {credit ? "+" : "−"}{formatMoney(tx.amount)}
              </p>
              <div className="mt-2"><StatusBadge status={tx.status} /></div>
            </div>

            <button
              onClick={copyRef}
              className="mt-6 flex w-full items-center justify-between rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-left transition-colors hover:border-[var(--border-default)]"
            >
              <span>
                <span className="block text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Reference</span>
                <span className="font-mono text-[13px]">{tx.reference}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--brand-400)]">
                {copied ? <Badge tone="success">Copied</Badge> : (<><Copy className="h-3.5 w-3.5" /> Copy</>)}
              </span>
            </button>

            <Section title="Counterparty">
              <Row k="Name" v={tx.counterparty} />
              <Row k="Email" v={tx.counterpartyEmail} />
            </Section>

            <Section title="Amounts">
              <Row k="Amount" v={formatMoney(tx.amount)} mono />
              <Row k="Fee" v={tx.fee ? formatMoney(tx.fee) : "—"} mono />
              <Row k="Currency" v={tx.currency} />
              <Row k="Category" v={tx.category} />
            </Section>

            <Section title="Security">
              <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <div className="flex items-center gap-3">
                  {tx.fraudScore >= 75 ? <ShieldAlert className={cn("h-5 w-5", scoreColor)} /> : <Shield className={cn("h-5 w-5", scoreColor)} />}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium">Fraud score</span>
                      <span className={cn("font-mono text-[13px] font-semibold", scoreColor)}>{tx.fraudScore}/100</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          tx.fraudScore >= 75 ? "bg-[var(--danger-500)]" : tx.fraudScore >= 40 ? "bg-[var(--warning-500)]" : "bg-[var(--success-500)]",
                        )}
                        style={{ width: `${tx.fraudScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Timeline">
              <ol className="relative ml-3 border-l border-[var(--border-subtle)]">
                {timeline.map((s, i) => (
                  <li key={i} className="mb-4 ml-4 last:mb-0">
                    <span className="absolute -left-[5px] mt-1 h-2.5 w-2.5 rounded-full bg-[var(--brand-500)] ring-4 ring-[var(--bg-base)]" />
                    <div className="text-[13px] font-medium">{s.label}</div>
                    <div className="text-[12px] text-[var(--text-muted)]">{new Date(s.at).toLocaleString()}</div>
                  </li>
                ))}
              </ol>
            </Section>

            <div className="mt-6 flex justify-end gap-2">
              {tx.status === "SUCCESS" && <Button variant="secondary">Dispute</Button>}
              {tx.status === "PENDING" && <Button variant="danger">Cancel</Button>}
            </div>
          </div>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{title}</h4>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5">
      <span className="text-[13px] text-[var(--text-muted)]">{k}</span>
      <span className={cn("truncate text-[13px] text-[var(--text-primary)]", mono && "font-mono")}>{v}</span>
    </div>
  );
}

function cap(s: string) {
  return s[0].toUpperCase() + s.slice(1);
}
