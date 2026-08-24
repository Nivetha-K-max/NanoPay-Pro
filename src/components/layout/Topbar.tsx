import { Bell, Search, Command } from "lucide-react";
import { useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const titles: Record<string, string> = {
  "/dashboard": "Overview",
  "/send": "Send Money",
  "/transactions": "Transactions",
};

export function Topbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { pathname } = useLocation();
  const [wsLive, setWsLive] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setWsLive((v) => v || true), 5000);
    return () => clearInterval(t);
  }, []);
  const title = titles[pathname] ?? "NanoPay";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/85 px-5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <h1 key={title} className="text-[15px] font-semibold tracking-tight animate-in fade-in slide-in-from-bottom-1 duration-300">
          {title}
        </h1>
        <span className="hidden items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] md:inline-flex">
          <span className={`h-1.5 w-1.5 rounded-full ${wsLive ? "bg-[var(--success-500)]" : "bg-[var(--text-muted)]"}`} />
          {wsLive ? "Live" : "Reconnecting"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenPalette}
          className="hidden h-9 items-center gap-2 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-[13px] text-[var(--text-muted)] transition-colors hover:border-[var(--border-default)] hover:text-[var(--text-secondary)] sm:flex"
        >
          <Search className="h-4 w-4" />
          <span>Search…</span>
          <kbd className="ml-6 inline-flex items-center gap-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)]">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>
        <button
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-[10px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--danger-500)] ring-2 ring-[var(--bg-base)]" />
        </button>
      </div>
    </header>
  );
}
