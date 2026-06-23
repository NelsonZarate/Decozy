"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart/CartContext";
import { ApiError, verifyCartSession } from "@/lib/api";

type Phase = "verifying" | "success" | "unpaid" | "cancelled" | "error";

function CheckoutResult() {
  const searchParams = useSearchParams();
  const { clear } = useCart();

  const payment = searchParams.get("payment");
  const sessionId = searchParams.get("session_id");

  const [phase, setPhase] = useState<Phase>(() => {
    if (payment === "success" && sessionId) return "verifying";
    if (payment === "cancel") return "cancelled";
    return "error";
  });
  const [errorMessage, setErrorMessage] = useState<string>(
    payment ? "" : "No checkout session found.",
  );

  const verifiedRef = useRef(false);
  useEffect(() => {
    if (payment !== "success" || !sessionId) return;
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    verifyCartSession(sessionId)
      .then((res) => {
        if (res.status === "paid") {
          setPhase("success");
          clear();
        } else {
          setPhase("unpaid");
        }
      })
      .catch((err) => {
        setPhase("error");
        setErrorMessage(
          err instanceof ApiError ? err.message : "Could not verify your payment.",
        );
      });
  }, [payment, sessionId, clear]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-8 shadow-sm">
        {phase === "verifying" && (
          <>
            <Spinner />
            <h1 className="mt-5 font-serif text-2xl font-medium text-on-surface">
              Confirming your payment…
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">Just a moment.</p>
          </>
        )}

        {phase === "success" && (
          <>
            <IconCircle tone="success">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </IconCircle>
            <h1 className="mt-5 font-serif text-2xl font-medium text-on-surface">
              Order confirmed
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Thank you! Your payment was successful and your order is on its way.
            </p>
            <HomeButton />
          </>
        )}

        {phase === "unpaid" && (
          <>
            <IconCircle tone="neutral">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="7" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12" y2="17" />
              </svg>
            </IconCircle>
            <h1 className="mt-5 font-serif text-2xl font-medium text-on-surface">
              Payment not completed
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              We haven’t received your payment yet. If you were charged, it may take a moment.
            </p>
            <HomeButton />
          </>
        )}

        {phase === "cancelled" && (
          <>
            <IconCircle tone="neutral">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </IconCircle>
            <h1 className="mt-5 font-serif text-2xl font-medium text-on-surface">
              Payment cancelled
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              No charge was made. Your cart is still saved.
            </p>
            <HomeButton />
          </>
        )}

        {phase === "error" && (
          <>
            <IconCircle tone="error">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </IconCircle>
            <h1 className="mt-5 font-serif text-2xl font-medium text-on-surface">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              {errorMessage || "We couldn’t verify your payment."}
            </p>
            <HomeButton />
          </>
        )}
      </div>
    </main>
  );
}

function HomeButton() {
  return (
    <Link
      href="/"
      className="mt-6 flex h-11 w-full items-center justify-center rounded-2xl bg-primary-container text-sm font-semibold text-on-primary transition-all hover:opacity-90 active:scale-[0.98]"
    >
      Back to home
    </Link>
  );
}

function Spinner() {
  return (
    <span className="mx-auto block h-12 w-12 animate-spin rounded-full border-4 border-secondary-container border-t-secondary" />
  );
}

function IconCircle({
  tone,
  children,
}: {
  tone: "success" | "error" | "neutral";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "bg-secondary text-on-secondary"
      : tone === "error"
        ? "bg-error-container text-on-error-container"
        : "bg-surface-container-highest text-on-surface-variant";
  return (
    <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${toneClass}`}>
      {children}
    </span>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
          <Spinner />
        </main>
      }
    >
      <CheckoutResult />
    </Suspense>
  );
}
