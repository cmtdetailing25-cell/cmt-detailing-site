"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/admin") || pathname === "/") return null;

  return (
    <nav className="bg-cmt-dark border-b border-cmt-border/50 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">

        {/* Brand mark */}
        <Link href="/" className="flex items-center gap-3 group">
          {/* Mini circular logo — same treatment as HomeHeader but compact */}
          <div
            className="relative w-9 h-9 rounded-full overflow-hidden border border-accent/70 bg-cmt-dark shrink-0
                        transition-shadow duration-200 group-hover:shadow-[0_0_14px_rgba(74,123,196,0.45)]"
            style={{
              boxShadow: "0 0 10px rgba(74,123,196,0.28), 0 3px 10px rgba(0,0,0,0.45)",
            }}
          >
            <Image
              src="/images/logo.PNG"
              alt="CMT Detailing"
              fill
              className="object-cover object-center"
              sizes="36px"
            />
          </div>
          <span className="font-display font-semibold uppercase tracking-[0.22em] text-cmt-light text-[10px] whitespace-nowrap">
            CMT Detailing
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-[10px] tracking-[0.18em] uppercase font-semibold transition-colors duration-150 ${
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
            className="text-[10px] tracking-[0.15em] uppercase font-bold bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg shadow-md hover:shadow-[0_0_20px_rgba(74,123,196,0.4)] hover:scale-[1.02] transition-all duration-200"
          >
            Book Now
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-cmt-subtle hover:text-cmt-light transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-cmt-border/50 bg-cmt-dark">
          <div className="px-5 pt-1 pb-5 flex flex-col">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between py-4 border-b border-cmt-border/40 text-sm font-semibold tracking-wide transition-colors ${
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
              className="mt-5 block bg-accent hover:bg-accent-hover text-white font-bold text-sm tracking-[0.12em] uppercase py-3.5 rounded-lg shadow-md hover:shadow-[0_0_20px_rgba(74,123,196,0.4)] transition-all duration-200 text-center"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
