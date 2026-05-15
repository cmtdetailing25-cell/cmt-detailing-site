"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
];

// ─── Logo circle ──────────────────────────────────────────────────────────────
// rounded-full + overflow-hidden crops the image into a clean circle.
// object-cover fills the circle fully — no square edges visible.
// The glow/ring sit on the container itself (no extra wrapper divs).

function LogoCircle({ mobile = false }: { mobile?: boolean }) {
  const dim = mobile ? "w-[72px] h-[72px]" : "w-[96px] h-[96px]";

  return (
    <div
      className={`${dim} relative rounded-full overflow-hidden border-2 border-accent bg-cmt-dark shrink-0`}
      style={{
        boxShadow: [
          "0 0 0 3px rgba(74,123,196,0.10)",
          "0 0 20px rgba(74,123,196,0.32)",
          "0 0 5px  rgba(74,123,196,0.18)",
          "0 6px 20px rgba(0,0,0,0.55)",
        ].join(", "),
      }}
    >
      <Image
        src="/images/logo.png"
        alt="CMT Detailing"
        fill
        quality={100}
        className="object-cover object-center"
        priority
        sizes={mobile ? "72px" : "96px"}
      />
    </div>
  );
}

// ─── Accent rule ──────────────────────────────────────────────────────────────

function AccentRule({ dir }: { dir: "left" | "right" }) {
  return (
    <div
      className="hidden md:flex-1 md:block h-px"
      style={{
        background:
          dir === "left"
            ? "linear-gradient(to right, transparent, rgba(74,123,196,0.42))"
            : "linear-gradient(to left,  transparent, rgba(74,123,196,0.42))",
      }}
    />
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

export default function HomeHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-cmt-dark border-b border-cmt-border/40">

      {/* ── Brand strip ─────────────────────────────────────────────────────── */}
      {/*
        max-w-5xl constrains content so it never stretches to screen edges.
        grid-cols-[1fr_auto_1fr]: center column is exactly as wide as the logo,
        left and right columns always share the remaining space equally →
        the logo stays pixel-perfect centered regardless of text length asymmetry.
      */}
      <div className="px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center pt-2 pb-1 md:pt-3 md:pb-2">

          {/* Left ─ hamburger (mobile) / accent rule (desktop) + brand name */}
          {/*
            justify-start on mobile keeps the hamburger at the far left.
            md:justify-end on desktop pushes [AccentRule + text] flush to the
            right edge of the column — so CMT DETAILING sits tight to the logo
            with only the center column's px-5 padding as a gap.
          */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 justify-start md:justify-end">
            {/* Mobile hamburger */}
            <button
              className="md:hidden shrink-0 p-0.5 text-cmt-subtle hover:text-cmt-light transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Desktop accent rule */}
            <AccentRule dir="left" />

            {/* Brand name */}
            <span className="font-display font-semibold uppercase whitespace-nowrap text-cmt-light select-none
                             text-[8.5px] tracking-[0.1em]
                             sm:text-[9.5px] sm:tracking-[0.14em]
                             md:text-[12px] md:tracking-[0.22em]">
              CMT Detailing
            </span>
          </div>

          {/* Center ─ logo (always truly centered by the grid) */}
          <div className="flex justify-center px-2 md:px-5">
            <Link href="/" aria-label="CMT Detailing — home">
              {/* Mobile */}
              <span className="md:hidden">
                <LogoCircle mobile />
              </span>
              {/* Desktop */}
              <span className="hidden md:inline-flex">
                <LogoCircle />
              </span>
            </Link>
          </div>

          {/* Right ─ location text + desktop accent rule */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 justify-end">
            {/* Location text */}
            <span className="font-display font-semibold uppercase whitespace-nowrap text-cmt-light select-none text-right
                             text-[8.5px] tracking-[0.1em]
                             sm:text-[9.5px] sm:tracking-[0.14em]
                             md:text-[12px] md:tracking-[0.22em]">
              <span className="md:hidden">Taunton, MA</span>
              <span className="hidden md:inline">Taunton, Massachusetts</span>
            </span>

            {/* Desktop accent rule */}
            <AccentRule dir="right" />
          </div>

        </div>
      </div>

      {/* ── Desktop nav strip ─────────────────────────────────────────────────
          No divider — the nav reads as part of the same header block.
          Right-aligned to match the mockup.
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="hidden md:block">
        <div className="px-8 flex items-center justify-end gap-7 pt-0.5 pb-3">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-[12px] tracking-[0.16em] uppercase font-semibold transition-colors duration-150 ${
                pathname === l.href
                  ? "text-accent-light"
                  : "text-cmt-subtle hover:text-cmt-light"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/book"
            className="text-[12px] tracking-[0.13em] uppercase font-bold
                       bg-accent hover:bg-accent-hover text-white
                       px-6 py-2 rounded-md
                       shadow-md hover:shadow-[0_0_22px_rgba(74,123,196,0.45)]
                       hover:scale-[1.02] transition-all duration-200"
          >
            Book Now
          </Link>
        </div>
      </div>

      {/* ── Mobile dropdown ───────────────────────────────────────────────────
          Opens below the brand strip. Matches mockup: rows with chevrons,
          full-width Book Now button at the bottom.
      ──────────────────────────────────────────────────────────────────────── */}
      {open && (
        <div className="md:hidden border-t border-cmt-border/40 bg-cmt-dark">
          <div className="px-5 pt-1 pb-6 flex flex-col">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between py-4 border-b border-cmt-border/30
                            text-sm font-semibold tracking-wide transition-colors ${
                              pathname === l.href
                                ? "text-accent-light"
                                : "text-cmt-light hover:text-white"
                            }`}
              >
                {l.label}
                <svg className="w-4 h-4 text-cmt-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
            <Link
              href="/book"
              onClick={() => setOpen(false)}
              className="mt-5 block bg-accent hover:bg-accent-hover text-white
                         font-bold text-sm tracking-[0.12em] uppercase
                         py-3.5 rounded-md text-center
                         shadow-md hover:shadow-[0_0_22px_rgba(74,123,196,0.45)]
                         transition-all duration-200"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
