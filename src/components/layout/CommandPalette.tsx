import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, ArrowRight, LayoutDashboard, Send, Receipt, LogOut } from "lucide-react";
import { useAuth } from "@/store/auth";

interface Action {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const signOut = useAuth((s) => s.signOut);
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);

  const actions = useMemo<Action[]>(
    () => [
      { id: "dash", label: "Go to Dashboard", icon: LayoutDashboard, run: () => navigate({ to: "/dashboard" }) },
      { id: "send", label: "Send money", hint: "New transfer", icon: Send, run: () => navigate({ to: "/send" }) },
      { id: "tx", label: "View transactions", icon: Receipt, run: () => navigate({ to: "/transactions" }) },
      {
        id: "out",
        label: "Sign out",
        icon: LogOut,
        run: () => {
          signOut();
          navigate({ to: "/login", replace: true });
        },
      },
    ],
    [navigate, signOut],
  );

  const filtered = useMemo(() => {
    if (!q.trim()) return actions;
    const t = q.toLowerCase();
    return actions.filter((a) => a.label.toLowerCase().includes(t));
  }, [q, actions]);

  useEffect(() => {
    if (open) {
      setQ("");
      setI(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setI((p) => Math.min(p + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setI((p) => Math.max(0, p - 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const a = filtered[i];
        if (a) {
          a.run();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, i, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-start justify-center pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.18 }}
            className="relative w-[92vw] max-w-[600px] overflow-hidden rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4">
              <Search className="h-4 w-4 text-[var(--text-muted)]" />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setI(0);
                }}
                placeholder="Search actions…"
                className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--text-muted)]"
              />
              <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-[11px] text-[var(--text-muted)]">
                Esc
              </kbd>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <li className="px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">No results</li>
              )}
              {filtered.map((a, idx) => {
                const Icon = a.icon;
                const active = idx === i;
                return (
                  <li key={a.id}>
                    <button
                      onMouseEnter={() => setI(idx)}
                      onClick={() => {
                        a.run();
                        onClose();
                      }}
                      className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] transition-colors ${
                        active ? "bg-[var(--brand-500)]/15 text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{a.label}</span>
                      {a.hint && <span className="text-[11px] text-[var(--text-muted)]">{a.hint}</span>}
                      {active && <ArrowRight className="h-4 w-4 text-[var(--brand-400)]" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
