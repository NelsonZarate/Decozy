import type { Metadata } from "next";
import { SignUpPage } from "@/components/auth/SignUpPage";

export const metadata: Metadata = {
  title: "Sign Up - Decozy",
  description: "Create your Decozy account to start designing.",
};

export default function Page() {
  return <SignUpPage />;
}
