import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Mail, Lock, User as UserIcon, Check, X } from "lucide-react";
import { Button } from "@/components/np/Button";
import { Input } from "@/components/np/Input";
import { Logo } from "@/components/np/Logo";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — NanoPay" },
      { name: "description", content: "Open a NanoPay account in seconds." },
    ],
  }),
  component: RegisterPage,
});

function score(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function RegisterPage() {
  const navigate = useNavigate();
  const signUp = useAuth((s) => s.signUp);
  const [f, setF] = useState({ first: "", last: "", email: "", pw: "", pw2: "" });
  const [loading, setLoading] = useState(false);
  const s = score(f.pw);
  const match = f.pw && f.pw2 && f.pw === f.pw2;

  const checks = useMemo(
    () => [
      { ok: f.pw.length >= 8, label: "At least 8 characters" },
      { ok: /[A-Z]/.test(f.pw) && /[a-z]/.test(f.pw), label: "Upper & lowercase letters" },
      { ok: /[0-9]/.test(f.pw), label: "A number" },
      { ok: /[^A-Za-z0-9]/.test(f.pw), label: "A symbol" },
    ],
    [f.pw],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signUp(f.first || "Alex", f.last || "Chen", f.email, f.pw);
    navigate({ to: "/dashboard" });
  }

  const colors = ["bg-[var(--danger-500)]", "bg-orange-500", "bg-yellow-500", "bg-emerald-500", "bg-[var(--success-500)]"];

  return (
    <div className="grid min-h-dvh lg:grid-cols-5">
      <div className="relative hidden overflow-hidden border-r border-[var(--border-subtle)] bg-gradient-to-br from-[#0a0f1e] via-[#0e1530] to-[#1a1340] lg:col-span-3 lg:block">
        <div className="absolute -left-32 top-20 h-[420px] w-[420px] rounded-full bg-emerald-600/20 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[520px] w-[520px] rounded-full bg-[var(--brand-600)]/20 blur-[140px]" />
        <div className="relative flex h-full flex-col p-10">
          <Logo />
          <div className="flex flex-1 items-center justify-center">
            <WalletFillVisual />
          </div>
          <p className="max-w-md text-[14px] leading-relaxed text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">Open in 30 seconds.</span> No
            paperwork. No card required. Just better payments.
          </p>
        </div>
      </div>

      <div className="col-span-2 grid place-items-center p-6">
        <div className="w-full max-w-[420px]">
          <h1 className="text-[28px] font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            Already have one?{" "}
            <Link to="/login" className="font-medium text-[var(--brand-400)] hover:text-[var(--brand-300)]">
              Sign in
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First name" leftIcon={<UserIcon />} value={f.first} onChange={(e) => setF({ ...f, first: e.target.value })} />
              <Input label="Last name" value={f.last} onChange={(e) => setF({ ...f, last: e.target.value })} />
            </div>
            <Input label="Email" type="email" leftIcon={<Mail />} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <Input label="Password" type="password" leftIcon={<Lock />} value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })} />

            {f.pw && (
              <div className="px-1">
                <div className="flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i < s ? colors[Math.max(0, s - 1)] : "bg-white/10"}`}
                    />
                  ))}
                </div>
                <ul className="mt-2.5 grid grid-cols-2 gap-y-1 text-[12px]">
                  {checks.map((c) => (
                    <li key={c.label} className={`inline-flex items-center gap-1.5 ${c.ok ? "text-[var(--success-400)]" : "text-[var(--text-muted)]"}`}>
                      {c.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Input
              label="Confirm password"
              type="password"
              leftIcon={<Lock />}
              value={f.pw2}
              onChange={(e) => setF({ ...f, pw2: e.target.value })}
              success={!!match}
              error={f.pw2 && !match ? "Passwords don't match" : undefined}
              rightSlot={
                f.pw2 ? (
                  match ? (
                    <Check className="h-4 w-4 text-[var(--success-400)]" />
                  ) : (
                    <X className="h-4 w-4 text-[var(--danger-400)]" />
                  )
                ) : null
              }
            />

            <label className="mt-1 inline-flex cursor-pointer items-start gap-2 text-[13px] text-[var(--text-secondary)]">
              <input type="checkbox" name="terms" required className="peer hidden" />
              <span className="mt-0.5 grid h-4 w-4 place-items-center rounded border border-[var(--border-default)] transition-colors peer-checked:border-[var(--brand-500)] peer-checked:bg-[var(--brand-500)]">
                <Check className="h-2.5 w-2.5 text-white opacity-0 peer-checked:opacity-100" />
              </span>
              I agree to NanoPay's <a className="text-[var(--brand-400)]">Terms</a> and{" "}
              <a className="text-[var(--brand-400)]">Privacy Policy</a>
            </label>

            <Button type="submit" size="lg" loading={loading} className="mt-3 w-full">
              Create account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function WalletFillVisual() {
  return (
    <div className="relative h-[260px] w-[280px]">
      <div className="absolute inset-x-0 bottom-0 h-[170px] rounded-[20px] border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]" />
      <div className="absolute inset-x-4 bottom-2 h-[155px] overflow-hidden rounded-[16px] bg-gradient-to-t from-[var(--brand-700)] via-[var(--brand-500)] to-transparent">
        <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.4),transparent_60%)]" />
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="absolute h-3 w-3 rounded-full bg-[var(--brand-400)] shadow-[0_0_12px_rgba(96,165,250,0.8)]"
          style={{
            left: `${20 + i * 18}%`,
            top: `${10 + (i % 2) * 12}%`,
            animation: `coin 2.6s ${i * 0.4}s ease-in infinite`,
          }}
        />
      ))}
      <style>{`@keyframes coin { 0%{transform:translateY(0);opacity:1} 60%{transform:translateY(140px);opacity:1} 100%{transform:translateY(160px);opacity:0} }`}</style>
    </div>
  );
}
