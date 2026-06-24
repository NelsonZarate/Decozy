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
import { getStylePrompt } from "@/lib/designStyles";
import { useProjects } from "@/components/projects/ProjectsContext";
import { useCredits } from "@/components/credits/CreditsContext";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  id: string;
  thumbnailUrl: string;
  resultUrl: string | null;
  style: string | null;
  instructions: string;
  status: JobStatus;
}

interface UploadContextValue {
  imageUrl: string | null;
  setImage: (blob: Blob) => void;
  clearImage: () => void;

  selectedStyle: string | null;
  setSelectedStyle: (style: string | null) => void;

  instructions: string;
  setInstructions: (value: string) => void;

  canGenerate: boolean;
  startGeneration: () => void;

  jobs: GenerationJob[];
  dismissJob: (id: string) => void;
}

const UploadContext = createContext<UploadContextValue | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const { addProject } = useProjects();
  const { adjustBalance, refreshBalance } = useCredits();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [jobs, setJobs] = useState<GenerationJob[]>([]);

  // Refs track the live blob and object URLs so they can be revoked later.
  const blobRef = useRef<Blob | null>(null);
  const uploadUrlRef = useRef<string | null>(null);
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

    // Independent thumbnail URL so clearing the upload area doesn't break it.
    const thumbnailUrl = URL.createObjectURL(blob);
    jobUrlsRef.current.set(tempId, [thumbnailUrl]);

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

    // A generation costs 1 credit. Drop the badge instantly (no reload); the
    // real balance is reconciled with the backend once the upload completes.
    adjustBalance(-1);

    // The user's free-form instructions come first, then the hidden English
    // phrase tied to the chosen style is appended behind it. The user never
    // sees this style phrase — it only travels to the backend.
    const stylePrompt = getStylePrompt(styleAtStart);
    const promptParts = [
      instructionsAtStart.trim() || null,
      stylePrompt,
    ].filter(Boolean);
    const userPrompt = promptParts.join(" ") || "Redesign this room.";

    // Free the upload area + form for the next project.
    clearImage();
    setSelectedStyle(null);
    setInstructions("");

    // The job is renamed to the backend project id; track the current id for errors.
    let currentId = tempId;

    (async () => {
      try {
        const { project_id } = await uploadImage(blob, userPrompt);
        const realId = `p${project_id}`;

        // Reconcile the optimistic credit decrement with the backend's truth.
        refreshBalance();

        // Rename the job to the backend id so the tray link and gallery entry match.
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
        // The credit may not have been spent if the upload failed — resync.
        refreshBalance();
      }
    })();
  }, [selectedStyle, instructions, clearImage, addProject, adjustBalance, refreshBalance]);

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
        canGenerate:
          imageUrl !== null &&
          selectedStyle !== null &&
          instructions.trim().length > 0,
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
