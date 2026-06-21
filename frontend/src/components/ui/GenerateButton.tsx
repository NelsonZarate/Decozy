"use client";

import { useUpload } from "@/components/ui/UploadContext";

export function GenerateButton() {
  const { canGenerate, startGeneration } = useUpload();

  return (
    <button
      type="button"
      onClick={startGeneration}
      disabled={!canGenerate}
      className="w-full py-3 bg-primary-container text-on-primary rounded-md font-semibold text-sm tracking-[0.05em] flex flex-col items-center justify-center gap-1 hover:bg-primary active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 lg:py-3.5 lg:text-base lg:rounded-lg"
    >
      <span className="flex items-center justify-center gap-2">
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
      </span>
      <span className="text-[10px] font-normal tracking-normal opacity-70">
        This will use 1 credit
      </span>
    </button>
  );
}
