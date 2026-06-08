export function UploadArea() {
  return (
    <div className="border-2 border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center py-16 px-8 bg-surface-container-low cursor-pointer hover:border-secondary transition-colors">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-on-surface-variant mb-3"
      >
        <rect x="6" y="10" width="36" height="28" rx="3" />
        <circle cx="18" cy="22" r="4" />
        <path d="M42 32l-10-10-16 16" />
        <circle cx="36" cy="14" r="3" fill="currentColor" opacity="0.3" />
        <line x1="35" y1="11" x2="37" y2="11" strokeWidth="2" />
        <line x1="36" y1="10" x2="36" y2="12" strokeWidth="2" />
      </svg>
      <span className="text-sm font-medium text-on-surface-variant">
        Tap to Camera or Gallery
      </span>
    </div>
  );
}
