"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getTokenBalance } from "@/lib/api";

export { CREDIT_PACKAGES, type CreditPackage } from "@/lib/credits";

interface CreditsContextValue {
  isOpen: boolean;
  openCredits: () => void;
  closeCredits: () => void;
  balance: number | null;
  refreshBalance: () => Promise<void>;
  adjustBalance: (delta: number) => void;
}

const CreditsContext = createContext<CreditsContextValue | undefined>(undefined);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  const openCredits = useCallback(() => setIsOpen(true), []);
  const closeCredits = useCallback(() => setIsOpen(false), []);

  const refreshBalance = useCallback(async () => {
    try {
      const data = await getTokenBalance();
      setBalance(data.tokens);
    } catch {
      // Ignore: keep the previous value (likely unauthenticated or offline).
    }
  }, []);

  // Optimistically nudge the displayed balance (e.g. -1 when a generation
  // starts) so the badge updates instantly without a page reload. The real
  // value is reconciled later via refreshBalance().
  const adjustBalance = useCallback((delta: number) => {
    setBalance((prev) => (prev === null ? prev : Math.max(0, prev + delta)));
  }, []);

  // Reset the balance to null on sign-out, during render (avoids an effect).
  const [prevAuth, setPrevAuth] = useState(isAuthenticated);
  if (isAuthenticated !== prevAuth) {
    setPrevAuth(isAuthenticated);
    if (!isAuthenticated) setBalance(null);
  }

  // Load the balance once auth state is known.
  useEffect(() => {
    if (!(isReady && isAuthenticated)) return;
    let active = true;
    getTokenBalance()
      .then((data) => {
        if (active) setBalance(data.tokens);
      })
      .catch(() => {
        // Ignore (likely unauthenticated or offline).
      });
    return () => {
      active = false;
    };
  }, [isReady, isAuthenticated]);

  return (
    <CreditsContext.Provider
      value={{ isOpen, openCredits, closeCredits, balance, refreshBalance, adjustBalance }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits(): CreditsContextValue {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return context;
}
