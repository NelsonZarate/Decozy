"use client";

import { useRouter } from "next/navigation";
import { useUpload } from "@/components/ui/UploadContext";

export function ProcessingTray() {
  const router = useRouter();
  const { jobs, dismissJob } = useUpload();

  if (jobs.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="text-xs font-medium leading-4 text-on-surface-variant mb-2">
        Generating designs
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {jobs.map((job) => {
          const showResult = job.status === "done" && job.resultUrl;
          const src = showResult ? job.resultUrl! : job.thumbnailUrl;

          return (
            <div
              key={job.id}
              onClick={
                job.status === "done"
                  ? () => router.push(`/gallery?project=${job.id}`)
                  : undefined
              }
              role={job.status === "done" ? "button" : undefined}
              tabIndex={job.status === "done" ? 0 : undefined}
              onKeyDown={
                job.status === "done"
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ")
                        router.push(`/gallery?project=${job.id}`);
                    }
                  : undefined
              }
              title={job.status === "done" ? "View in Gallery" : undefined}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-surface-container-high ${
                job.status === "done"
                  ? "cursor-pointer hover:ring-2 hover:ring-secondary"
                  : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={
                  job.status === "processing"
                    ? "Design being generated"
                    : "Generated design"
                }
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ${
                  job.status === "processing" ? "blur-[3px] scale-110" : ""
                }`}
              />

              {job.status === "processing" && (
                <>
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      role="status"
                      aria-label="Loading"
                      className="h-7 w-7 rounded-full border-2 border-white/30 border-t-white animate-spin"
                    />
                  </div>
                </>
              )}

              {job.status === "done" && (
                <>
                  <div className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-on-secondary">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    aria-label="Dismiss design"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissJob(job.id);
                    }}
                    className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <line x1="6" y1="6" x2="18" y2="18" />
                      <line x1="18" y1="6" x2="6" y2="18" />
                    </svg>
                  </button>
                </>
              )}

              {job.status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-error-container/90 px-1 text-center">
                  <span className="text-[10px] font-semibold leading-3 text-on-error-container">
                    Failed
                  </span>
                  <button
                    type="button"
                    onClick={() => dismissJob(job.id)}
                    className="text-[10px] font-semibold text-on-error-container underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
