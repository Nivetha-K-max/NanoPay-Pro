import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Activity,
  Globe,
  Sparkles,
  Lock,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Logo } from "@/components/np/Logo";
import { Button } from "@/components/np/Button";
import { CustomCursor } from "@/components/finmesh/CustomCursor";
import { ParticleGrid } from "@/components/finmesh/ParticleGrid";
import { AgentCard, AgentDetails } from "@/components/finmesh/AgentCard";
import { AgentSimulator } from "@/components/finmesh/AgentSimulator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FinMesh — Autonomous Agentic Mesh for Global Finance" },
      {
        name: "description",
        content: "Experience the next evolution of global finance with FinMesh — a multi-agent autonomous settlement fabric.",
      },
      { property: "og:title", content: "FinMesh — Autonomous Agentic Mesh for Global Finance" },
      { property: "og:description", content: "Scroll-driven multi-agent orchestration for instant cross-border settlement." },
    ],
  }),
  component: FinMeshLanding,
});

const TICKER = [
  { who: "Apex Capital", amount: 450000.0, target: "Tokyo", status: "Sentinel Approved" },
  { who: "Aether FX", amount: 1250000.0, target: "London", status: "Liquidity Routed" },
  { who: "Vanguard Tech", amount: 89000.0, target: "Singapore", status: "ZK Sanction Passed" },
  { who: "Nova Pay", amount: 510000.0, target: "Frankfurt", status: "Atomic Commit" },
  { who: "Zenith Global", amount: 75000.0, target: "Dubai", status: "Settled 42ms" },
];

const AGENTS_LIST: AgentDetails[] = [
  {
    id: "sentinel",
    name: "Sentinel-X",
    codename: "AGENT-01 // AUDIT",
    role: "ML Risk & Anomaly Sentinel",
    accent: "cyan",
    icon: <ShieldCheck className="h-6 w-6 text-cyan-400" />,
    latency: "< 1.2ms",
    accuracy: "99.998%",
    throughput: "150k/sec",
    description: "Evaluates thousands of cryptographic and behavioral risk vectors in real time before approving transaction execution.",
    tasks: ["Zero-day pattern detection", "Behavioral graph modeling", "Instant threat isolation"],
  },
  {
    id: "liquidity",
    name: "Liquidity-Prime",
    codename: "AGENT-02 // ROUTER",
    role: "FX Liquidity & Yield Router",
    accent: "emerald",
    icon: <ArrowUpRight className="h-6 w-6 text-emerald-400" />,
    latency: "< 3.4ms",
    accuracy: "100%",
    throughput: "85k/sec",
    description: "Dynamically splits and routes transactions across global liquidity pools to ensure minimal slippage and optimal FX rates.",
    tasks: ["Global pool arbitrage", "Sub-pip FX optimization", "Automated rebalancing"],
  },
  {
    id: "compliance",
    name: "Compliance-Guard",
    codename: "AGENT-03 // ZK-AML",
    role: "Zero-Knowledge Sanctions Guard",
    accent: "violet",
    icon: <Cpu className="h-6 w-6 text-purple-400" />,
    latency: "< 2.1ms",
    accuracy: "100%",
    throughput: "120k/sec",
    description: "Executes mathematical ZK-proof verification against global watchlists without revealing private counterparty information.",
    tasks: ["OFAC ZK-Proof auditing", "Privacy-preserving AML", "Regulated jurisdiction verification"],
  },
  {
    id: "nexus",
    name: "Nexus-Settlement",
    codename: "AGENT-04 // ATOMIC",
    role: "Atomic Ledger Commit Engine",
    accent: "amber",
    icon: <Sparkles className="h-6 w-6 text-amber-400" />,
    latency: "< 8.5ms",
    accuracy: "100%",
    throughput: "200k/sec",
    description: "Finalizes atomic state transitions across multi-chain and sovereign ledger nodes in sub-10ms windows.",
    tasks: ["Multi-party state locks", "Instant settlement finality", "Rollback fault protection"],
  },
];

function FinMeshLanding() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll Progress Hooks for Zoom & Parallax Effects
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Altitude 0 -> Altitude 1 Zoom
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.88]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0]);

  // Altitude 1 -> Altitude 2 Zoom
  const compareScale = useTransform(scrollYProgress, [0.15, 0.35, 0.5], [0.85, 1, 0.9]);
  const compareOpacity = useTransform(scrollYProgress, [0.15, 0.3, 0.45], [0, 1, 0.2]);

  // Altitude 2 -> Altitude 3 Zoom
  const agentsScale = useTransform(scrollYProgress, [0.4, 0.6, 0.75], [0.88, 1, 0.92]);
  const agentsOpacity = useTransform(scrollYProgress, [0.4, 0.55, 0.7], [0, 1, 0.3]);

  // Altitude 3 -> Altitude 4 Zoom
  const simScale = useTransform(scrollYProgress, [0.65, 0.85, 1], [0.9, 1, 1]);
  const simOpacity = useTransform(scrollYProgress, [0.65, 0.8], [0, 1]);

  const [txCount, setTxCount] = useState(14820930);

  useEffect(() => {
    const interval = setInterval(() => {
      setTxCount((prev) => prev + Math.floor(Math.random() * 5) + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-white font-sans overflow-x-hidden">
      {/* Spotlight Cursor & Cybernetic Grid */}
      <CustomCursor />
      <ParticleGrid />

      {/* Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b border-white/10 bg-slate-950/70">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden sm:inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-cyan-400">
              Agentic Mesh v2.4
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-xs font-medium text-slate-400 md:flex">
            <a href="#overview" className="hover:text-cyan-400 transition-colors">Overview</a>
            <a href="#comparison" className="hover:text-cyan-400 transition-colors">The Shift</a>
            <a href="#agents" className="hover:text-cyan-400 transition-colors">Agents</a>
            <a href="#simulator" className="hover:text-cyan-400 transition-colors">Playground</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/login" })}>
              Sign in
            </Button>
            <Button
              size="sm"
              onClick={() => navigate({ to: "/register" })}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold border-none shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 transition-all"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Launch Portal
            </Button>
          </div>
        </div>
      </header>

      {/* Scroll-Driven Storytelling Track */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-24 pb-32">

        {/* ALTITUDE 0: MACRO FINANCIAL OVERVIEW */}
        <section id="overview" className="min-h-[85vh] flex flex-col justify-center items-center text-center relative pt-12">
          <motion.div style={{ scale: heroScale, opacity: heroOpacity }} className="w-full max-w-5xl mx-auto">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-4 py-1.5 text-xs font-mono text-slate-300 backdrop-blur-md shadow-lg">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Settled Today:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {txCount.toLocaleString()} TXs
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-8 text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[1.02]">
              Autonomous Agentic Mesh
              <br />
              <span className="text-gradient-cyan">For Global Finance.</span>
            </h1>

            <p className="mt-6 max-w-2xl mx-auto text-base sm:text-xl text-slate-400 leading-relaxed font-normal">
              FinMesh orchestrates autonomous micro-agents to execute instant cross-border settlement, ZK-compliance, and FX arbitrage in milliseconds.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate({ to: "/register" })}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-8 py-4 text-sm shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-transform hover:scale-105"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Deploy Agent Mesh
              </Button>
              <a
                href="#simulator"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md hover:border-cyan-500/40 hover:bg-slate-900 transition-all"
              >
                <Sparkles className="h-4 w-4 text-cyan-400" />
                Live Playground
              </a>
            </div>

            {/* Global Real-time Stream Ticker */}
            <div className="mt-16 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
              <div className="flex animate-[ticker_35s_linear_infinite] gap-8 whitespace-nowrap py-3.5 text-xs font-mono text-slate-400">
                {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
                  <span key={i} className="inline-flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <span className="font-bold text-white">{t.who}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-400 font-bold">${t.amount.toLocaleString()} USD</span>
                    <span className="text-slate-500">[{t.target}]</span>
                    <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-300 border border-cyan-500/20">{t.status}</span>
                  </span>
                ))}
              </div>
            </div>
            <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }`}</style>
          </motion.div>

          {/* Scroll Down Indicator */}
          <div className="mt-12 flex flex-col items-center gap-2 text-xs font-mono text-slate-500 animate-bounce">
            <span>SCROLL TO DIVE DEEPER</span>
            <ChevronDown className="h-4 w-4 text-cyan-400" />
          </div>
        </section>


        {/* ALTITUDE 1: THE SHIFT — LEGACY RAILS VS FINMESH */}
        <section id="comparison" className="py-32 relative">
          <motion.div style={{ scale: compareScale, opacity: compareOpacity }} className="w-full">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                ALTITUDE LEVEL 01 // ARCHITECTURE EVOLUTION
              </span>
              <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                From Siloed Banking Rails to <span className="text-gradient-cyan">Agentic Mesh</span>
              </h2>
              <p className="mt-4 text-slate-400 text-sm sm:text-base">
                Legacy financial rails rely on fragmented intermediaries and manual clearinghouses. FinMesh replaces latency with autonomous state negotiation.
              </p>
            </div>

            {/* Side-by-side Contrast Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Legacy Card */}
              <div className="rounded-3xl border border-red-500/20 bg-slate-900/50 p-8 backdrop-blur-xl relative overflow-hidden">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-mono text-red-400 mb-6">
                  Legacy SWIFT / Correspondent Banking
                </div>
                <h3 className="text-2xl font-bold text-white mb-6">The Legacy Bottleneck</h3>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <span className="text-red-400 font-mono font-bold">3-5 Days</span>
                    <span className="text-slate-300">Cross-border settlement delays with batch processing.</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <span className="text-red-400 font-mono font-bold">3.5% - 5.0%</span>
                    <span className="text-slate-300">Opaque FX markups and correspondent routing fees.</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <span className="text-red-400 font-mono font-bold">High Friction</span>
                    <span className="text-slate-300">Manual compliance holds and false-positive fraud freezes.</span>
                  </div>
                </div>
              </div>

              {/* FinMesh Card */}
              <div className="rounded-3xl border border-cyan-500/40 bg-slate-900/80 p-8 backdrop-blur-xl relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)]">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 text-xs font-mono text-cyan-300 mb-6">
                  FinMesh Multi-Agent Orchestration
                </div>
                <h3 className="text-2xl font-bold text-white mb-6">The Autonomous Future</h3>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <span className="text-cyan-400 font-mono font-bold">&lt; 45ms</span>
                    <span className="text-slate-200">Sub-second atomic state finality across distributed ledgers.</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <span className="text-cyan-400 font-mono font-bold">0.01%</span>
                    <span className="text-slate-200">Optimal liquidity routing with near-zero slippage.</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <span className="text-cyan-400 font-mono font-bold">ZK Audit</span>
                    <span className="text-slate-200">Zero-Knowledge mathematical sanction verification in real time.</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>


        {/* ALTITUDE 2: DEEP DIVE — AUTONOMOUS AGENT TOPOLOGY */}
        <section id="agents" className="py-32 relative">
          <motion.div style={{ scale: agentsScale, opacity: agentsOpacity }} className="w-full">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                ALTITUDE LEVEL 02 // AGENT TOPOLOGY
              </span>
              <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Meet the Autonomous <span className="text-gradient-emerald">Settlement Squad</span>
              </h2>
              <p className="mt-4 text-slate-400 text-sm sm:text-base">
                Four specialized micro-agents communicate over high-frequency channels to validate, route, and finalize every transaction.
              </p>
            </div>

            {/* 3D Tilt Agent Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {AGENTS_LIST.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </motion.div>
        </section>


        {/* ALTITUDE 3: LIVE ORCHESTRATION PLAYGROUND */}
        <section id="simulator" className="py-32 relative">
          <motion.div style={{ scale: simScale, opacity: simOpacity }} className="w-full">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase">
                ALTITUDE LEVEL 03 // LIVE SIMULATION
              </span>
              <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Interactive Agent <span className="text-gradient-hero">Orchestration</span>
              </h2>
              <p className="mt-4 text-slate-400 text-sm sm:text-base">
                Test the multi-agent pipeline in real time. Choose parameters below and observe instant peer-to-peer negotiation.
              </p>
            </div>

            {/* Simulator Widget */}
            <AgentSimulator />
          </motion.div>
        </section>


        {/* ALTITUDE 4: ENTERPRISE IMPACT & CTA */}
        <section className="py-24 relative">
          <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-10 sm:p-16 text-center backdrop-blur-2xl relative overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.15)]">
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-4 py-1 text-xs font-mono text-cyan-300 mb-6">
                <Lock className="h-3.5 w-3.5 text-cyan-400" />
                SOC 2 Type II Certified & ISO 27001 Ready
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Ready to upgrade your financial infrastructure?
              </h2>
              <p className="mt-4 text-slate-400 text-sm sm:text-base">
                Connect your business to FinMesh in minutes with our developer-first SDKs and unified REST & WebSocket APIs.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate({ to: "/register" })}
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold px-8 py-4 shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-transform hover:scale-105"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Create Developer Account
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate({ to: "/login" })}
                  className="border border-white/15 bg-slate-900/80 text-white hover:bg-slate-800"
                >
                  Explore Console Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <Logo size={22} />
            <span className="font-mono text-slate-400">FinMesh Autonomous Inc.</span>
          </div>
          <span>© {new Date().getFullYear()} FinMesh. All rights reserved.</span>
          <div className="flex gap-6 text-slate-400 font-mono">
            <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Security Audit</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
