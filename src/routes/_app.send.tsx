import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/np/Button";
import { Card } from "@/components/np/Card";
import { formatMoney, initials, avatarColor, type Contact } from "@/lib/mock";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/send")({
  head: () => ({ meta: [{ title: "Send Money — NanoPay" }] }),
  component: SendPage,
});

const BALANCE = 12480.42;
const FEE_RATE = 0.005;

function SendPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [recipient, setRecipient] = useState<Contact | null>(null);
  const [q, setQ] = useState("");
  const [amount, setAmount] = useState("");
  const amt = Math.max(0, Number(amount.replace(/[^0-9.]/g, "")) || 0);
  const fee = Math.round(amt * FEE_RATE * 100) / 100;
  const total = Math.max(0, amt - fee);

  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsError, setContactsError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoadingContacts(true);
    setContactsError(null);

    api
      .getContacts()
      .then((list) => {
        if (!alive) return;
        setContacts(Array.isArray(list) ? (list as Contact[]) : []);
      })
      .catch((e) => {
        if (!alive) return;
        setContactsError(e instanceof Error ? e.message : "Failed to load contacts");
      })
      .finally(() => {
        if (!alive) return;
        setLoadingContacts(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    const base = contacts;
    if (!t) return base;
    return base.filter((c) => c.name.toLowerCase().includes(t) || c.email.toLowerCase().includes(t));
  }, [q, contacts]);

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6">
      <Stepper step={step === 3 ? 2 : step} />

      <Card className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              <h2 className="text-[20px] font-semibold tracking-tight">Who are you sending to?</h2>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                Search by name or email
              </p>

              <div className="mt-5 flex h-12 items-center gap-2 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-base)] px-3 focus-within:border-[var(--brand-500)]">
                <Search className="h-4 w-4 text-[var(--text-muted)]" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Recipient name or email…"
                  className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--text-muted)]"
                />
              </div>

              <p className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Recent contacts</p>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {(loadingContacts ? [] : contacts).slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setRecipient(c); setStep(1); }}
                    className="group flex w-[68px] shrink-0 flex-col items-center gap-1.5"
                  >
                    <span className={cn("grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br text-[13px] font-bold text-white transition-transform group-hover:scale-110", avatarColor(c.name))}>
                      {c.initials}
                    </span>
                    <span className="truncate text-[11px] text-[var(--text-secondary)] w-full text-center">{c.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>

              <ul className="mt-5 divide-y divide-[var(--border-subtle)]">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => { setRecipient(c); setStep(1); }}
                      className="group flex w-full items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-[var(--bg-elevated)]/60"
                    >
                      <span className={cn("grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br text-[12px] font-bold text-white", avatarColor(c.name))}>
                        {c.initials}
                      </span>
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-[14px] font-medium">{c.name}</span>
                        <span className="block truncate text-[12px] text-[var(--text-muted)]">{c.email}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {step === 1 && recipient && (
            <motion.div key="s1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              <button onClick={() => setStep(0)} className="mb-3 inline-flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <ArrowLeft className="h-3.5 w-3.5" /> Change recipient
              </button>
              <div className="flex items-center gap-3">
                <span className={cn("grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br text-[14px] font-bold text-white", avatarColor(recipient.name))}>
                  {recipient.initials}
                </span>
                <div>
                  <div className="text-[15px] font-semibold">{recipient.name}</div>
                  <div className="text-[12px] text-[var(--text-muted)]">{recipient.email}</div>
                </div>
              </div>

              <div className="my-8 grid place-items-center text-center">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">You send</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[28px] font-mono text-[var(--text-muted)]">$</span>
                  <input
                    autoFocus
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0.00"
                    className="w-[260px] bg-transparent text-center font-mono text-[64px] font-bold leading-none tracking-tight outline-none placeholder:text-[var(--text-muted)]/40"
                  />
                </div>
                <p className="mt-2 text-[12px] text-[var(--text-muted)]">
                  Available: <span className="font-mono text-[var(--text-secondary)]">{formatMoney(BALANCE)}</span>
                </p>
              </div>

              <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
                {[10, 25, 50, 100, 500].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-500)] hover:text-[var(--text-primary)]"
                  >
                    ${v}
                  </button>
                ))}
                <button
                  onClick={() => setAmount(String(BALANCE.toFixed(2)))}
                  className="rounded-full border border-[var(--brand-500)]/60 bg-[var(--brand-500)]/10 px-3 py-1 text-[12px] font-semibold text-[var(--brand-400)] hover:bg-[var(--brand-500)]/20"
                >
                  Max
                </button>
              </div>

              <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4 text-[13px]">
                <Row label="You send" value={formatMoney(amt)} />
                <Row label="Fee" value={`− ${formatMoney(fee)}`} muted />
                <div className="my-2 h-px bg-[var(--border-subtle)]" />
                <Row label="They receive" value={formatMoney(total)} bold />
              </div>

              {amt > 1000 && (
                <div className="mt-3 rounded-[10px] border border-[var(--warning-500)]/40 bg-[var(--warning-500)]/10 px-3.5 py-2.5 text-[12px] text-[var(--warning-400)]">
                  Heads up — this is a large transaction. Verify the recipient before sending.
                </div>
              )}

              <Button onClick={() => setStep(2)} disabled={amt <= 0 || amt > BALANCE} size="lg" className="mt-5 w-full">
                Continue
              </Button>
            </motion.div>
          )}

          {step === 2 && recipient && (
            <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              <button onClick={() => setStep(1)} className="mb-3 inline-flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <ArrowLeft className="h-3.5 w-3.5" /> Edit
              </button>
              <h2 className="text-[20px] font-semibold tracking-tight">Confirm transfer</h2>

              <div className="mt-5 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-5">
                <div className="flex items-center gap-3">
                  <span className={cn("grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br text-[14px] font-bold text-white", avatarColor(recipient.name))}>
                    {recipient.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold">{recipient.name}</div>
                    <div className="truncate text-[12px] text-[var(--text-muted)]">{recipient.email}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-[20px] font-bold">{formatMoney(amt)}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">USD</div>
                  </div>
                </div>
                <div className="mt-5 grid gap-2 text-[13px]">
                  <Row label="Fee" value={formatMoney(fee)} muted />
                  <Row label="Total debit" value={formatMoney(amt)} bold />
                  <Row label="Recipient gets" value={formatMoney(total)} muted />
                  <Row label="Arrival" value="Instant" muted />
                </div>
              </div>

              <Button onClick={() => setStep(3)} size="lg" className="mt-5 w-full">
                Send {formatMoney(amt)}
              </Button>
              <button onClick={() => setStep(0)} className="mt-3 block w-full text-center text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                Cancel
              </button>
            </motion.div>
          )}

          {step === 3 && recipient && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="py-10 text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[var(--success-500)]/15">
                <svg viewBox="0 0 52 52" className="h-12 w-12 text-[var(--success-400)]">
                  <circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.4" />
                  <motion.path
                    d="M16 27 L23 34 L37 19"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-[22px] font-semibold tracking-tight">Sent successfully</h2>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                {formatMoney(amt)} is on its way to {recipient.name}.
              </p>
              <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Ref</span>
                <code className="font-mono text-[12px]">NP-{Date.now().toString(36).toUpperCase()}</code>
              </div>
              <div className="mt-7 flex justify-center gap-3">
                <Button variant="secondary" onClick={() => { setStep(0); setRecipient(null); setAmount(""); }}>
                  Send another
                </Button>
                <Button onClick={() => navigate({ to: "/dashboard" })}>Done</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-[var(--text-muted)]", muted && "text-[var(--text-muted)]")}>{label}</span>
      <span className={cn("font-mono", bold ? "text-[15px] font-semibold text-[var(--text-primary)]" : muted ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]")}>
        {value}
      </span>
    </div>
  );
}

function Stepper({ step }: { step: 0 | 1 | 2 }) {
  const labels = ["Recipient", "Amount", "Confirm"];
  return (
    <div className="flex items-center gap-3">
      {labels.map((l, i) => {
        const active = i <= step;
        return (
          <div key={l} className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold transition-colors",
                  active ? "bg-[var(--brand-500)] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-muted)]",
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("hidden text-[13px] font-medium sm:inline", active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>{l}</span>
            </div>
            {i < labels.length - 1 && (
              <div className="h-px flex-1 bg-[var(--border-subtle)]">
                <div className={cn("h-full transition-all duration-500", i < step ? "w-full bg-[var(--brand-500)]" : "w-0")} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

void initials;
