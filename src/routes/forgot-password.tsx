import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/np/Button";
import { Input } from "@/components/np/Input";
import { Logo } from "@/components/np/Logo";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Reset password — NanoPay" }],
  }),
  component: Page,
});

function Page() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    await new Promise((r) => setTimeout(r, 900));
    setState("sent");
  }

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="w-full max-w-[400px]">
        <Logo />
        <h1 className="mt-8 text-[26px] font-bold tracking-tight">Reset your password</h1>
        <p className="mt-1.5 text-[14px] text-[var(--text-secondary)]">
          Enter the email associated with your account and we'll send you a reset link.
        </p>

        <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-3">
          <Input
            label="Email"
            type="email"
            leftIcon={<Mail />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button
            type="submit"
            size="lg"
            loading={state === "loading"}
            disabled={state === "sent"}
            className={`w-full transition-colors ${state === "sent" ? "!bg-[var(--success-500)] !bg-none" : ""}`}
            leftIcon={state === "sent" ? <Check className="h-4 w-4" /> : undefined}
          >
            {state === "sent" ? "Check your inbox" : "Send reset link"}
          </Button>
          {state === "sent" && (
            <p className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-[13px] text-[var(--text-secondary)] animate-in fade-in slide-in-from-bottom-1">
              If an account exists for <span className="text-[var(--text-primary)]">{email}</span>,
              you'll receive an email shortly.
            </p>
          )}
        </form>

        <Link
          to="/login"
          className="group mt-6 inline-flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
