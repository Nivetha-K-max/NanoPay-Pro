import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/np/Logo";
import { useAuth } from "@/store/auth";
import {
  LayoutDashboard,
  Send,
  Receipt,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initials, avatarColor } from "@/lib/mock";
import { useState } from "react";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/send", icon: Send, label: "Send Money" },
  { to: "/transactions", icon: Receipt, label: "Transactions" },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;
  const name = `${user.firstName} ${user.lastName}`;

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[240px] flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-5 lg:flex">
      <div className="px-2">
        <Link to="/dashboard" className="inline-flex">
          <Logo />
        </Link>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-300)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-400)]" />
          {user.role}
        </div>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium transition-all duration-200",
                active
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-white/[0.03] hover:text-[var(--text-primary)]",
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--brand-500)] transition-all duration-200",
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                )}
              />
              <Icon className={cn("h-[18px] w-[18px]", active && "text-[var(--brand-400)]")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t border-[var(--border-subtle)] pt-3">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-[10px] p-2 hover:bg-white/[0.03]"
        >
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[12px] font-bold text-white",
              avatarColor(name),
            )}
          >
            {initials(name)}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[13px] font-semibold">{name}</span>
            <span className="block truncate text-[11px] text-[var(--text-muted)]">{user.email}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
        </button>
        {menuOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-1 shadow-[var(--shadow-lg)]">
            <button className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]">
              <Settings className="h-4 w-4" /> Settings
            </button>
            <button className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]">
              <Bell className="h-4 w-4" /> Notifications
            </button>
            <div className="my-1 h-px bg-[var(--border-subtle)]" />
            <button
              onClick={() => {
                signOut();
                navigate({ to: "/login", replace: true });
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--danger-400)] hover:bg-[var(--danger-500)]/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export function MobileTabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--border-subtle)] bg-[var(--bg-base)]/95 backdrop-blur-xl lg:hidden">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              active ? "text-[var(--brand-400)]" : "text-[var(--text-muted)]",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
