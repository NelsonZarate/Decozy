"use client";

import { useEffect, useRef, useState } from "react";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { useProjects } from "@/components/projects/ProjectsContext";
import { useFavorites, type FavoriteItem } from "@/components/favorites/FavoritesContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { changeProjectTitle } from "@/lib/api";

const MAX_TITLE_LENGTH = 24;

function isEditableProject(id: string): boolean {
  return /^p\d+$/.test(id);
}

function truncateTitle(name: string): string {
  if (name.length <= MAX_TITLE_LENGTH) return name;
  let result = "";
  for (const word of name.split(" ")) {
    const candidate = result ? `${result} ${word}` : word;
    if (candidate.length > MAX_TITLE_LENGTH) break;
    result = candidate;
  }
  return result || name.slice(0, MAX_TITLE_LENGTH);
}

function getFurniture(project: { furniture?: FavoriteItem[] }): FavoriteItem[] {
  return project.furniture ?? [];
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function GalleryPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { projects: generatedProjects, loadProjects, updateProjectTitle } = useProjects();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated, isReady } = useAuth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);

  function startEditTitle(project: { id: string; title: string }) {
    setEditingId(project.id);
    setDraftTitle(project.title.slice(0, MAX_TITLE_LENGTH));
  }

  function cancelEditTitle() {
    setEditingId(null);
    setDraftTitle("");
  }

  async function saveTitle(project: { id: string }) {
    const title = draftTitle.trim().slice(0, MAX_TITLE_LENGTH);
    if (!title) return;
    const numericId = Number(project.id.replace(/^p/, ""));
    setSavingTitle(true);
    try {
      await changeProjectTitle(numericId, title);
      updateProjectTitle(project.id, title);
      setEditingId(null);
      setDraftTitle("");
    } catch (err) {
      console.error("[projects] rename failed:", err);
    } finally {
      setSavingTitle(false);
    }
  }

  // Pull the user's real projects from the backend once authenticated.
  useEffect(() => {
    if (isReady && isAuthenticated) {
      loadProjects().catch(() => {
        // Network/auth failures fall back to whatever is already loaded.
      });
    }
  }, [isReady, isAuthenticated, loadProjects]);

  const allProjects = generatedProjects;

  // Highlight + scroll to a specific project when arriving via ?project=<id>.
  const [highlightId, setHighlightId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("project");
  });
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    if (!highlightId) return;
    const el = cardRefs.current.get(highlightId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const timeout = setTimeout(() => setHighlightId(null), 2600);
    return () => clearTimeout(timeout);
  }, [highlightId, generatedProjects.length]);

  const projects = allProjects.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="flex-1 px-4 pb-24 lg:max-w-6xl lg:mx-auto lg:w-full lg:px-8 lg:pt-4 lg:pb-12">
      <section className="mb-4 mt-2 lg:mt-2 lg:mb-6">
        <h2 className="font-serif text-2xl font-medium text-on-surface lg:text-3xl">My Gallery</h2>
        <p className="text-xs text-on-surface-variant mt-1 lg:text-sm lg:mt-1.5">
          A curated collection of your design explorations and finalized spaces.
        </p>
      </section>

      <div className="lg:max-w-2xl">
        <div className="relative mb-4 lg:mb-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-outline-variant rounded-lg text-sm bg-surface-container-lowest placeholder-outline focus:outline-none focus:ring-1 focus:ring-primary-container"
          />
        </div>
      </div>

      <div className="mb-4 lg:mt-4" />

      {isReady && isAuthenticated && allProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 lg:py-28">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-outline mb-3">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-sm font-medium text-on-surface lg:text-base">No projects yet</p>
          <p className="text-xs text-on-surface-variant mt-1 lg:text-sm">
            Generate your first design to start building your gallery.
          </p>
        </div>
      ) : (
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            ref={(el) => {
              cardRefs.current.set(project.id, el);
            }}
            className={`bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border transition-all duration-500 ${
              highlightId === project.id
                ? "border-secondary ring-2 ring-secondary"
                : "border-outline-variant/20"
            }`}
          >
            <BeforeAfterSlider
              beforeImage={project.beforeImage}
              afterImage={project.afterImage}
            />
            <div className="p-4 lg:p-5">
              <div className="flex items-center justify-between gap-2">
                {editingId === project.id ? (
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <input
                      type="text"
                      value={draftTitle}
                      maxLength={MAX_TITLE_LENGTH}
                      autoFocus
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveTitle(project);
                        if (e.key === "Escape") cancelEditTitle();
                      }}
                      className="min-w-0 flex-1 rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 text-base font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container lg:text-lg"
                    />
                    <button
                      type="button"
                      onClick={() => saveTitle(project)}
                      disabled={savingTitle}
                      aria-label="Save project name"
                      className="flex-shrink-0 p-1 text-secondary hover:opacity-70 disabled:opacity-40 transition-opacity"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-semibold text-base text-on-surface truncate lg:text-lg">
                      {truncateTitle(project.title)}
                    </h3>
                    {isEditableProject(project.id) && (
                      <button
                        type="button"
                        onClick={() => startEditTitle(project)}
                        aria-label="Edit project name"
                        className="flex-shrink-0 p-1 text-outline hover:text-on-surface transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(expandedId === project.id ? null : project.id)
                  }
                  aria-expanded={expandedId === project.id}
                  aria-label={
                    expandedId === project.id
                      ? "Hide furniture in this design"
                      : "Show furniture in this design"
                  }
                  className="text-outline p-1 hover:text-on-surface transition-colors"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-300 ${
                      expandedId === project.id ? "rotate-180" : ""
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">{formatDate(project.createdAt)}</p>

              {expandedId === project.id && (
                <div className="mt-4 border-t border-outline-variant/20 pt-3 flex flex-col gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    Furniture in this design
                  </p>
                  {getFurniture(project).length === 0 && (
                    <p className="text-xs text-on-surface-variant">
                      No furniture detected for this design yet.
                    </p>
                  )}
                  {getFurniture(project).map((item) => {
                    const fav = isFavorite(item.id);
                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-[#f0efed]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-on-surface truncate">{item.name}</p>
                          <p className="text-xs text-on-surface-variant">
                            {item.category} • {item.price}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(item)}
                          aria-pressed={fav}
                          aria-label={
                            fav
                              ? `Remove ${item.name} from favorites`
                              : `Add ${item.name} to favorites`
                          }
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill={fav ? "#e23b3b" : "none"}
                            stroke={fav ? "#e23b3b" : "currentColor"}
                            strokeWidth="1.5"
                            className={fav ? "" : "text-outline"}
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </main>
  );
}
