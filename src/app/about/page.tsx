import Image from "next/image";
import Link from "next/link";
import FadeUp from "@/components/FadeUp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — CMT Detailing",
  description:
    "Meet Cameron Dorr, founder of CMT Detailing — professional mobile car detailing in Taunton, MA.",
};

const whyPoints = [
  {
    title: "Attention to Detail",
    body: "Every job is approached with the same precision — no surface skipped, no step rushed. The standard is showroom quality on every single vehicle.",
    icon: (
      <svg className="w-5 h-5 text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    title: "Fully Mobile Service",
    body: "We come to your home, office, or wherever your vehicle is parked. No drop-offs, no waiting — professional results delivered directly to you.",
    icon: (
      <svg className="w-5 h-5 text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    title: "Premium Ceramic Coating",
    body: "From 1-year entry protection to 9-year packages, we offer professional-grade coatings that preserve your paint and simplify long-term maintenance.",
    icon: (
      <svg className="w-5 h-5 text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Customer-First Always",
    body: "Clear communication, reliable scheduling, and honest recommendations. Every client is treated with the same level of care we give every vehicle.",
    icon: (
      <svg className="w-5 h-5 text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <div className="bg-zinc-950">

      {/* ── Founder / About ───────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-16 items-center">

            {/* Image — second on mobile, first (left) on desktop */}
            <FadeUp delay={0.1} className="order-2 md:order-1">
              <div className="relative">
                {/* Decorative offset accent */}
                <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-accent/20 bg-accent/[0.04]" />
                {/* Photo container */}
                <div
                  className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-700/80"
                  style={{
                    boxShadow: [
                      "0 0 0 1px rgba(74,123,196,0.10)",
                      "0 0 50px rgba(74,123,196,0.10)",
                      "0 30px 70px rgba(0,0,0,0.55)",
                    ].join(", "),
                  }}
                >
                  <Image
                    src="/images/cameron-dorr.webp"
                    alt="Cameron Dorr — Founder, CMT Detailing"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </div>
              </div>
            </FadeUp>

            {/* Text — first on mobile, second (right) on desktop */}
            <FadeUp className="order-1 md:order-2">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.22em] mb-4">
                About CMT Detailing
              </p>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
                Precision. Professionalism. Passion for the Details.
              </h1>

              <div className="space-y-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
                <p>
                  CMT Detailing was founded by Cameron Dorr, a Taunton, Massachusetts
                  native with a passion for automotive care and transformation. What
                  started with detailing family vehicles quickly turned into a
                  full-service mobile detailing business built on precision,
                  professionalism, and pride in the small details.
                </p>
                <p>
                  Now a sophomore studying Corporate Finance &amp; Investments with a
                  minor in International Business, Cameron has spent the last two years
                  growing CMT Detailing into a trusted local brand focused on delivering
                  high-end results directly to clients&apos; driveways. From deep interior
                  restorations to premium ceramic coatings, every vehicle is treated with
                  the same level of care and attention as if it were his own.
                </p>
                <p>
                  CMT Detailing specializes in creating that &ldquo;brand new&rdquo; feeling —
                  combining meticulous workmanship, customer-focused service, and a
                  genuine passion for seeing vehicles transformed from worn and neglected
                  to showroom-quality condition.
                </p>
              </div>

              {/* Accent divider */}
              <div className="mt-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-accent/30 to-transparent" />
                <span className="text-zinc-600 text-xs font-semibold uppercase tracking-[0.18em] shrink-0">
                  Taunton, MA
                </span>
              </div>
            </FadeUp>

          </div>
        </div>
      </section>

      {/* ── Why Clients Choose CMT ────────────────────────────────────────────── */}
      <section className="bg-zinc-900 border-t border-zinc-800 py-24 px-6">
        <div className="max-w-5xl mx-auto">

          <FadeUp className="text-center mb-14">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.22em] mb-4">
              Our Standard
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white">
              Why Clients Choose CMT
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {whyPoints.map((point, i) => (
              <FadeUp key={point.title} delay={i * 0.08}>
                <div className="flex gap-5 bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-2xl p-6 h-full hover:border-accent/40 transition-colors duration-200">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mt-0.5">
                    {point.icon}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white mb-2">
                      {point.title}
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {point.body}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>

        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-zinc-950 to-zinc-900 border-t border-zinc-800 py-24 px-6 text-center">
        <FadeUp className="max-w-xl mx-auto">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.22em] mb-5">
            Get Started
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ready to Restore Your Vehicle?
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed mb-10">
            Send a booking request online and we&apos;ll handle the rest. No
            back-and-forth, no hassle.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/book"
              className="inline-block bg-accent hover:bg-accent-hover text-white font-semibold px-10 py-3 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            >
              Book Now
            </Link>
            <Link
              href="/services"
              className="inline-block border border-zinc-600 hover:border-accent text-zinc-300 hover:text-white font-semibold px-10 py-3 rounded-lg transition-all duration-200"
            >
              View Services
            </Link>
          </div>
        </FadeUp>
      </section>

    </div>
  );
}
