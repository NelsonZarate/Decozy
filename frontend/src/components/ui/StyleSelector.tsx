"use client";

import { useState } from "react";

const styles = [
  {
    name: "Scandinavian",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop&q=80",
  },
  {
    name: "Industrial",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=300&h=300&fit=crop&q=80",
  },
  {
    name: "Minimalist",
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae5b4ace?w=300&h=300&fit=crop&q=80",
  },
  {
    name: "Mid-Century",
    image:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300&h=300&fit=crop&q=80",
  },
];

export function StyleSelector() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
      {styles.map((style) => (
        <button
          key={style.name}
          onClick={() => setSelectedStyle(style.name)}
          className={`relative flex-shrink-0 w-[120px] h-[120px] rounded-lg overflow-hidden ${
            selectedStyle === style.name
              ? "ring-2 ring-secondary ring-offset-2 ring-offset-surface"
              : ""
          }`}
        >
          <img
            src={style.image}
            alt={style.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="absolute bottom-2 left-2 text-white text-xs font-semibold tracking-[0.05em]">
            {style.name}
          </span>
        </button>
      ))}
    </div>
  );
}
