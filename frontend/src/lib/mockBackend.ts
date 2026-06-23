// Mock backend for the "Generate Design" flow. While SIMULATION_MODE is true,
// generation is faked locally; flip it to false to wire up the real backend.

export interface GenerateDesignInput {
  image: Blob;
  style: string | null;
  instructions: string;
}

export interface GenerateDesignResult {
  resultBlob: Blob;
}

export const SIMULATION_MODE = true;

const MIN_DELAY_MS = 3500;
const MAX_DELAY_MS = 6500;

export function generateDesign(
  input: GenerateDesignInput,
): Promise<GenerateDesignResult> {
  if (SIMULATION_MODE) {
    return new Promise((resolve) => {
      const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
      // Mock echoes the uploaded photo back; the real backend returns the redesign.
      setTimeout(() => resolve({ resultBlob: input.image }), delay);
    });
  }

  return Promise.reject(
    new Error("Real backend is not implemented yet. Set SIMULATION_MODE = true."),
  );
}
