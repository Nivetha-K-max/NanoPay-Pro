import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { Sidebar, MobileTabBar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

function AppShell() {
  const user = useAuth((s) => s.user);
  const [palette, setPalette] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined" && !user) {
      // Hydrate-safe redirect (client-only since mock auth is in localStorage)
      window.location.replace("/login");
    }
  }, [user]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!user) {
    return <div className="grid min-h-dvh place-items-center text-[var(--text-muted)]">Redirecting…</div>;
  }

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div className="lg:pl-[240px]">
        <Topbar onOpenPalette={() => setPalette(true)} />
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
            className="px-5 pb-24 pt-6 lg:px-8 lg:pb-10"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
      <MobileTabBar />
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}

// silence unused
void redirect;
