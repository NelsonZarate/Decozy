"use client";

import { useEffect, useState } from "react";
import {
  CREDIT_PACKAGES,
  type CreditPackage,
  useCredits,
} from "@/components/credits/CreditsContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { BEST_VALUE_PACKAGE_ID } from "@/lib/credits";
import { ApiError, purchaseTokens } from "@/lib/api";
import { useRouter } from "next/navigation";

export function CreditsModal() {
  const { isOpen, closeCredits } = useCredits();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string>(BEST_VALUE_PACKAGE_ID);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected: CreditPackage | undefined = CREDIT_PACKAGES.find(
    (pkg) => pkg.id === selectedId,
  );

  // Close on Escape and lock body scroll while the sheet is open.
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeCredits();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, closeCredits]);

  // Reset transient state when the sheet opens (during render, avoids an effect).
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setError(null);
      setIsSubmitting(false);
    }
  }

  async function handleContinue() {
    if (!selected || isSubmitting) return;

    // The backend ties the purchase to the authenticated user.
    if (!isAuthenticated) {
      closeCredits();
      router.push("/signin");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { checkout_url } = await purchaseTokens(selected.id);
      if (!checkout_url) {
        throw new Error("Could not start the checkout.");
      }
      // Redirect to Stripe's hosted checkout page.
      window.location.href = checkout_url;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        closeCredits();
        router.push("/signin");
        return;
      }
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div
        aria-hidden={!isOpen}
        onClick={closeCredits}
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buy credits"
        className={`fixed z-50 transform transition-transform duration-300 ease-out
          inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-3xl
          lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:w-full lg:max-w-lg
          lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl
          bg-surface-container-lowest shadow-2xl
          ${
            isOpen
              ? "translate-y-0 lg:opacity-100"
              : "translate-y-full lg:-translate-y-1/2 lg:opacity-0 lg:pointer-events-none"
          }`}
      >
        <div className="flex flex-col px-5 pb-8 pt-4 lg:px-8 lg:pb-8 lg:pt-6">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-outline-variant lg:hidden" />

          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-medium text-on-surface">
                Add Credits
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Choose a package to keep designing.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={closeCredits}
              className="-mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high active:scale-95 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>

          <div role="radiogroup" aria-label="Credit packages" className="flex flex-col gap-3">
            {CREDIT_PACKAGES.map((pkg) => {
              const perCredit = pkg.price / pkg.credits;
              const isBestValue = pkg.id === BEST_VALUE_PACKAGE_ID;
              const isSelected = pkg.id === selectedId;

              return (
                <button
                  key={pkg.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedId(pkg.id)}
                  className={`group relative flex items-center justify-between gap-4 rounded-2xl border-2 px-4 py-4 text-left transition-all active:scale-[0.99] ${
                    isSelected
                      ? "border-secondary bg-secondary-container/50"
                      : "border-outline-variant/50 bg-surface-container-low hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected ? "border-secondary bg-secondary" : "border-outline"
                      }`}
                    >
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <div>
                      <p className="text-base font-semibold leading-tight text-on-surface">
                        {pkg.credits} credits
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        €{perCredit.toFixed(2)} per credit
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    {isBestValue && (
                      <span className="mb-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-on-secondary">
                        Best value
                      </span>
                    )}
                    <span className="text-lg font-bold tabular-nums text-on-surface">
                      €{pkg.price}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-error-container/60 px-3 py-2 text-center text-xs font-medium text-on-error-container"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selected || isSubmitting}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary-container text-sm font-semibold text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Redirecting…
              </>
            ) : (
              <>Continue to payment{selected ? ` · €${selected.price}` : ""}</>
            )}
          </button>

          <p className="mt-3 text-center text-xs text-outline">
            Secure payment via Stripe. Credits never expire.
          </p>
        </div>
      </div>
    </>
  );
}
