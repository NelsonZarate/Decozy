// Mock backend for the "Generate Design" flow.
//
// While SIMULATION_MODE is `true`, generation is faked locally: it waits for a
// random delay (as if the backend were processing the image) and then resolves
// returning an image. When the real backend is ready, flip SIMULATION_MODE to
// `false` and implement the fetch() call in the `else` branch — the rest of the
// UI (loading spinner, processing tray, etc.) keeps working unchanged.

export interface GenerateDesignInput {
  /** The original room photo uploaded/captured by the user. */
  image: Blob;
  /** The selected style name, or null when "Keep Current"/none is chosen. */
  style: string | null;
  /** Free-form custom instructions typed by the user. */
  instructions: string;
}

export interface GenerateDesignResult {
  /** The redesigned image returned by the backend. */
  resultBlob: Blob;
}

/**
 * Toggle the whole app between simulated and real generation.
 * Set to `false` once the backend endpoint is available.
 */
export const SIMULATION_MODE = true;

/** Simulated backend latency bounds (milliseconds). */
const MIN_DELAY_MS = 3500;
const MAX_DELAY_MS = 6500;

/**
 * Sends a design generation request. In simulation mode it resolves with the
 * original image after a fake processing delay; otherwise it would call the
 * real backend.
 */
export function generateDesign(
  input: GenerateDesignInput,
): Promise<GenerateDesignResult> {
  if (SIMULATION_MODE) {
    return new Promise((resolve) => {
      const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
      // In a real backend the result would be the *redesigned* image. For the
      // mock we just echo the uploaded photo back so the flow is demonstrable.
      setTimeout(() => resolve({ resultBlob: input.image }), delay);
    });
  }

  // --- Real backend integration (to implement) ---------------------------
  // const form = new FormData();
  // form.append("image", input.image);
  // form.append("style", input.style ?? "");
  // form.append("instructions", input.instructions);
  // return fetch("/api/generate", { method: "POST", body: form })
  //   .then((res) => {
  //     if (!res.ok) throw new Error(`Generation failed: ${res.status}`);
  //     return res.blob();
  //   })
  //   .then((resultBlob) => ({ resultBlob }));
  // -----------------------------------------------------------------------

  return Promise.reject(
    new Error("Real backend is not implemented yet. Set SIMULATION_MODE = true."),
  );
}
