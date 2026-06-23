"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export function HeroSection() {
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const desktopVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videos = [mobileVideoRef.current, desktopVideoRef.current];

    videos.forEach((video) => {
      if (!video) return;

      video.playbackRate = 0.5;
      video.play().catch(() => {});
    });
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Mobile */}
      <div className="absolute inset-0 lg:hidden">
        <video
          ref={mobileVideoRef}
          src="/landing/hero.mp4"
          muted
          playsInline
          autoPlay
          loop
          preload="auto"
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/30" />

        <div className="absolute bottom-12 inset-x-0 text-center px-6">
          <h1 className="font-serif text-3xl text-on-primary leading-tight drop-shadow-lg">
            Não sabe como irá ficar a sua decoração?
          </h1>

          <p className="mt-3 text-base text-on-primary/80 drop-shadow">
            Experimente <span className="font-semibold">Decozy</span>
          </p>

          <div className="mt-6">
            <Link
              href="/design"
              className="inline-block px-7 py-3 rounded-full bg-primary-container text-on-primary-container font-semibold shadow-xl hover:scale-105 transition-transform"
            >
              Cria os teus designs
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex items-center justify-between min-h-screen w-full max-w-7xl mx-auto px-16 gap-16">
        <div className="flex-1">
          <h1 className="font-serif text-5xl xl:text-6xl text-primary-container leading-tight">
            Não sabe como irá ficar a sua decoração?
          </h1>

          <p className="mt-4 text-xl text-on-surface-variant">
            Experimente{" "}
            <span className="font-semibold text-primary-container">
              Decozy
            </span>
          </p>

          <div className="mt-8">
            <Link
              href="/design"
              className="inline-block px-8 py-4 rounded-full bg-primary-container text-on-primary-container font-semibold text-lg shadow-xl hover:scale-105 transition-transform"
            >
              Cria os teus designs
            </Link>
          </div>
        </div>

        <div className="flex-shrink-0 w-[360px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl">
          <video
            ref={desktopVideoRef}
            src="/landing/hero.mp4"
            muted
            playsInline
            autoPlay
            loop
            preload="auto"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}