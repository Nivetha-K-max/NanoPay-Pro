export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <defs>
          <linearGradient id="npg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60a5fa" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#npg)" />
        <path d="M9 22V10h2.6l6 8.1V10H20v12h-2.6l-6-8.1V22H9Z" fill="white" />
      </svg>
      <span className="text-[15px] font-bold tracking-tight">NanoPay</span>
    </div>
  );
}
