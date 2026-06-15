import type { Metadata } from "next";
import { Manrope, EB_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Decozy - AI-Powered Interior Design",
  description:
    "Transform your living spaces with AI-powered interior design. Upload a photo, choose a style, and get professional-grade redesigns instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${ebGaramond.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-surface font-body antialiased text-on-surface">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
