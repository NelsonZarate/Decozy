"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navTabs, isTabActive } from "@/components/layout/navItems";

/**
 * Desktop-only inline navigation rendered inside the Header.
 * Hidden on mobile (the BottomNav handles navigation there).
 */
export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex items-center gap-1 ml-auto">
      {navTabs.map((tab) => {
        const isActive = isTabActive(tab.href, pathname);

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold tracking-[0.03em] transition-colors [&_svg]:w-[18px] [&_svg]:h-[18px] ${
              isActive
                ? "bg-secondary-container text-on-surface"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {tab.icon}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
