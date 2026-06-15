"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  // When arriving from the header (?provider=google), start the Google
  // account flow immediately instead of waiting for another click.
  const autoGoogle = searchParams.get("provider") === "google";
  const [connecting, setConnecting] = useState(autoGoogle);

  function handleGoogleSignIn() {
    // No backend OAuth configured yet — this is where the real Google
    // account chooser/redirect would be initiated. We create a local session.
    signIn({ name: "Google User", email: "user@gmail.com" });
    router.push("/");
  }

  useEffect(() => {
    if (autoGoogle) {
      handleGoogleSignIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGoogle]);

  return (
    <main className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-surface px-6 justify-center">
      <header className="text-center mb-8">
        <h1 className="font-serif text-[40px] tracking-[0.3em] font-medium text-primary-container uppercase">
          Decozy
        </h1>
        <p className="text-lg text-on-surface-variant mt-2">
          Welcome back to your curated space.
        </p>
      </header>

      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-sm p-6">
        {connecting ? (
          <div className="flex flex-col items-center gap-3 py-2 text-on-surface-variant">
            <svg
              className="animate-spin text-primary-container"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span className="text-sm">A ligar à Google…</span>
          </div>
        ) : (
          <GoogleSignInButton
            label="Continuar com Google"
            onClick={handleGoogleSignIn}
          />
        )}

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-primary-container hover:text-primary transition-colors"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}
