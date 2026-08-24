import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  error?: string;
  success?: boolean;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, success, leftIcon, rightSlot, type = "text", className, value, defaultValue, onFocus, onBlur, id, ...rest },
  ref,
) {
  const uid = useId();
  const inputId = id ?? uid;
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPw = type === "password";
  const realType = isPw && showPw ? "text" : type;
  const filled = !!value || !!defaultValue;
  const float = focused || filled;

  return (
    <div className="w-full">
      <div
        className={cn(
          "group relative flex h-14 items-center rounded-[10px] border bg-[var(--bg-surface)] transition-all duration-200",
          "border-[var(--border-subtle)] hover:border-[var(--border-default)]",
          focused && "border-[var(--brand-500)] shadow-[0_0_0_4px_rgba(59,130,246,0.12)]",
          error && "border-[var(--danger-500)] shadow-[0_0_0_4px_rgba(239,68,68,0.12)] shake",
          success && !error && "border-[var(--success-500)]",
        )}
      >
        {leftIcon && (
          <span className="pl-3.5 text-[var(--text-muted)] [&_svg]:h-4 [&_svg]:w-4">{leftIcon}</span>
        )}
        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute origin-left text-[var(--text-muted)] transition-all duration-150",
            leftIcon ? "left-10" : "left-4",
            float ? "top-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary)]" : "top-1/2 -translate-y-1/2 text-[15px]",
            error && "text-[var(--danger-400)]",
          )}
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          type={realType}
          value={value}
          defaultValue={defaultValue}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={cn(
            "peer w-full bg-transparent text-[15px] text-[var(--text-primary)] outline-none placeholder:text-transparent",
            leftIcon ? "pl-2 pr-4" : "px-4",
            "pt-5 pb-1",
            className,
          )}
          {...rest}
        />
        {isPw && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPw((v) => !v)}
            className="mr-3 rounded p-1.5 text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-secondary)]"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        {!isPw && rightSlot && <span className="mr-3">{rightSlot}</span>}
      </div>
      {error && (
        <p className="mt-1.5 pl-1 text-[12px] text-[var(--danger-400)] animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
});
