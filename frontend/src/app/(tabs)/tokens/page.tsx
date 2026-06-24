"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCredits } from "@/components/credits/CreditsContext";
import { ApiError, verifyTokenSession } from "@/lib/api";

type Phase = "verifying" | "success" | "unpaid" | "cancelled" | "error";

function TokensResult() {
  const searchParams = useSearchParams();
  const { refreshBalance, openCredits } = useCredits();

  const payment = searchParams.get("payment");
  const sessionId = searchParams.get("session_id");

  const [phase, setPhase] = useState<Phase>(() => {
    if (payment === "success" && sessionId) return "verifying";
    if (payment === "cancel") return "cancelled";
    return "error";
  });
  const [creditedTokens, setCreditedTokens] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>(
    payment === "success" && sessionId ? "" : payment ? "" : "No payment session found.",
  );

  // Verify the checkout session exactly once on mount.
  const verifiedRef = useRef(false);
  useEffect(() => {
    if (payment !== "success" || !sessionId) return;
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    verifyTokenSession(sessionId)
      .then((res) => {
        if (res.status === "paid") {
          setCreditedTokens(res.tokens_credited);
          setBalance(res.balance ?? null);
          setPhase("success");
          void refreshBalance();
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
  }, [payment, sessionId, refreshBalance]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-8 shadow-sm">
        {phase === "verifying" && (
          <>
            <Spinner />
            <h1 className="mt-5 font-serif text-2xl font-medium text-on-surface">
              Confirming your payment…
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Just a moment while we add your credits.
            </p>
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
              Payment successful
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              {creditedTokens && creditedTokens > 0
                ? `${creditedTokens} credits were added to your account.`
                : "Your credits are already up to date."}
            </p>
            {balance !== null && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-1.5 text-sm font-semibold text-on-secondary-container">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-on-secondary">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l2.4 5.2L20 8l-4 4 1 6-5-2.8L7 18l1-6-4-4 5.6-.8L12 2z" />
                  </svg>
                </span>
                {balance} credits
              </p>
            )}
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

        {phase === "cancelled" && <CancelledView openCredits={openCredits} />}

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

function CancelledView({ openCredits }: { openCredits: () => void }) {
  return (
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
        No charge was made. You can pick a package whenever you’re ready.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={openCredits}
          className="flex h-11 w-full items-center justify-center rounded-2xl bg-primary-container text-sm font-semibold text-on-primary transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Choose a package
        </button>
        <Link
          href="/design"
          className="flex h-11 w-full items-center justify-center rounded-2xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          Back to design
        </Link>
      </div>
    </>
  );
}

function HomeButton() {
  return (
    <Link
      href="/design"
      className="mt-6 flex h-11 w-full items-center justify-center rounded-2xl bg-primary-container text-sm font-semibold text-on-primary transition-all hover:opacity-90 active:scale-[0.98]"
    >
      Back to design
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

export default function TokensPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
          <Spinner />
        </main>
      }
    >
      <TokensResult />
    </Suspense>
  );
}
