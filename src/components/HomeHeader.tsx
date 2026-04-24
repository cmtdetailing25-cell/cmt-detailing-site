"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
];

export default function HomeHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Banner strip with nav overlaid */}
      <div className="relative h-24 sm:h-28 bg-zinc-100">
        <Image
          src="/images/bannar.PNG"
          alt="CMT Detailing"
          fill
          className="object-contain"
          priority
          sizes="100vw"
        />

        {/* Desktop nav — right side, floated above banner */}
        <nav className="absolute inset-y-0 right-0 hidden md:flex items-center pr-6 gap-5">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-semibold transition-colors ${
                pathname === l.href
                  ? "text-accent"
                  : "text-zinc-700 hover:text-zinc-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/book"
            className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          >
            Book Now
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden text-zinc-700 hover:text-zinc-900"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-zinc-900 border-t border-white/10 px-4 py-4 flex flex-col gap-3">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`text-sm font-medium ${
                pathname === l.href ? "text-accent-light" : "text-zinc-300 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/book"
            onClick={() => setOpen(false)}
            className="bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-md transition-all duration-200 text-center mt-1"
          >
            Book Now
          </Link>
        </div>
      )}
    </header>
  );
}
