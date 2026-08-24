import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/np/Button";
import { Input } from "@/components/np/Input";
import { Logo } from "@/components/np/Logo";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — NanoPay" },
      { name: "description", content: "Sign in to your NanoPay account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const signIn = useAuth((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !pw) {
      setErr("Email or password is incorrect.");
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      await signIn(email, pw);
      navigate({ to: "/dashboard" });
    } catch {
      setErr("Email or password is incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-5">
      {/* Left visual */}
      <div className="relative hidden overflow-hidden border-r border-[var(--border-subtle)] bg-gradient-to-br from-[#0a0f1e] via-[#0e1530] to-[#1a1340] lg:col-span-3 lg:block">
        <div className="absolute -left-32 top-20 h-[420px] w-[420px] rounded-full bg-[var(--brand-600)]/30 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[520px] w-[520px] rounded-full bg-purple-600/20 blur-[140px]" />

        <div className="relative flex h-full flex-col p-10">
          <Logo />

          <div className="flex flex-1 items-center justify-center">
            <motion.div
              initial={{ rotateY: -20, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformStyle: "preserve-3d", perspective: 1000 }}
              className="relative"
            >
              <CardVisual />
              <FloatingNotif top="-10%" left="-25%" delay={0.4} text="Maya sent $240.00" />
              <FloatingNotif top="60%" left="78%" delay={0.9} text="Deposit cleared · $1,200" />
              <FloatingNotif top="100%" left="10%" delay={1.4} text="Payment received" />
            </motion.div>
          </div>

          <p className="max-w-md text-[14px] leading-relaxed text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">Built for speed.</span> Move
            money in milliseconds with the same infrastructure trusted by 10,000+ businesses.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="col-span-2 grid place-items-center p-6">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            New to NanoPay?{" "}
            <Link to="/register" className="font-medium text-[var(--brand-400)] hover:text-[var(--brand-300)]">
              Create an account
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-3" autoComplete="off">
            <Input
              label="Email"
              type="email"
              leftIcon={<Mail />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
            <Input
              label="Password"
              type="password"
              leftIcon={<Lock />}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="current-password"
              required
            />

            {err && (
              <div className="rounded-[10px] border border-[var(--danger-500)]/40 bg-[var(--danger-500)]/10 px-3.5 py-2.5 text-[13px] text-[var(--danger-400)]">
                {err}
              </div>
            )}

            <div className="mt-1 flex items-center justify-between text-[13px]">
              <label className="inline-flex cursor-pointer items-center gap-2 text-[var(--text-secondary)]">
                <input type="checkbox" className="peer hidden" />
                <span className="grid h-4 w-4 place-items-center rounded border border-[var(--border-default)] bg-transparent transition-colors peer-checked:border-[var(--brand-500)] peer-checked:bg-[var(--brand-500)]">
                  <Sparkles className="h-2.5 w-2.5 text-white opacity-0 peer-checked:opacity-100" />
                </span>
                Remember me
              </label>
              <Link to="/forgot-password" className="text-[var(--brand-400)] hover:text-[var(--brand-300)]">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" size="lg" loading={loading} className="mt-2 w-full" rightIcon={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}>
              Sign in
            </Button>

            <div className="my-4 flex items-center gap-3 text-[12px] text-[var(--text-muted)]">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--border-subtle)]" />
              or continue with
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--border-subtle)]" />
            </div>

            <Button type="button" variant="secondary" size="lg" className="w-full" leftIcon={<GoogleIcon />}>
              Google
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-5.1c-1.9 1.4-4.3 2.2-6.9 2.2-5.2 0-9.7-3.1-11.3-7.7l-6.5 5C9.5 39 16.2 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.4 5.5l6 5.1c-.4.4 6.6-4.8 6.6-14.6 0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function CardVisual() {
  return (
    <div className="relative h-[210px] w-[340px] overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#6366f1] p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
      <div className="relative flex h-full flex-col justify-between text-white">
        <div className="flex items-start justify-between">
          <Logo />
          <svg width="34" height="26" viewBox="0 0 34 26" aria-hidden>
            <rect width="34" height="26" rx="4" fill="#fbbf24" />
            <path d="M6 6h22M6 13h22M6 20h22" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
          </svg>
        </div>
        <div>
          <div className="font-mono text-[18px] tracking-[0.25em] opacity-90">•••• •••• •••• 4242</div>
          <div className="mt-3 flex items-end justify-between text-[10px] uppercase tracking-widest">
            <div>
              <div className="opacity-60">Cardholder</div>
              <div className="text-[12px] font-semibold tracking-wider">Alex Chen</div>
            </div>
            <div className="text-right">
              <div className="opacity-60">Exp</div>
              <div className="text-[12px] font-semibold tracking-wider">12 / 28</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingNotif({ top, left, delay, text }: { top: string; left: string; delay: number; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      style={{ top, left }}
      className="absolute glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium text-white whitespace-nowrap"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--success-500)]" />
      {text}
    </motion.div>
  );
}
