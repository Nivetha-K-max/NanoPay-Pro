import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, LineChart as LineIcon, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/np/Logo";
import { Button } from "@/components/np/Button";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NanoPay — Move money at the speed of thought" },
      {
        name: "description",
        content: "The modern payments platform for fast, secure transfers. Built for businesses and people who move fast.",
      },
      { property: "og:title", content: "NanoPay — Move money at the speed of thought" },
      { property: "og:description", content: "The modern payments platform for fast, secure transfers." },
    ],
  }),
  component: Landing,
});

const TICKER = [
  { who: "A. Chen", amount: 240.0, place: "London" },
  { who: "M. Patel", amount: 1240.5, place: "Mumbai" },
  { who: "K. Park", amount: 89.99, place: "Seoul" },
  { who: "L. Garcia", amount: 510.0, place: "São Paulo" },
  { who: "Z. Khan", amount: 75.25, place: "Dubai" },
  { who: "N. Brooks", amount: 2350.0, place: "New York" },
  { who: "I. Silva", amount: 19.5, place: "Lisbon" },
  { who: "S. Kim", amount: 410.4, place: "Berlin" },
];

function Landing() {
  const navigate = useNavigate();
  const [counter, setCounter] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Animated counter (10,000+ businesses)
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1800;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setCounter(Math.floor(eased * 10000));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Parallax shapes
  const [mx, setMx] = useState(0);
  const [my, setMy] = useState(0);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMx(x);
      setMy(y);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Floating shapes */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          style={{ x: mx * 10, y: my * 10 }}
          className="absolute -left-32 top-20 h-[420px] w-[420px] rounded-full bg-[var(--brand-600)]/20 blur-[120px]"
        />
        <motion.div
          style={{ x: mx * -8, y: my * -8 }}
          className="absolute right-[-10%] top-[20%] h-[520px] w-[520px] rounded-full bg-purple-600/20 blur-[140px]"
        />
        <motion.div
          style={{ x: mx * 6, y: my * 6 }}
          className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-[var(--brand-400)]/10 blur-[100px]"
        />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-[14px] text-[var(--text-secondary)] md:flex">
          <a href="#features" className="hover:text-[var(--text-primary)]">Features</a>
          <a href="#trust" className="hover:text-[var(--text-primary)]">Trust</a>
          <Link to="/login" className="hover:text-[var(--text-primary)]">Sign in</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/login" })}>
            Sign in
          </Button>
          <Button size="sm" onClick={() => navigate({ to: "/register" })} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Get started
          </Button>
        </div>
      </header>

      <main ref={ref} className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-32">
        <section className="grid place-items-center pt-16 text-center sm:pt-24">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-1 text-[12px] font-medium text-[var(--text-secondary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success-500)]" />
            Now processing $2.4B / month
          </span>
          <h1 className="max-w-4xl text-[44px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[72px]">
            Move money at the
            <br />
            <span className="text-gradient-hero">speed of thought.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[16px] text-[var(--text-secondary)] sm:text-[18px]">
            NanoPay is the modern payments platform for instant transfers, real-time analytics, and
            enterprise-grade security — all in one elegant interface.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate({ to: "/register" })} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Get started — free
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate({ to: "/login" })}>
              View demo
            </Button>
          </div>
        </section>

        {/* Ticker */}
        <section className="mt-20 overflow-hidden rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60">
          <div className="flex animate-[ticker_40s_linear_infinite] gap-12 whitespace-nowrap py-3 text-[13px] text-[var(--text-secondary)]">
            {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success-500)]" />
                <span className="font-medium text-[var(--text-primary)]">{t.who}</span>
                <span>sent</span>
                <span className="font-mono font-medium text-[var(--success-400)]">
                  ${t.amount.toFixed(2)}
                </span>
                <span>from {t.place}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              </span>
            ))}
          </div>
        </section>
        <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }`}</style>

        {/* Features */}
        <section id="features" className="mt-28 grid gap-5 md:grid-cols-3">
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Instant Transfers"
            body="Money arrives in milliseconds. Powered by our global settlement network."
            accent="from-[var(--brand-500)] to-blue-700"
          />
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="Enterprise Security"
            body="Bank-grade encryption, real-time fraud detection, and SOC 2 Type II compliance."
            accent="from-emerald-500 to-teal-700"
          />
          <FeatureCard
            icon={<LineIcon className="h-5 w-5" />}
            title="Real-time Analytics"
            body="Every transaction, fee, and trend — visualised the moment it happens."
            accent="from-fuchsia-500 to-purple-700"
          />
        </section>

        {/* Social proof */}
        <section id="trust" className="mt-28 text-center">
          <p className="text-[13px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Trusted globally
          </p>
          <p className="mt-3 text-[40px] font-extrabold tracking-tight sm:text-[56px]">
            <span className="font-mono text-gradient-hero">
              {counter.toLocaleString()}+
            </span>
          </p>
          <p className="text-[16px] text-[var(--text-secondary)]">businesses moving money with NanoPay</p>
        </section>

        {/* CTA */}
        <section className="mt-24 glass overflow-hidden rounded-[24px] p-10 text-center sm:p-16">
          <h2 className="text-[32px] font-bold tracking-tight sm:text-[44px]">
            Ready to move faster?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-[var(--text-secondary)]">
            Create an account in 30 seconds. No card required.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate({ to: "/register" })}>Get started</Button>
            <Button size="lg" variant="secondary" onClick={() => navigate({ to: "/login" })}>
              View demo
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--border-subtle)]">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-[12px] text-[var(--text-muted)]">
          <Logo size={22} />
          <span>© {new Date().getFullYear()} NanoPay, Inc. All rights reserved.</span>
          <span className="flex gap-5">
            <a href="#" className="hover:text-[var(--text-secondary)]">Privacy</a>
            <a href="#" className="hover:text-[var(--text-secondary)]">Terms</a>
            <a href="#" className="hover:text-[var(--text-secondary)]">Security</a>
          </span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group relative overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-7"
    >
      <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-gradient-to-br ${accent} text-white shadow-[var(--shadow-glow-brand)]`}>
        {icon}
      </div>
      <h3 className="text-[18px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">{body}</p>
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--brand-500)]/0 blur-3xl transition-all duration-500 group-hover:bg-[var(--brand-500)]/15" />
    </motion.div>
  );
}
