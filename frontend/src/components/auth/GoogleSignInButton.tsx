"use client";

import { GoogleIcon } from "@/components/auth/GoogleIcon";

interface GoogleSignInButtonProps {
  label: string;
  onClick: () => void;
}

export function GoogleSignInButton({ label, onClick }: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-4 flex items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-semibold text-sm text-on-surface hover:bg-surface-container-low active:scale-[0.98] transition-all"
    >
      <GoogleIcon size={20} />
      {label}
    </button>
  );
}
