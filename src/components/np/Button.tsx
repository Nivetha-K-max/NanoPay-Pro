import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg" | "icon";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const base =
  "relative inline-flex items-center justify-center gap-2 font-medium rounded-[10px] " +
  "transition-[transform,background,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] " +
  "active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-500)] select-none";

const variants: Record<Variant, string> = {
  primary:
    "text-white shadow-[0_1px_0_rgba(255,255,255,0.1)_inset] bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] " +
    "hover:shadow-[var(--shadow-glow-brand)] hover:brightness-110",
  secondary:
    "border border-[var(--border-default)] text-[var(--text-primary)] bg-transparent " +
    "hover:bg-[var(--bg-elevated)] hover:border-[var(--brand-500)]/60",
  danger:
    "border border-[var(--danger-500)]/60 text-[var(--danger-400)] bg-transparent " +
    "hover:bg-[var(--danger-500)]/10 hover:border-[var(--danger-500)]",
  ghost:
    "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-[14px]",
  lg: "h-12 px-6 text-[15px]",
  icon: "h-9 w-9 p-0",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", loading, leftIcon, rightIcon, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children && <span className={cn(loading && size !== "icon" && "opacity-0")}>{children}</span>}
      {!loading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
});
