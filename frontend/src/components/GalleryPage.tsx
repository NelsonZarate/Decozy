"use client";

import { useState } from "react";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import galleryData from "@/data/gallery-mock.json";

const filters = ["All Projects", "Living Room", "Bedroom", "Scandinavian", "Industrial"];

export function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState("All Projects");
  const [search, setSearch] = useState("");

  const projects = galleryData.projects.filter((p) => {
    if (activeFilter !== "All Projects") {
      if (p.room !== activeFilter && p.style !== activeFilter) return false;
    }
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="flex-1 px-4 pb-24">
      {/* Title */}
      <section className="mb-4 mt-2">
        <h2 className="font-serif text-2xl font-medium text-on-surface">My Gallery</h2>
        <p className="text-xs text-on-surface-variant mt-1">
          A curated collection of your design explorations and finalized spaces.
        </p>
      </section>

      {/* Search */}
      <div className="relative mb-3">
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

      {/* Filter button */}
      <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-outline-variant rounded-lg text-sm font-medium text-on-surface mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
        </svg>
        Filter
      </button>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === f
                ? "bg-primary-container text-on-primary"
                : "bg-surface-container-high text-on-surface-variant"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Project cards */}
      <div className="flex flex-col gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/20">
            <BeforeAfterSlider
              beforeImage={project.beforeImage}
              afterImage={project.afterImage}
              status={project.status}
            />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base text-on-surface">{project.title}</h3>
                <button className="text-outline p-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">{project.room} • {project.style}</p>
              <div className="flex gap-2 mt-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border border-outline-variant text-on-surface-variant">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
