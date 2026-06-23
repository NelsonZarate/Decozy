"use client";

import { createContext, useCallback, useContext, useState } from "react";
import {
  assetUrl,
  getProject,
  getProjectItems,
  listProjects,
  type ProjectItem,
} from "@/lib/api";
import type { FavoriteItem } from "@/components/favorites/FavoritesContext";

export interface GalleryProject {
  id: string;
  title: string;
  room: string;
  style: string;
  tags: string[];
  beforeImage: string;
  afterImage: string;
  status: string;
  createdAt: string;
  furniture?: FavoriteItem[];
}

interface ProjectsContextValue {
  projects: GalleryProject[];
  addProject: (project: GalleryProject) => void;
  updateProjectTitle: (id: string, title: string) => void;
  loadProjects: () => Promise<void>;
  loading: boolean;
}

const ProjectsContext = createContext<ProjectsContextValue | undefined>(undefined);

function toFavoriteItem(item: ProjectItem): FavoriteItem {
  return {
    id: String(item.id),
    name: item.name,
    category: item.category ?? "Decor",
    price: item.price ?? "",
    image: assetUrl(item.image_url),
  };
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [loading, setLoading] = useState(false);

  const addProject = useCallback((project: GalleryProject) => {
    setProjects((prev) => [project, ...prev.filter((p) => p.id !== project.id)]);
  }, []);

  const updateProjectTitle = useCallback((id: string, title: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, title } : p)),
    );
  }, []);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const summaries = await listProjects();
      const detailed = await Promise.all(
        summaries
          // The catalog project only satisfies the items FK; skip it in the gallery.
          .filter((summary) => summary.title !== "__catalog_demo__")
          .map(async (summary) => {
            const details = await getProject(summary.id);
            let items: ProjectItem[] = [];
            try {
              items = await getProjectItems(summary.id);
            } catch {
              // Items are optional; ignore failures.
            }

            const generated = details.images.find((img) => img.type === "generated");
            const original = details.images.find((img) => img.type === "original");
            const after = generated ?? original;
            const before = original ?? generated;

            const project: GalleryProject = {
              id: `p${details.id}`,
              title: details.title || "Untitled Project",
              room: "My Space",
              style: "Custom",
              tags: ["AI Design"],
              beforeImage: before ? assetUrl(before.url) : "",
              afterImage: after ? assetUrl(after.url) : "",
              status:
                details.generation_status === "completed"
                  ? "final_render"
                  : details.generation_status,
              createdAt:
                typeof details.created_at === "string"
                  ? details.created_at
                  : new Date().toISOString(),
              furniture: items.map(toFavoriteItem),
            };
            return project;
          }),
      );
      // Drop projects with no usable images (they would render empty <img>).
      setProjects(detailed.filter((p) => p.beforeImage !== "" && p.afterImage !== ""));
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ProjectsContext.Provider value={{ projects, addProject, updateProjectTitle, loadProjects, loading }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects(): ProjectsContextValue {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }
  return context;
}
