import Link from "next/link";
import { HeroSection } from "@/components/landing/HeroSection";

export default function LandingPage() {
  return (
    <main className="relative">
      <nav className="fixed top-0 right-0 z-50 p-4">
        <Link
          href="/signin"
          className="px-5 py-2 rounded-full bg-primary-container text-on-primary-container text-sm font-medium shadow-lg hover:opacity-90 transition-opacity"
        >
          Login
        </Link>
      </nav>
      <HeroSection />
    </main>
  );
}
