"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError, createCartCheckoutSession } from "@/lib/api";

/**
 * Checkout mini-menu for the favorites cart.
 *
 * Mobile-first bottom sheet that becomes a centered dialog on desktop (lg+).
 * Shows the total, collects the buyer's name + shipping address, then creates
 * a Stripe Checkout session via the backend and redirects to it.
 */
export function CartCheckoutModal() {
  const { items, total, totalLabel, isCheckoutOpen, closeCheckout } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset transient state when the sheet is (re)opened — during render.
  const [wasOpen, setWasOpen] = useState(isCheckoutOpen);
  if (isCheckoutOpen !== wasOpen) {
    setWasOpen(isCheckoutOpen);
    if (isCheckoutOpen) {
      setError(null);
      setIsSubmitting(false);
    }
  }

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!isCheckoutOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeCheckout();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isCheckoutOpen, closeCheckout]);

  // Only items with a numeric backend id can be charged.
  const payableIds = items
    .map((item) => Number(item.id))
    .filter((id) => Number.isInteger(id) && id > 0);

  const canPay =
    !isSubmitting && total > 0 && payableIds.length > 0 && name.trim() !== "" && address.trim() !== "";

  async function handlePay() {
    if (!canPay) return;

    if (!isAuthenticated) {
      closeCheckout();
      router.push("/signin");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { checkout_url } = await createCartCheckoutSession(
        payableIds,
        name.trim(),
        address.trim(),
      );
      if (!checkout_url) throw new Error("Could not start the checkout.");
      window.location.href = checkout_url;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        closeCheckout();
        router.push("/signin");
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden={!isCheckoutOpen}
        onClick={closeCheckout}
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
          isCheckoutOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sheet / Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
        className={`fixed z-50 transform transition-transform duration-300 ease-out
          inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-3xl
          lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:w-full lg:max-w-lg
          lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl
          bg-surface-container-lowest shadow-2xl
          ${
            isCheckoutOpen
              ? "translate-y-0 lg:opacity-100"
              : "translate-y-full lg:-translate-y-1/2 lg:opacity-0 lg:pointer-events-none"
          }`}
      >
        <div className="flex flex-col px-5 pb-8 pt-4 lg:px-8 lg:pb-8 lg:pt-6">
          {/* Grab handle (mobile only) */}
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-outline-variant lg:hidden" />

          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-medium text-on-surface">Checkout</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {items.length} item{items.length === 1 ? "" : "s"} in your cart.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={closeCheckout}
              className="-mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high active:scale-95 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>

          {/* Total */}
          <div className="mb-5 flex items-center justify-between rounded-2xl bg-secondary-container/50 px-4 py-3">
            <span className="text-sm font-medium text-on-secondary-container">Total</span>
            <span className="text-xl font-bold tabular-nums text-on-surface">{totalLabel}</span>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-on-surface-variant">Full name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface placeholder-outline focus:outline-none focus:ring-1 focus:ring-primary-container"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-on-surface-variant">Shipping address</span>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, number, city, postal code"
                rows={2}
                autoComplete="street-address"
                className="w-full resize-none rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface placeholder-outline focus:outline-none focus:ring-1 focus:ring-primary-container"
              />
            </label>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-error-container/60 px-3 py-2 text-center text-xs font-medium text-on-error-container"
            >
              {error}
            </p>
          )}

          {/* Pay */}
          <button
            type="button"
            onClick={handlePay}
            disabled={!canPay}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary-container text-sm font-semibold text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Redirecting…
              </>
            ) : (
              <>Proceed to payment · {totalLabel}</>
            )}
          </button>

          <p className="mt-3 text-center text-xs text-outline">Secure payment via Stripe.</p>
        </div>
      </div>
    </>
  );
}
