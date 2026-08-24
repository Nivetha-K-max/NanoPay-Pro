import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Check, ShieldCheck, Cpu, ArrowRightLeft, Sparkles, RefreshCw, Terminal } from "lucide-react";

interface LogEntry {
  id: string;
  time: string;
  agent: string;
  message: string;
  type: "info" | "success" | "warn";
}

export function AgentSimulator() {
  const [amount, setAmount] = useState(50000);
  const [currency, setCurrency] = useState("EUR");
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [executionTime, setExecutionTime] = useState<number>(0);

  const steps = [
    {
      id: "sentinel",
      name: "Sentinel-X",
      role: "ML Risk & Fraud Audit",
      icon: <ShieldCheck className="h-5 w-5 text-cyan-400" />,
      color: "border-cyan-500/50 bg-cyan-500/10 text-cyan-300",
    },
    {
      id: "liquidity",
      name: "Liquidity-Prime",
      role: "Dynamic FX Liquidity Router",
      icon: <ArrowRightLeft className="h-5 w-5 text-emerald-400" />,
      color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
    },
    {
      id: "compliance",
      name: "Compliance-Guard",
      role: "Zero-Knowledge Sanction Audit",
      icon: <Cpu className="h-5 w-5 text-purple-400" />,
      color: "border-purple-500/50 bg-purple-500/10 text-purple-300",
    },
    {
      id: "nexus",
      name: "Nexus-Settlement",
      role: "Atomic Ledger Commit",
      icon: <Sparkles className="h-5 w-5 text-amber-400" />,
      color: "border-amber-500/50 bg-amber-500/10 text-amber-300",
    },
  ];

  const runSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveStep(0);
    setLogs([]);
    setExecutionTime(0);

    const now = () => new Date().toLocaleTimeString([], { hour12: false, minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 } as any);

    // Timeline simulation
    const startTime = performance.now();

    // Step 0: Sentinel
    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        {
          id: "1",
          time: now(),
          agent: "Sentinel-X",
          message: `Inbound request: $${amount.toLocaleString()} USD -> ${currency}. Scanning 4,200 risk vectors...`,
          type: "info",
        },
        {
          id: "2",
          time: now(),
          agent: "Sentinel-X",
          message: `Risk score: 0.0021 (CLEAR). No anomaly detected. Proceeding to liquidity routing.`,
          type: "success",
        },
      ]);
      setActiveStep(1);
    }, 600);

    // Step 1: Liquidity
    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        {
          id: "3",
          time: now(),
          agent: "Liquidity-Prime",
          message: `Querying global pools across NY, London, Tokyo... Optimal FX rate found at 0.9184 ${currency}/USD.`,
          type: "info",
        },
        {
          id: "4",
          time: now(),
          agent: "Liquidity-Prime",
          message: `Slippage: < 0.001%. Liquidity locked for atomic transfer window.`,
          type: "success",
        },
      ]);
      setActiveStep(2);
    }, 1300);

    // Step 2: Compliance
    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        {
          id: "5",
          time: now(),
          agent: "Compliance-Guard",
          message: `Executing zero-knowledge proof sanction verification against OFAC/EU watchlists...`,
          type: "info",
        },
        {
          id: "6",
          time: now(),
          agent: "Compliance-Guard",
          message: `ZK-Proof generated & validated. Privacy preserved. Sanction status: VERIFIED CLEAN.`,
          type: "success",
        },
      ]);
      setActiveStep(3);
    }, 2000);

    // Step 3: Nexus Settlement
    setTimeout(() => {
      const elapsed = Math.round(performance.now() - startTime);
      setExecutionTime(elapsed);
      setLogs((prev) => [
        ...prev,
        {
          id: "7",
          time: now(),
          agent: "Nexus-Settlement",
          message: `Constructing atomic block commit. Multi-party signature threshold reached.`,
          type: "info",
        },
        {
          id: "8",
          time: now(),
          agent: "Nexus-Settlement",
          message: `SETTLEMENT COMPLETE. Finalized in ${elapsed}ms. State hash: 0x8f9c...4a2e`,
          type: "success",
        },
      ]);
      setActiveStep(4);
      setIsRunning(false);
    }, 2700);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-6 md:p-10 backdrop-blur-2xl shadow-2xl">
      {/* Simulator Control Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono text-cyan-400">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            Live Orchestration Playground
          </div>
          <h3 className="mt-2 text-2xl font-bold text-white tracking-tight">
            Autonomous Multi-Agent Pipeline
          </h3>
          <p className="text-sm text-slate-400">
            Trigger a simulated cross-border transfer and observe agent negotiation in real time.
          </p>
        </div>

        {/* Input parameters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-mono text-slate-300">
            <span>Amount:</span>
            <select
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              disabled={isRunning}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value={5000} className="bg-slate-900">$5,000 USD</option>
              <option value={50000} className="bg-slate-900">$50,000 USD</option>
              <option value={250000} className="bg-slate-900">$250,000 USD</option>
              <option value={1000000} className="bg-slate-900">$1,000,000 USD</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-mono text-slate-300">
            <span>Target:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={isRunning}
              className="bg-transparent font-bold text-cyan-400 focus:outline-none cursor-pointer"
            >
              <option value="EUR" className="bg-slate-900">EUR (€)</option>
              <option value="GBP" className="bg-slate-900">GBP (£)</option>
              <option value="JPY" className="bg-slate-900">JPY (¥)</option>
              <option value="SGD" className="bg-slate-900">SGD ($)</option>
            </select>
          </div>

          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Orchestrating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                Execute Agent Pipeline
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          const isActive = activeStep === idx;
          const isDone = activeStep > idx;

          return (
            <div key={step.id} className="relative">
              <motion.div
                animate={{
                  scale: isActive ? 1.03 : 1,
                  borderColor: isActive ? "rgba(6, 182, 212, 0.6)" : isDone ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.08)",
                }}
                className={`rounded-2xl border p-5 transition-all ${
                  isActive
                    ? "bg-slate-900 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                    : isDone
                    ? "bg-slate-900/60"
                    : "bg-slate-950/40 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border ${step.color}`}>{step.icon}</div>
                  {isDone ? (
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                  ) : isActive ? (
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-600">0{idx + 1}</span>
                  )}
                </div>

                <h4 className="mt-4 text-base font-bold text-white">{step.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{step.role}</p>

                {/* Agent Activity Bar */}
                <div className="mt-4 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: isDone ? "100%" : isActive ? "65%" : "0%",
                    }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${
                      isDone ? "bg-emerald-400" : isActive ? "bg-cyan-400" : "bg-transparent"
                    }`}
                  />
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Terminal Output */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/90 p-5 font-mono text-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <span>Agent Communication Log Stream</span>
          </div>
          {executionTime > 0 && (
            <span className="text-emerald-400 font-bold">Total Execution: {executionTime}ms</span>
          )}
        </div>

        <div className="mt-4 h-44 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic py-8 text-center">
              Press "Execute Agent Pipeline" to view real-time log orchestration stream...
            </div>
          ) : (
            <AnimatePresence>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3"
                >
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span
                    className={`shrink-0 font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      log.agent === "Sentinel-X"
                        ? "bg-cyan-500/20 text-cyan-300"
                        : log.agent === "Liquidity-Prime"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : log.agent === "Compliance-Guard"
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {log.agent}
                  </span>
                  <span className={log.type === "success" ? "text-emerald-300" : "text-slate-300"}>
                    {log.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
