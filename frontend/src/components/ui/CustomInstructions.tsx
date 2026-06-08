export function CustomInstructions() {
  return (
    <div className="relative">
      <textarea
        placeholder="E.g., Keep the existing sofa but change the wall colors to something warmer..."
        className="w-full h-24 p-4 pr-12 border border-outline-variant rounded-md text-sm text-on-surface placeholder-outline resize-none focus:outline-none focus:ring-1 focus:ring-primary-container focus:border-primary-container bg-surface-container-lowest"
      />
      <button
        aria-label="Voice input"
        className="absolute bottom-3 right-3 p-2 text-outline hover:text-on-surface transition-colors"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>
    </div>
  );
}
