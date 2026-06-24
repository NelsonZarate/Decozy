"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useUpload } from "@/components/ui/UploadContext";
import { designStyles as styles } from "@/lib/designStyles";

export function StyleSelector() {
  const { imageUrl, selectedStyle, setSelectedStyle } = useUpload();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Defer the first measurement so it doesn't run synchronously in the effect.
    const raf = requestAnimationFrame(updateArrows);
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  function scrollByDir(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.8, 200);
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Scroll styles left"
        onClick={() => scrollByDir("left")}
        className={`absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full h-10 w-10 bg-surface-container-lowest text-on-surface shadow-md border border-outline-variant/40 transition-opacity hover:bg-surface-container active:scale-95 lg:flex ${
          canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Scroll styles right"
        onClick={() => scrollByDir("right")}
        className={`absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full h-10 w-10 bg-surface-container-lowest text-on-surface shadow-md border border-outline-variant/40 transition-opacity hover:bg-surface-container active:scale-95 lg:flex ${
          canScrollRight ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto py-2.5 -mx-2 px-2 scrollbar-hide lg:gap-4"
      >
        {styles.map((style) => {
          // The "Keep Current" card mirrors the uploaded/captured image.
          const isKeepCurrent = style.name === "Keep Current";
          const effectiveImage = isKeepCurrent ? imageUrl : style.image;

          return (
          <button
            key={style.name}
            onClick={() => setSelectedStyle(style.name)}
            className={`relative flex-shrink-0 w-[150px] h-[150px] rounded-lg overflow-hidden transition-all lg:w-[184px] lg:h-[184px] ${
              selectedStyle === style.name
                ? "ring-2 ring-secondary ring-offset-2 ring-offset-surface scale-105"
                : ""
            }`}
          >
            {effectiveImage ? (
              <Image
                src={effectiveImage}
                alt={style.name}
                fill
                sizes="150px"
                unoptimized={isKeepCurrent}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-on-surface-variant">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-2 left-2 text-white text-[10px] font-semibold tracking-[0.03em] lg:text-xs lg:bottom-2.5 lg:left-2.5">
              {style.name}
            </span>
          </button>
          );
        })}
      </div>
    </div>
  );
}
