"use client";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="relative flex items-center justify-between px-4 py-4 sticky top-0 bg-surface z-10">
      <button aria-label="Menu" className="p-1" onClick={onMenuClick}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-on-surface"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <h1 className="absolute left-1/2 -translate-x-1/2 font-serif text-[28px] tracking-[0.3em] font-medium text-primary-container uppercase pointer-events-none">
        DECOZY
      </h1>

      <span className="w-[26px]" aria-hidden />
    </header>
  );
}
