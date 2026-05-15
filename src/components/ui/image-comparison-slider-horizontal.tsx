"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface Props {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
  title?: string;
  caption?: string;
}

export default function ImageComparisonSlider({
  beforeSrc,
  afterSrc,
  beforeAlt = "Before",
  afterAlt = "After",
  title,
  caption,
}: Props) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(2, Math.min(98, pct)));
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) move(e.clientX); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [move]);

  return (
    <div className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div
        ref={containerRef}
        className="relative select-none overflow-hidden cursor-col-resize aspect-[4/3]"
        onMouseDown={() => { dragging.current = true; }}
        onTouchStart={(e) => move(e.touches[0].clientX)}
        onTouchMove={(e) => { e.preventDefault(); move(e.touches[0].clientX); }}
      >
        {/* After image — full width, sits behind */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterSrc}
          alt={afterAlt}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />

        {/* Before image — clipped to the left of the divider */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeSrc}
          alt={beforeAlt}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          draggable={false}
        />

        {/* Divider line */}
        <div
          className="absolute inset-y-0 w-[1.5px] bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.4)]"
          style={{ left: `${position}%` }}
        />

        {/* Drag handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/50 flex items-center justify-center gap-0.5 shadow-[0_2px_12px_rgba(0,0,0,0.6)] pointer-events-none"
          style={{ left: `${position}%` }}
        >
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </div>

        {/* Before label */}
        <span className="absolute bottom-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm bg-zinc-800/95 text-zinc-300 border border-zinc-600 select-none pointer-events-none">
          Before
        </span>

        {/* After label */}
        <span className="absolute bottom-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm bg-accent/20 text-accent-light border border-accent/50 shadow-[0_0_10px_rgba(66,109,182,0.3)] select-none pointer-events-none">
          After
        </span>
      </div>

      {/* Title / caption */}
      {(title || caption) && (
        <div className="px-4 py-3 border-t border-zinc-800">
          {title && (
            <p className="text-white font-semibold text-sm leading-snug">{title}</p>
          )}
          {caption && (
            <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{caption}</p>
          )}
        </div>
      )}
    </div>
  );
}
