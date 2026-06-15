"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export function SignUpPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  function handleGoogleSignUp() {
    // No backend OAuth configured yet — create a local Google session.
    signIn({ name: "Google User", email: "user@gmail.com" });
    router.push("/");
  }

  return (
    <main className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-surface px-6 justify-center">
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-sm p-6">
        <header className="text-center mb-8">
          <h1 className="font-serif text-[40px] tracking-[0.3em] font-medium text-primary-container uppercase">
            Decozy
          </h1>
          <p className="text-lg text-on-surface-variant mt-2">
            Create your account to start designing.
          </p>
        </header>

        <GoogleSignInButton
          label="Continue with Google"
          onClick={handleGoogleSignUp}
        />

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-semibold text-primary-container hover:text-primary transition-colors"
          >
            Log in here
          </Link>
        </p>
      </div>
    </main>
  );
}
