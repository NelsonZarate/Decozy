"use client";

import { useCredits } from "@/components/credits/CreditsContext";

interface CreditsBadgeProps {
  className?: string;
}

export function CreditsBadge({ className = "" }: CreditsBadgeProps) {
  const { openCredits, balance } = useCredits();
  const display = balance ?? 0;

  return (
    <button
      type="button"
      onClick={openCredits}
      aria-label={`${display} credits available, add more`}
      className={`group flex items-center gap-1.5 rounded-full bg-secondary-container pl-1.5 pr-2.5 py-1 text-on-secondary-container shadow-sm hover:opacity-90 active:scale-[0.97] transition-all ${className}`}
    >
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-on-secondary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l2.4 5.2L20 8l-4 4 1 6-5-2.8L7 18l1-6-4-4 5.6-.8L12 2z" />
        </svg>
      </span>
      <span className="text-sm font-semibold tabular-nums leading-none">{display}</span>
    </button>
  );
}
