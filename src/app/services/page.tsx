import Link from "next/link";
import Image from "next/image";
import FadeUp from "@/components/FadeUp";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CardData {
  title: string;
  price: string;
  description?: string;
  bullets: string[];
  bestFor?: string;
  cta: string;
  ctaHref: string;
  featured?: boolean;
  badge?: string;
  featuredStrength?: "strong" | "medium";
}

// ─── Data ────────────────────────────────────────────────────────────────────

const coreDetailingServices: CardData[] = [
  {
    title: "Interior Detail",
    price: "Starting at $150–$250",
    description:
      "A deep interior cleaning designed to restore cleanliness, comfort, and freshness.",
    bullets: [
      "Full vacuum and debris removal",
      "Deep surface cleaning",
      "Plastics and trim restored",
      "Windows cleaned",
    ],
    bestFor: "Vehicles needing a full interior refresh or heavy use cleaning.",
    cta: "Schedule My Detail",
    ctaHref: "/book",
  },
  {
    title: "Exterior Detail",
    price: "Starting at $100–$180",
    description:
      "A thorough exterior cleaning to restore shine and protect your vehicle's finish.",
    bullets: [
      "Hand wash & dry",
      "Wheels and tires cleaned",
      "Paint decontamination",
      "Protective finish applied",
    ],
    bestFor: "Maintaining your vehicle's exterior and restoring shine.",
    cta: "Schedule My Detail",
    ctaHref: "/book",
  },
  {
    title: "Full Detail",
    price: "Starting at $250–$350",
    description:
      "A complete interior and exterior reset to bring your vehicle back to a like-new condition.",
    bullets: [
      "Full interior cleaning",
      "Exterior wash & decontamination",
      "Interior & exterior finishing",
    ],
    bestFor: "Vehicles that need a full reset inside and out.",
    cta: "Book Full Detail",
    ctaHref: "/book",
    featured: true,
    badge: "Most Popular",
    featuredStrength: "strong",
  },
];

const paintServices: CardData[] = [
  {
    title: "Paint Enhancement",
    price: "Starting at $500+",
    description:
      "Remove light imperfections and dramatically improve gloss and clarity.",
    bullets: [
      "Light swirl removal",
      "Gloss & depth enhancement",
      "Ideal upgrade from a standard detail",
    ],
    bestFor: "Vehicles with light swirl marks looking for a noticeable improvement.",
    cta: "Upgrade My Finish",
    ctaHref: "/book",
    featured: true,
    badge: "Most Popular",
    featuredStrength: "strong",
  },
  {
    title: "Paint Correction",
    price: "Starting at $800–$1,200+",
    description:
      "A multi-step process to restore your paint to near-perfect condition.",
    bullets: [
      "Removes scratches & swirl marks",
      "Deep gloss restoration",
      "Precision machine polishing",
    ],
    bestFor: "Owners wanting near-perfect paint and maximum visual impact.",
    cta: "Get My Quote",
    ctaHref: "/book",
  },
];

const coatingServices: CardData[] = [
  {
    title: "1-Year Protection",
    price: "Starting at $1,000",
    description:
      "Entry-level ceramic protection that shields your paint and simplifies everyday maintenance.",
    bullets: [
      "Full prep & decontamination",
      "Light polish",
      "Hydrophobic protection",
      "Easier maintenance",
    ],
    bestFor: "Short-term protection and maintenance.",
    cta: "Protect My Vehicle",
    ctaHref: "/book",
  },
  {
    title: "7-Year Coating",
    price: "Starting at $1,500–$1,800",
    description:
      "Our most popular coating — exceptional durability, deep gloss, and long-term protection in one package.",
    bullets: [
      "Full prep & decontamination",
      "Paint enhancement included",
      "Maximum gloss & depth",
      "Glass coating included",
    ],
    bestFor: "Most customers wanting long-term protection and value.",
    cta: "Protect My Vehicle",
    ctaHref: "/book",
    featured: true,
    badge: "Most Popular",
    featuredStrength: "strong",
  },
  {
    title: "9-Year Coating",
    price: "Starting at $2,000+",
    description:
      "The ultimate ceramic solution for long-term ownership — maximum durability and a flawless finish.",
    bullets: [
      "Full prep & decontamination",
      "Paint correction included",
      "Maximum durability",
      "Premium gloss & finish",
    ],
    bestFor: "Maximum protection and long-term ownership.",
    cta: "Get My Quote",
    ctaHref: "/book",
  },
];

const maintenancePlans: CardData[] = [
  {
    title: "Monthly",
    price: "$120–$160 / visit",
    bullets: ["Full maintenance clean", "Interior + exterior upkeep"],
    bestFor: "Occasional upkeep.",
    cta: "Get Started",
    ctaHref: "/book",
  },
  {
    title: "Bi-Weekly",
    price: "$90–$130 / visit",
    bullets: [
      "Best balance of value & consistency",
      "Maintains coating performance",
      "Priority scheduling",
    ],
    bestFor: "Maintaining a consistently clean and protected vehicle.",
    cta: "Join Plan",
    ctaHref: "/book",
    featured: true,
    badge: "Best Value",
    featuredStrength: "medium",
  },
  {
    title: "Weekly",
    price: "$60–$100 / visit",
    bullets: ["Always clean", "Ideal for busy clients"],
    bestFor: "Clients who want their vehicle always looking perfect.",
    cta: "Get Started",
    ctaHref: "/book",
  },
];

const addOns = [
  { name: "Glass Coating", price: "$75–$150" },
  { name: "Wheel Coating", price: "$150–$300" },
  { name: "Interior Protection", price: "Optional" },
  { name: "Plastic Restoration", price: "Quote Based" },
  { name: "Pet Hair Removal", price: "Quote Based" },
  { name: "Stain Removal", price: "Quote Based" },
];

const trustPoints = [
  "Mobile convenience — we come to you",
  "Professional process & products",
  "Paint-safe methods",
  "Clear communication throughout",
  "Long-term protection options",
];

const resultImages = [
  {
    src: "/images/interior-bmw-1.jpg",
    alt: "BMW interior detail result",
    label: "Interior Detail",
  },
  {
    src: "/images/exterior-genesis.jpg",
    alt: "Genesis exterior detail result",
    label: "Exterior Detail",
  },
  {
    src: "/images/detail-close.jpg",
    alt: "Attention to Detail",
    label: "Attention to Detail",
  },
];

// ─── Shared card component ───────────────────────────────────────────────────

function ServiceCard({
  title,
  price,
  description,
  bullets,
  bestFor,
  cta,
  ctaHref,
  featured = false,
  badge,
  featuredStrength = "strong",
}: CardData) {
  const featuredClasses =
    featuredStrength === "strong"
      ? "bg-zinc-900/90 backdrop-blur-sm border-2 border-accent shadow-[0_0_40px_rgba(66,109,182,0.35)]"
      : "bg-zinc-900/90 backdrop-blur-sm border-2 border-accent/60 shadow-[0_0_22px_rgba(66,109,182,0.22)]";

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-7 h-full transition-all duration-200 ${
        featured
          ? featuredClasses
          : "bg-zinc-900/60 backdrop-blur-sm border border-zinc-700 hover:border-accent/60 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(66,109,182,0.18)] cursor-pointer"
      }`}
    >
      {badge && (
        <span className="absolute top-5 right-5 bg-accent/15 border border-accent text-accent-light text-xs font-semibold px-3 py-1 rounded-full tracking-wide">
          {badge}
        </span>
      )}

      <h3 className={`font-bold text-xl text-white mb-1 ${badge ? "pr-28" : ""}`}>
        {title}
      </h3>
      <p className="text-accent-light font-semibold text-sm mb-5">{price}</p>

      {description && (
        <p className="text-zinc-400 text-sm leading-relaxed mb-5">{description}</p>
      )}

      <ul className="flex flex-col gap-3 mb-4">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-sm text-zinc-300">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent/50 shrink-0" />
            {b}
          </li>
        ))}
      </ul>

      {bestFor && (
        <p className="text-zinc-500 text-xs leading-relaxed mb-5">
          <span className="font-semibold text-zinc-400">Best for: </span>
          {bestFor}
        </p>
      )}

      <div className="mt-auto">
        <Link
          href={ctaHref}
          className={`block text-center font-semibold py-2.5 px-4 rounded-lg text-sm transition-all duration-200 ${
            featured
              ? "bg-accent hover:bg-accent-hover text-white shadow-md hover:shadow-lg hover:scale-[1.02]"
              : "border border-zinc-600 hover:border-accent text-zinc-300 hover:text-white hover:bg-accent/5"
          }`}
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  return (
    <div className="bg-zinc-950">

      {/* ── 1. Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-28 md:py-36 px-6 text-center">
        <Image
          src="/images/bannar.PNG"
          alt=""
          fill
          className="object-contain opacity-[0.04] blur-xl scale-125 pointer-events-none select-none"
          sizes="100vw"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/80 to-zinc-950 pointer-events-none" />

        <FadeUp className="relative z-10 max-w-3xl mx-auto">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.2em] mb-5">
            Professional Detailing Services
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Premium Detailing, Paint Correction &amp; Ceramic Coating
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-10">
            Restore, protect, and maintain your vehicle to a higher standard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#services"
              className="border border-zinc-600 hover:border-accent text-zinc-300 hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200"
            >
              View Services
            </a>
            <Link
              href="/book"
              className="bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            >
              Get a Quote
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── 2. Core Detailing + Paint Services ──────────────────────────────── */}
      <section id="services" className="bg-zinc-900 border-t border-zinc-800 py-24 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Detailing */}
          <FadeUp className="text-center mb-14">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
              Detailing
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Core Detailing Services
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coreDetailingServices.map((s, i) => (
              <FadeUp key={s.title} delay={i * 0.08}>
                <ServiceCard {...s} />
              </FadeUp>
            ))}
          </div>

          {/* Transition into Paint */}
          <FadeUp className="text-center my-16">
            <p className="text-zinc-500 text-sm">Looking for more than a standard detail?</p>
            <div className="w-10 h-px bg-zinc-700 mx-auto mt-4" />
          </FadeUp>

          {/* Paint Services */}
          <FadeUp className="text-center mb-14">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
              Paint Services
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Paint Enhancement &amp; Correction
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {paintServices.map((s, i) => (
              <FadeUp key={s.title} delay={i * 0.08}>
                <ServiceCard {...s} />
              </FadeUp>
            ))}
          </div>

        </div>
      </section>

      {/* ── 3. Ceramic Coating ───────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-zinc-950 to-zinc-900 border-t border-zinc-800 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-zinc-600 text-sm mb-6">
              Ready to protect your finish long-term?
            </p>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
              Ceramic Coating
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Ceramic Coating Protection
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-base leading-relaxed">
              Long-term protection designed to preserve your vehicle&apos;s
              finish, enhance gloss, and simplify maintenance.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coatingServices.map((s, i) => (
              <FadeUp key={s.title} delay={i * 0.08}>
                <ServiceCard {...s} />
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Maintenance Program ───────────────────────────────────────────── */}
      <section className="bg-zinc-900 border-t border-zinc-800 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-zinc-600 text-sm mb-6">
              Keep your vehicle looking its best year-round.
            </p>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
              Maintenance
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Maintenance Program
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-base leading-relaxed">
              Consistent, scheduled cleaning that keeps your vehicle protected
              and always looking its best.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {maintenancePlans.map((s, i) => (
              <FadeUp key={s.title} delay={i * 0.08}>
                <ServiceCard {...s} />
              </FadeUp>
            ))}
          </div>

          <FadeUp className="mt-8 text-center">
            <p className="text-zinc-600 text-sm">
              Initial detail or coating required before enrollment.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── 5. Add-Ons ───────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-zinc-950 to-zinc-900 border-t border-zinc-800 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
              Enhancements
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Add-On Services
            </h2>
          </FadeUp>

          <FadeUp>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {addOns.map((a) => (
                <div
                  key={a.name}
                  className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-5 hover:border-accent/60 transition-colors duration-200"
                >
                  <p className="text-white font-semibold text-sm mb-1">{a.name}</p>
                  <p className="text-accent-light text-sm">{a.price}</p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── 6. Trust / Authority ─────────────────────────────────────────────── */}
      <section className="bg-zinc-900 border-t border-zinc-800 py-24 px-6">
        <div className="max-w-5xl mx-auto">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
            {resultImages.map((img, i) => (
              <FadeUp key={img.src} delay={i * 0.1}>
                <div className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-800">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/75 to-transparent" />
                  <p className="absolute bottom-3 left-4 text-sm font-semibold text-white z-10 tracking-wide">
                    {img.label}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            <FadeUp>
              <p className="text-zinc-300 text-lg leading-relaxed mb-8 border-l-2 border-accent pl-5">
                We specialize in restoring and protecting vehicles to a higher
                standard using professional techniques and products.
              </p>
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.2em] mb-5">
                Why Choose CMT Detailing
              </p>
              <ul className="flex flex-col gap-3">
                {trustPoints.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-zinc-300 text-sm">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent/50 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </FadeUp>

            <FadeUp delay={0.1}>
              <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 rounded-2xl p-8">
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-accent-light" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-zinc-300 text-base leading-relaxed mb-6">
                  &ldquo;Great communication, clean results, and super
                  convenient mobile service.&rdquo;
                </blockquote>
                <p className="text-zinc-500 text-sm">— CMT Detailing Customer</p>
              </div>
            </FadeUp>

          </div>
        </div>
      </section>

      {/* ── 7. Final CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-zinc-950 to-zinc-900 border-t border-zinc-800 py-24 px-6 text-center">
        <FadeUp className="max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ready to transform your vehicle?
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed mb-10">
            Request a booking or quote and we&apos;ll help recommend the right
            service for your vehicle.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/book"
              className="bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            >
              Schedule My Detail
            </Link>
            <Link
              href="/book"
              className="border border-zinc-600 hover:border-accent text-zinc-300 hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200"
            >
              Get My Quote
            </Link>
          </div>
        </FadeUp>
      </section>

    </div>
  );
}
