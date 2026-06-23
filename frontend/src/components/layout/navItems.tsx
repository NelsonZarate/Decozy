import type { ReactNode } from "react";

export interface NavTab {
  id: string;
  href: string;
  label: string;
  icon: ReactNode;
}

export const navTabs: NavTab[] = [
  {
    id: "design",
    href: "/design",
    label: "Design",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
      </svg>
    ),
  },
  {
    id: "gallery",
    href: "/gallery",
    label: "Gallery",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "my-items",
    href: "/my-items",
    label: "Favorites",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 10V7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v3" />
        <rect x="1" y="10" width="4" height="7" rx="1.5" />
        <rect x="19" y="10" width="4" height="7" rx="1.5" />
        <path d="M5 12h14v5H5z" />
        <path d="M5 17h14v2H5z" />
        <path d="M6 19v2M18 19v2" />
      </svg>
    ),
  },
];

export function isTabActive(href: string, pathname: string): boolean {
  return pathname.startsWith(href);
}
