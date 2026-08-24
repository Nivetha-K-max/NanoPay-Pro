import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { TxStatus } from "@/lib/mock";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "purple";

const tones: Record<Tone, string> = {
  success: "bg-[var(--success-500)]/15 text-[var(--success-400)] border-[var(--success-500)]/30",
  warning: "bg-[var(--warning-500)]/15 text-[var(--warning-400)] border-[var(--warning-500)]/30",
  danger: "bg-[var(--danger-500)]/15 text-[var(--danger-400)] border-[var(--danger-500)]/30",
  info: "bg-[var(--brand-500)]/15 text-[var(--brand-400)] border-[var(--brand-500)]/30",
  neutral: "bg-white/8 text-slate-300 border-white/10",
  purple: "bg-purple-500/15 text-purple-300 border-purple-500/30",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  pulse,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {pulse && <span className="relative inline-flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>}
      {children}
    </span>
  );
}

const statusMap: Record<TxStatus, { tone: Tone; pulse?: boolean }> = {
  PENDING: { tone: "warning" },
  PROCESSING: { tone: "info", pulse: true },
  SUCCESS: { tone: "success" },
  FAILED: { tone: "danger" },
  REVERSED: { tone: "purple" },
};

export function StatusBadge({ status }: { status: TxStatus }) {
  const m = statusMap[status];
  return (
    <Badge tone={m.tone} pulse={m.pulse}>
      {status}
    </Badge>
  );
}
