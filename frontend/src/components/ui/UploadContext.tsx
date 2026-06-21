"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { assetUrl, getProject, uploadImage } from "@/lib/api";
import { useProjects } from "@/components/projects/ProjectsContext";

/** Resolve after `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Poll a project until its generation completes (or fails / times out). */
async function pollUntilDone(projectId: number) {
  const MAX_ATTEMPTS = 60; // ~3 minutes at 3s intervals
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const project = await getProject(projectId);
    if (project.generation_status === "completed") return project;
    if (project.generation_status === "failed") {
      throw new Error(project.generation_error ?? "Generation failed.");
    }
    await sleep(3000);
  }
  throw new Error("Generation timed out.");
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

    const tempId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `job-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Independent URL for the job thumbnail so clearing the upload area
    // (which revokes the upload URL) does not break the thumbnail.
    const thumbnailUrl = URL.createObjectURL(blob);
    jobUrlsRef.current.set(tempId, [thumbnailUrl]);

    // Capture inputs before resetting the form.
    const styleAtStart = selectedStyle;
    const instructionsAtStart = instructions;

    const job: GenerationJob = {
      id: tempId,
      thumbnailUrl,
      resultUrl: null,
      style: styleAtStart,
      instructions: instructionsAtStart,
      status: "processing",
    };

    setJobs((prev) => [job, ...prev]);

    // Build the prompt the backend's "prompt architect" will consume by
    // combining the selected style with the free-form instructions.
    const promptParts = [
      styleAtStart && styleAtStart !== "Keep Current" ? `Style: ${styleAtStart}.` : null,
      instructionsAtStart.trim() || null,
    ].filter(Boolean);
    const userPrompt = promptParts.join(" ") || "Redesign this room.";

    // Free the upload area + form for the next project.
    clearImage();
    setSelectedStyle(null);
    setInstructions("");

    // Track the job's current id (it is renamed to the backend project id
    // once the upload is accepted) so error handling targets the right entry.
    let currentId = tempId;

    (async () => {
      try {
        const { project_id } = await uploadImage(blob, userPrompt);
        const realId = `p${project_id}`;

        // Rename the job to the backend project id so the tray link and the
        // gallery entry share the same id (used by ?project=<id>).
        const urls = jobUrlsRef.current.get(tempId);
        if (urls) {
          jobUrlsRef.current.delete(tempId);
          jobUrlsRef.current.set(realId, urls);
        }
        setJobs((prev) => prev.map((j) => (j.id === tempId ? { ...j, id: realId } : j)));
        currentId = realId;

        const project = await pollUntilDone(project_id);
        const generated = project.images.find((img) => img.type === "generated");
        const original = project.images.find((img) => img.type === "original");
        const after = generated ?? original;
        const before = original ?? generated;

        const resultUrl = after ? assetUrl(after.url) : thumbnailUrl;
        jobUrlsRef.current.get(realId)?.push(resultUrl);

        setJobs((prev) =>
          prev.map((j) => (j.id === realId ? { ...j, status: "done", resultUrl } : j)),
        );

        // Register the finished design so it shows up in the Gallery tab.
        addProject({
          id: realId,
          title:
            project.title ||
            (styleAtStart ? `${styleAtStart} Redesign` : "Custom Redesign"),
          room: "My Space",
          style: styleAtStart ?? "Custom",
          tags: [styleAtStart ?? "Generated", "AI Design"],
          beforeImage: before ? assetUrl(before.url) : thumbnailUrl,
          afterImage: resultUrl,
          status: "final_render",
          createdAt: new Date().toISOString(),
        });
      } catch {
        setJobs((prev) =>
          prev.map((j) => (j.id === currentId ? { ...j, status: "error" } : j)),
        );
      }
    })();
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
