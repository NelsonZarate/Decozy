"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { ApiError, registerLocal } from "@/lib/api";

export function SignUpPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nameValid = name.length >= 2;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordHasUpper = /[A-Z]/.test(password);
  const passwordHasLower = /[a-z]/.test(password);
  const passwordHasNumber = /[0-9]/.test(password);
  const passwordValid = passwordHasUpper && passwordHasLower && passwordHasNumber;
  const passwordsMatch = password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (!nameValid || !emailValid || !passwordValid || !passwordsMatch) return;
    setLoading(true);
    try {
      const res = await registerLocal(email, password);
      signIn({ name, email }, res.access_token);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 400
          ? "This email is already registered."
          : "Could not create your account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSignUp() {
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
          Create your account to start designing.
        </p>
      </header>

      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
              required
              className={inputClass}
            />
            {focused === "name" && (
              <p className={`text-[11px] mt-1.5 ml-1 ${submitted && !nameValid ? "text-error" : "text-outline"}`}>
                Minimum 2 characters
              </p>
            )}
          </div>
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
          <div>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocused("confirm")}
              onBlur={() => setFocused(null)}
              required
              className={inputClass}
            />
            {focused === "confirm" && confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-[11px] mt-1.5 ml-1 text-error">
                Passwords do not match
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
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-outline-variant/50" />
          <span className="text-xs text-outline">or</span>
          <div className="flex-1 h-px bg-outline-variant/50" />
        </div>

        <GoogleSignInButton label="Sign up with Google" onClick={handleGoogleSignUp} />

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-semibold text-primary-container hover:text-primary transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
