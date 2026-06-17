export function GenerateButton() {
  return (
    <button className="w-full py-3.5 bg-primary-container text-on-primary rounded-md font-semibold text-sm tracking-[0.05em] flex items-center justify-center gap-2 hover:bg-primary active:scale-[0.98] transition-all">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
      </svg>
      Generate Design
    </button>
  );
}
