"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { generateDesign } from "@/lib/mockBackend";
import { useProjects } from "@/components/projects/ProjectsContext";

/** Read a Blob as a self-contained data URL (survives provider unmount/reload). */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export type JobStatus = "processing" | "done" | "error";

export interface GenerationJob {
  /** Stable id for the job. */
  id: string;
  /** Object URL of the original photo, shown blurred while processing. */
  thumbnailUrl: string;
  /** Object URL of the backend result, shown once `status === "done"`. */
  resultUrl: string | null;
  /** Style selected when the job was started. */
  style: string | null;
  /** Custom instructions captured when the job was started. */
  instructions: string;
  /** Current lifecycle state of the job. */
  status: JobStatus;
}

interface UploadContextValue {
  /** Object URL of the photo currently sitting in the upload area, or null. */
  imageUrl: string | null;
  /** Replace the current image with a new blob/file, revoking the previous URL. */
  setImage: (blob: Blob) => void;
  /** Clear the photo from the upload area. */
  clearImage: () => void;

  /** Currently selected style name, or null. */
  selectedStyle: string | null;
  setSelectedStyle: (style: string | null) => void;

  /** Free-form custom instructions text. */
  instructions: string;
  setInstructions: (value: string) => void;

  /** Whether a generation can be started (a photo is present). */
  canGenerate: boolean;
  /**
   * Start a (simulated) generation for the current photo + style + instructions.
   * Creates a processing job, then clears the upload area so the user can
   * immediately start another photo while this one is being processed.
   */
  startGeneration: () => void;

  /** Jobs currently being processed or already completed. Newest first. */
  jobs: GenerationJob[];
  /** Remove a job from the tray, revoking its object URLs. */
  dismissJob: (id: string) => void;
}

const UploadContext = createContext<UploadContextValue | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const { addProject } = useProjects();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [jobs, setJobs] = useState<GenerationJob[]>([]);

  // Live blob backing the upload area (needed to spawn an independent
  // thumbnail URL for the job, since the upload-area URL gets revoked).
  const blobRef = useRef<Blob | null>(null);
  // URL backing the upload area, tracked for revocation.
  const uploadUrlRef = useRef<string | null>(null);
  // Per-job object URLs, tracked so we can revoke them on dismiss/unmount.
  const jobUrlsRef = useRef<Map<string, string[]>>(new Map());

  const setImage = useCallback((blob: Blob) => {
    if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current);
    const url = URL.createObjectURL(blob);
    uploadUrlRef.current = url;
    blobRef.current = blob;
    setImageUrl(url);
  }, []);

  const clearImage = useCallback(() => {
    if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current);
    uploadUrlRef.current = null;
    blobRef.current = null;
    setImageUrl(null);
  }, []);

  const dismissJob = useCallback((id: string) => {
    const urls = jobUrlsRef.current.get(id);
    if (urls) {
      urls.forEach((u) => URL.revokeObjectURL(u));
      jobUrlsRef.current.delete(id);
    }
    setJobs((prev) => prev.filter((job) => job.id !== id));
  }, []);

  const startGeneration = useCallback(() => {
    const blob = blobRef.current;
    if (!blob) return;

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `job-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Independent URL for the job thumbnail so clearing the upload area
    // (which revokes the upload URL) does not break the thumbnail.
    const thumbnailUrl = URL.createObjectURL(blob);
    jobUrlsRef.current.set(id, [thumbnailUrl]);

    const job: GenerationJob = {
      id,
      thumbnailUrl,
      resultUrl: null,
      style: selectedStyle,
      instructions,
      status: "processing",
    };

    setJobs((prev) => [job, ...prev]);

    // Capture inputs for the backend call before resetting the form.
    const input = { image: blob, style: selectedStyle, instructions };

    // Free the upload area + form for the next project.
    clearImage();
    setSelectedStyle(null);
    setInstructions("");

    generateDesign(input)
      .then(async ({ resultBlob }) => {
        const resultUrl = URL.createObjectURL(resultBlob);
        jobUrlsRef.current.get(id)?.push(resultUrl);
        setJobs((prev) =>
          prev.map((j) =>
            j.id === id ? { ...j, status: "done", resultUrl } : j,
          ),
        );

        // Register a gallery project so the finished design is viewable there.
        // Data URLs are used so the images survive this provider unmounting
        // when the user navigates to the Gallery tab.
        try {
          const beforeUrl = await blobToDataUrl(input.image);
          // Mock: before and after are the same image until the real backend
          // returns a redesigned render.
          const afterUrl = await blobToDataUrl(resultBlob);
          addProject({
            id,
            title: input.style ? `${input.style} Redesign` : "Custom Redesign",
            room: "My Space",
            style: input.style ?? "Custom",
            tags: [input.style ?? "Generated", "AI Design"],
            beforeImage: beforeUrl,
            afterImage: afterUrl,
            status: "final_render",
            createdAt: new Date().toISOString(),
          });
        } catch {
          // If conversion fails the tray result still works; skip gallery entry.
        }
      })
      .catch(() => {
        setJobs((prev) =>
          prev.map((j) => (j.id === id ? { ...j, status: "error" } : j)),
        );
      });
  }, [selectedStyle, instructions, clearImage, addProject]);

  // Revoke every outstanding object URL when the provider unmounts.
  useEffect(() => {
    const jobUrls = jobUrlsRef.current;
    return () => {
      if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current);
      jobUrls.forEach((urls) => urls.forEach((u) => URL.revokeObjectURL(u)));
      jobUrls.clear();
    };
  }, []);

  return (
    <UploadContext.Provider
      value={{
        imageUrl,
        setImage,
        clearImage,
        selectedStyle,
        setSelectedStyle,
        instructions,
        setInstructions,
        canGenerate: imageUrl !== null,
        startGeneration,
        jobs,
        dismissJob,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload(): UploadContextValue {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
