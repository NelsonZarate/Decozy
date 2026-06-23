"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCredits } from "@/components/credits/CreditsContext";
import Link from "next/link";

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();
  const { openCredits } = useCredits();

  function handleSignIn() {
    onClose();
  }

  function handleAddCredits() {
    onClose();
    openCredits();
  }

  function handleSignOut() {
    signOut();
    onClose();
    router.push("/");
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 left-0 h-full w-[75%] max-w-[300px] bg-white z-50 transform transition-transform duration-300 ease-in-out rounded-r-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6 pt-10">
          {isAuthenticated ? (
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full overflow-hidden bg-surface-container-high text-on-surface-variant">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-on-surface text-base truncate">
                  {user?.name ?? "Member"}
                </h3>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <p className="text-base font-semibold text-on-surface mb-1">
                Welcome to Decozy
              </p>
              <p className="text-xs text-outline mb-4">
                Sign in to save and sync your designs.
              </p>
            <Link
              href="/signin"
              onClick={handleSignIn}
              className="w-full py-3 flex items-center justify-center rounded-xl font-semibold text-sm text-surface bg-primary-container hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Sign In
            </Link>
            </div>
          )}

          <nav className="flex flex-col gap-1">
            <button
              onClick={handleAddCredits}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-on-secondary bg-secondary hover:opacity-90 active:scale-[0.98] transition-all w-full text-left shadow-sm"
            >
              <span className="text-on-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="9" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </span>
              Add Credits
            </button>
          </nav>

          {isAuthenticated && (
            <button
              onClick={handleSignOut}
              className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-error hover:bg-error-container/40 transition-colors w-full text-left"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          )}
        </div>
      </div>
    </>
  );
}
