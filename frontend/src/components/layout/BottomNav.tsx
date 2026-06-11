"use client";

const tabs = [
  {
    id: "design",
    label: "Design",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
      </svg>
    ),
  },
  {
    id: "gallery",
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
    label: "My Items",
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

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-surface-container-lowest border-t border-outline-variant/30 px-2 py-2 z-20">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition-colors ${
              activeTab === tab.id
                ? "text-primary-container"
                : "text-outline hover:text-on-surface-variant"
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-semibold tracking-[0.05em]">
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
