"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ImageComparisonSlider from "@/components/ui/image-comparison-slider-horizontal";

export interface GalleryPhoto {
  id: string;
  title: string;
  caption: string | null;
  imageUrl: string;
  category: string;
  label: string | null;
  isFeatured: boolean;
  displayOrder: number;
}

interface GalleryGridProps {
  photos: GalleryPhoto[];
}

interface ComparisonPair {
  before: GalleryPhoto;
  after: GalleryPhoto;
  title: string;
  caption: string | null;
}

function getLabelStyle(label: string | null): { cls: string; text: string } | null {
  if (!label) return null;
  const lower = label.toLowerCase();
  if (lower === "before")
    return { cls: "bg-zinc-800/95 text-zinc-300 border border-zinc-600", text: label };
  if (lower === "after")
    return { cls: "bg-accent/20 text-accent-light border border-accent/50 shadow-[0_0_10px_rgba(66,109,182,0.3)]", text: label };
  return { cls: "bg-black/70 text-white border border-white/10", text: label };
}

function buildGroups(photos: GalleryPhoto[]): { pairs: ComparisonPair[]; singles: GalleryPhoto[] } {
  const groups = new Map<string, GalleryPhoto[]>();

  for (const photo of photos) {
    const key = photo.title.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(photo);
  }

  const pairs: ComparisonPair[] = [];
  const singles: GalleryPhoto[] = [];

  for (const group of Array.from(groups.values())) {
    const before = group.find((p) => p.label?.toLowerCase() === "before");
    const after = group.find((p) => p.label?.toLowerCase() === "after");

    if (before && after) {
      pairs.push({
        before,
        after,
        title: before.title,
        caption: before.caption ?? after.caption,
      });
      for (const p of group) {
        if (p.id !== before.id && p.id !== after.id) singles.push(p);
      }
    } else {
      singles.push(...group);
    }
  }

  return { pairs, singles };
}

export default function GalleryGrid({ photos }: GalleryGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sorted = [...photos].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return 0;
  });

  const { pairs, singles } = buildGroups(sorted);

  const close = useCallback(() => setActiveIndex(null), []);
  const prev = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i - 1 + singles.length) % singles.length)),
    [singles.length]
  );
  const next = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i + 1) % singles.length)),
    [singles.length]
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, close, prev, next]);

  useEffect(() => {
    document.body.style.overflow = activeIndex !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activeIndex]);

  if (sorted.length === 0) {
    return (
      <div className="py-32 text-center">
        <p className="text-zinc-600 text-sm">No photos yet — check back soon.</p>
      </div>
    );
  }

  return (
    <>
      {/* Before & After comparison sliders */}
      {pairs.length > 0 && (
        <div className="mb-14">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.2em] mb-6">
            Before &amp; After
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pairs.map(({ before, after, title, caption }) => (
              <ImageComparisonSlider
                key={`${before.id}-${after.id}`}
                beforeSrc={before.imageUrl}
                afterSrc={after.imageUrl}
                title={title}
                caption={caption ?? undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Singles masonry */}
      {singles.length > 0 && (
        <>
          {pairs.length > 0 && (
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.2em] mb-6">
              Gallery
            </p>
          )}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
            {singles.map((photo, i) => {
              const label = getLabelStyle(photo.label);
              return (
                <div
                  key={photo.id}
                  onClick={() => setActiveIndex(i)}
                  className="group relative break-inside-avoid mb-4 rounded-xl overflow-hidden bg-zinc-900 cursor-zoom-in block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-auto block transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    loading={i < 6 ? "eager" : "lazy"}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {label && (
                    <span className={`absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${label.cls}`}>
                      {label.text}
                    </span>
                  )}

                  {photo.isFeatured && (
                    <span className="absolute top-3 left-3 bg-accent/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase backdrop-blur-sm">
                      Featured
                    </span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-4 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-white font-semibold text-sm leading-snug">{photo.title}</p>
                    {photo.caption && (
                      <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">{photo.caption}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Lightbox (singles only) */}
      <AnimatePresence>
        {activeIndex !== null && singles[activeIndex] && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            aria-modal="true"
            role="dialog"
          >
            <div className="absolute inset-0 bg-black/96 backdrop-blur-sm" />

            <button
              onClick={close}
              className="absolute top-5 right-5 z-20 text-zinc-500 hover:text-white transition-colors p-1"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 text-zinc-600 text-xs tracking-widest font-medium select-none">
              {activeIndex + 1} / {singles.length}
            </div>

            {singles.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 md:left-6 z-20 text-zinc-500 hover:text-white transition-colors p-3"
                aria-label="Previous"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {singles.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 md:right-6 z-20 text-zinc-500 hover:text-white transition-colors p-3"
                aria-label="Next"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center gap-5 px-16 max-w-5xl w-full max-h-screen"
                onClick={(e) => e.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={singles[activeIndex].imageUrl}
                  alt={singles[activeIndex].title}
                  className="max-h-[76vh] max-w-full object-contain rounded-lg shadow-2xl"
                />

                <div className="text-center max-w-lg px-4">
                  <p className="text-white font-semibold text-base leading-snug">
                    {singles[activeIndex].title}
                  </p>
                  {singles[activeIndex].caption && (
                    <p className="text-zinc-500 text-sm mt-1 leading-relaxed">
                      {singles[activeIndex].caption}
                    </p>
                  )}
                  {singles[activeIndex].label && (() => {
                    const ls = getLabelStyle(singles[activeIndex].label);
                    return ls ? (
                      <span className={`inline-block mt-2.5 text-[11px] font-semibold px-3 py-1 rounded-full ${ls.cls}`}>
                        {ls.text}
                      </span>
                    ) : null;
                  })()}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
