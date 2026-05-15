import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import GalleryGrid from "@/components/GalleryGrid";

export const dynamic = "force-dynamic";

// ─── Service config ───────────────────────────────────────────────────────────

const SERVICE_CONFIG = {
  "interior-detail": {
    title: "Interior Detail",
    subtitle: "Every surface, spotless.",
    description:
      "Deep cleaning of every interior surface — vacuuming, steam cleaning, plastics, leather, glass, and odor elimination. We restore the inside of your vehicle to a level that makes every drive feel like a fresh start.",
    category: "interior",
    bookLabel: "Book Interior Detail",
  },
  "exterior-detail": {
    title: "Exterior Detail",
    subtitle: "Clean paint. Protected finish.",
    description:
      "A thorough exterior cleaning that goes beyond a standard wash — hand wash, clay bar decontamination, wheel and tire treatment, and a protective finish applied to make your paint look and last better.",
    category: "exterior",
    bookLabel: "Book Exterior Detail",
  },
  "full-detail": {
    title: "Full Detail",
    subtitle: "Interior and exterior, combined.",
    description:
      "The complete vehicle reset. Full interior cleaning combined with a detailed exterior treatment — the best option when your vehicle needs a thorough transformation inside and out.",
    category: "full-detail",
    bookLabel: "Book Full Detail",
  },
  "paint-enhancement": {
    title: "Paint Enhancement",
    subtitle: "Gloss. Depth. Clarity.",
    description:
      "A single-stage machine polishing process that removes light swirl marks and surface imperfections, dramatically improving your paint's gloss and depth. A noticeable upgrade from any standard detail.",
    category: "paint-enhancement",
    bookLabel: "Get a Quote",
  },
  "paint-correction": {
    title: "Paint Correction",
    subtitle: "Near-perfect paint, restored.",
    description:
      "A multi-stage machine polishing process that systematically removes scratches, swirl marks, water spots, and oxidation. The result is paint that reflects light the way it was designed to — deep, clear, and flawless.",
    category: "paint-correction",
    bookLabel: "Get a Quote",
  },
  "ceramic-coating": {
    title: "Ceramic Coating",
    subtitle: "Protection that lasts years.",
    description:
      "A professional-grade ceramic coating that bonds to your paint at the molecular level, creating a durable, hydrophobic layer that repels water, contaminants, and UV damage while adding a deep, lasting gloss.",
    category: "ceramic-coating",
    bookLabel: "Get a Quote",
  },
} as const;

type Slug = keyof typeof SERVICE_CONFIG;

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const config = SERVICE_CONFIG[params.slug as Slug];
  if (!config) return {};
  return {
    title: `${config.title} Gallery — CMT Detailing`,
    description: config.description,
  };
}

export function generateStaticParams() {
  return Object.keys(SERVICE_CONFIG).map((slug) => ({ slug }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ServiceGalleryPage({
  params,
}: {
  params: { slug: string };
}) {
  const config = SERVICE_CONFIG[params.slug as Slug];
  if (!config) notFound();

  const photos = await prisma.sitePhoto.findMany({
    where: { category: config.category },
    orderBy: [
      { isFeatured: "desc" },
      { displayOrder: "asc" },
      { createdAt: "desc" },
    ],
  });

  return (
    <div className="bg-zinc-950 min-h-screen">

      {/* ── Header ── */}
      <section className="pt-24 pb-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-400 text-xs tracking-widest uppercase font-medium transition-colors mb-8"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Services
          </Link>

          <p className="text-zinc-600 text-xs font-semibold uppercase tracking-[0.25em] mb-4">
            CMT Detailing · Gallery
          </p>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
            {config.title}
          </h1>

          <p className="text-zinc-500 text-base md:text-lg font-medium mb-6 tracking-wide">
            {config.subtitle}
          </p>

          <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-10">
            {config.description}
          </p>

          <Link
            href="/book"
            className="inline-block bg-accent hover:bg-accent-hover text-white font-semibold px-9 py-3 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-sm"
          >
            {config.bookLabel}
          </Link>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>

      {/* ── Gallery ── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {photos.length > 0 && (
            <p className="text-zinc-700 text-xs uppercase tracking-[0.2em] font-semibold mb-10 text-center">
              {photos.length} {photos.length === 1 ? "photo" : "photos"}
            </p>
          )}
          <GalleryGrid photos={photos} />
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="border-t border-zinc-900 mt-8 py-24 px-6 text-center">
        <div className="max-w-lg mx-auto">
          <p className="text-zinc-600 text-xs uppercase tracking-[0.2em] font-semibold mb-5">
            Ready to get started?
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
            Book your {config.title.toLowerCase()}
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed mb-9">
            Send a booking request and we'll confirm the details with you directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/book"
              className="bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:scale-[1.02] transition-all duration-200 text-sm"
            >
              {config.bookLabel}
            </Link>
            <Link
              href="/services"
              className="border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 font-semibold px-8 py-3 rounded-lg transition-all duration-200 text-sm"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
