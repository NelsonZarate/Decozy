"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="font-serif text-3xl font-medium text-primary-container mb-3">
        Something went wrong
      </h1>
      <p className="text-sm text-on-surface-variant mb-6">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-primary-container text-on-primary rounded-md text-sm font-semibold tracking-[0.05em] hover:bg-primary transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
