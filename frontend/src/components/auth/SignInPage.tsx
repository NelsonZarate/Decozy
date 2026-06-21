"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { ApiError, loginLocal } from "@/lib/api";

export function SignInPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (!emailValid || !passwordValid) return;
    setLoading(true);
    try {
      const res = await loginLocal(email, password);
      signIn({ name: email.split("@")[0], email }, res.access_token);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 400
          ? "Invalid email or password."
          : "Could not sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSignIn() {
    signIn({ name: "Google User", email: "user@gmail.com" });
    router.push("/");
  }

  const inputClass = "w-full px-4 py-3 border-2 border-outline-variant/40 rounded-xl text-sm bg-surface-container-lowest placeholder-outline focus:outline-none focus:border-primary-container transition-colors";

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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              required
              className={inputClass}
            />
            {focused === "email" && (
              <p className={`text-[11px] mt-1.5 ml-1 ${submitted && !emailValid ? "text-error" : "text-outline"}`}>
                Enter a valid email address
              </p>
            )}
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              required
              className={inputClass}
            />
            {focused === "password" && (
              <p className={`text-[11px] mt-1.5 ml-1 ${submitted && !passwordValid ? "text-error" : "text-outline"}`}>
                1 uppercase, 1 lowercase, 1 number
              </p>
            )}
          </div>
          {error && (
            <p className="text-[11px] text-error text-center -mt-1">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm text-surface bg-primary-container hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-outline-variant/50" />
          <span className="text-xs text-outline">or</span>
          <div className="flex-1 h-px bg-outline-variant/50" />
        </div>

        <GoogleSignInButton label="Sign in with Google" onClick={handleGoogleSignIn} />

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-primary-container hover:text-primary transition-colors"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  );
}
