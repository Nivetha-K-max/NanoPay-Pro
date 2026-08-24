import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

export interface AgentDetails {
  id: string;
  name: string;
  codename: string;
  role: string;
  accent: "cyan" | "emerald" | "violet" | "amber";
  icon: React.ReactNode;
  latency: string;
  accuracy: string;
  throughput: string;
  description: string;
  tasks: string[];
}

export function AgentCard({ agent }: { agent: AgentDetails }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 3D Motion values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const accentStyles = {
    cyan: {
      badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
      glow: "from-cyan-500/20 via-blue-500/10 to-transparent",
      iconBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
      metric: "text-cyan-400",
      border: "hover:border-cyan-500/40",
    },
    emerald: {
      badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      glow: "from-emerald-500/20 via-teal-500/10 to-transparent",
      iconBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
      metric: "text-emerald-400",
      border: "hover:border-emerald-500/40",
    },
    violet: {
      badge: "border-purple-500/30 bg-purple-500/10 text-purple-400",
      glow: "from-purple-500/20 via-indigo-500/10 to-transparent",
      iconBg: "bg-purple-500/15 border-purple-500/30 text-purple-300",
      metric: "text-purple-400",
      border: "hover:border-purple-500/40",
    },
    amber: {
      badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
      glow: "from-amber-500/20 via-orange-500/10 to-transparent",
      iconBg: "bg-amber-500/15 border-amber-500/30 text-amber-300",
      metric: "text-amber-400",
      border: "hover:border-amber-500/40",
    },
  }[agent.accent];

  return (
    <div className="perspective-1000">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-7 backdrop-blur-xl transition-colors duration-300 ${accentStyles.border}`}
      >
        {/* Dynamic mouse spotlight gradient overlay */}
        <div
          className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${accentStyles.glow} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
        />

        <div className="relative z-10">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-mono font-medium ${accentStyles.badge}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              {agent.codename}
            </div>
            <span className="text-xs font-mono text-slate-500">{agent.role}</span>
          </div>

          {/* Title & Icon */}
          <div className="mt-5 flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${accentStyles.iconBg}`}>
              {agent.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white">{agent.name}</h3>
              <p className="text-xs text-slate-400">Autonomous Micro-Agent</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-300">{agent.description}</p>

          {/* Real-time Metrics bar */}
          <div className="mt-6 grid grid-cols-3 gap-2 rounded-xl border border-white/5 bg-slate-950/60 p-3 text-center">
            <div>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Latency</p>
              <p className={`mt-0.5 text-sm font-mono font-bold ${accentStyles.metric}`}>{agent.latency}</p>
            </div>
            <div className="border-x border-white/5">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Precision</p>
              <p className={`mt-0.5 text-sm font-mono font-bold ${accentStyles.metric}`}>{agent.accuracy}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">TPS</p>
              <p className={`mt-0.5 text-sm font-mono font-bold ${accentStyles.metric}`}>{agent.throughput}</p>
            </div>
          </div>

          {/* Autonomous Duties Checklist */}
          <div className="mt-6 space-y-2">
            {agent.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span>{task}</span>
              </div>
            ))}
          </div>

          {/* Interactive footer tag */}
          <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
            <span className="text-xs font-mono text-slate-400">Status: Active & Listening</span>
            <ArrowUpRight className={`h-4 w-4 transition-transform duration-300 ${isHovered ? "translate-x-1 -translate-y-1 text-white" : "text-slate-600"}`} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
