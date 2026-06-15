import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInPage } from "@/components/auth/SignInPage";

export const metadata: Metadata = {
  title: "Sign In - Decozy",
  description: "Sign in to your Decozy account.",
};

export default function Page() {
  return (
    <Suspense>
      <SignInPage />
    </Suspense>
  );
}
