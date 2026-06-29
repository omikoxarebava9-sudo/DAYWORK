export function LogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Calendar outline */}
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2"
        className="fill-amber-500/20 stroke-amber-500"
        strokeWidth="2"
      />
      {/* Calendar top bar */}
      <rect
        x="3"
        y="4"
        width="18"
        height="5"
        className="fill-amber-500/30 stroke-amber-500"
        strokeWidth="2"
      />
      {/* Calendar rings */}
      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Day with X mark */}
      <rect x="9.5" y="11" width="5" height="5" rx="1" className="fill-amber-500" />
      <path d="M10.5 12L13.5 15M13.5 12L10.5 15" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon className="w-8 h-8 text-amber-500" />
      <span className="font-semibold text-xl tracking-tight">DayWork</span>
    </div>
  );
}
