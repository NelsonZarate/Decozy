"use client";

import { createContext, useCallback, useContext, useState } from "react";

export interface GalleryProject {
  id: string;
  title: string;
  room: string;
  style: string;
  tags: string[];
  /** Image URL (remote, object URL or data URL). */
  beforeImage: string;
  afterImage: string;
  /** "before_after" | "final_render" | ... */
  status: string;
  createdAt: string;
}

interface ProjectsContextValue {
  /** User-generated projects, newest first. */
  projects: GalleryProject[];
  /** Add (or replace by id) a generated project. */
  addProject: (project: GalleryProject) => void;
}

const ProjectsContext = createContext<ProjectsContextValue | undefined>(undefined);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<GalleryProject[]>([]);

  const addProject = useCallback((project: GalleryProject) => {
    setProjects((prev) => [project, ...prev.filter((p) => p.id !== project.id)]);
  }, []);

  return (
    <ProjectsContext.Provider value={{ projects, addProject }}>
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
