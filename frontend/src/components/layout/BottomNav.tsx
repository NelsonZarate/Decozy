"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navTabs, isTabActive } from "@/components/layout/navItems";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-surface-container-lowest border-t border-outline-variant/30 px-2 py-2 z-20 lg:hidden">
      <div className="flex items-center justify-around">
        {navTabs.map((tab) => {
          const isActive = isTabActive(tab.href, pathname);

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition-colors ${
                isActive
                  ? "text-primary-container"
                  : "text-outline hover:text-on-surface-variant"
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-semibold tracking-[0.05em]">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
