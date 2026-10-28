import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mobile Car Detailing in Raynham, MA | CMT Detailing",
  description:
    "Mobile car detailing in Raynham, MA — interior, full details, paint correction & ceramic coating at your driveway. From $100. We come to you.",
  openGraph: {
    type: "website",
    siteName: "CMT Detailing",
    title: "Mobile Car Detailing in Raynham, MA | CMT Detailing",
    description:
      "Mobile car detailing in Raynham, MA — interior, full details, paint correction & ceramic coating at your driveway. From $100. We come to you.",
    url: "https://cmtdetailing.com/locations/raynham",
    images: [
      {
        url: "/images/hero-mustang.jpg",
        alt: "CMT Detailing — professionally detailed Mustang",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mobile Car Detailing in Raynham, MA | CMT Detailing",
    description:
      "Mobile car detailing in Raynham, MA — interior, full details, paint correction & ceramic coating at your driveway. From $100. We come to you.",
    images: ["/images/hero-mustang.jpg"],
  },
};

const services = [
  {
    name: "Interior Detail",
    price: "From $150",
    description:
      "Deep cleaning of every surface inside your vehicle — vacuuming, steam cleaning, and odor elimination.",
    href: "/services/interior-detail",
  },
  {
    name: "Exterior Detail",
    price: "From $100",
    description:
      "Hand wash, clay bar treatment, tire dressing, and window polish for a clean, protected finish.",
    href: "/services/exterior-detail",
  },
  {
    name: "Full Detail",
    price: "From $250",
    description:
      "A complete interior and exterior detail — the best option for a full vehicle refresh.",
    href: "/services/full-detail",
  },
  {
    name: "Paint Enhancement",
    price: "From $500",
    description:
      "Single-stage machine polishing that removes light swirl marks and restores gloss and depth.",
    href: "/services/paint-enhancement",
  },
  {
    name: "Paint Correction",
    price: "From $800",
    description:
      "Multi-stage machine polishing to remove scratches, swirl marks, water spots, and oxidation.",
    href: "/services/paint-correction",
  },
  {
    name: "Ceramic Coating",
    price: "From $1,000",
    description:
      "Long-lasting paint protection with a professional ceramic coating that repels water and dirt.",
    href: "/services/ceramic-coating",
  },
];

const townJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Mobile Car Detailing in Raynham, MA",
  serviceType: "Mobile Car Detailing",
  provider: {
    "@type": "LocalBusiness",
    name: "CMT Detailing",
    url: "https://cmtdetailing.com",
    priceRange: "$$",
  },
  areaServed: {
    "@type": "City",
    name: "Raynham",
    addressRegion: "MA",
    addressCountry: "US",
  },
  url: "https://cmtdetailing.com/locations/raynham",
};

export default function RaynhamPage() {
  return (
    <div className="bg-zinc-950 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(townJsonLd) }}
      />

      {/* ── Header ── */}
      <section className="pt-24 pb-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-zinc-600 text-xs font-semibold uppercase tracking-[0.25em] mb-4">
            CMT Detailing · Raynham, MA
          </p>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
            Mobile Car Detailing in Raynham, MA
          </h1>

          <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-10">
            Professional mobile detailing brought to your driveway in Raynham —
            just minutes from our home base in Taunton. Interior, exterior,
            full details, paint correction, and ceramic coating, done at your
            home or workplace. We bring our own water and power, so no
            hookups or shop visit needed.
          </p>

          <Link
            href="/book"
            className="inline-block bg-accent hover:bg-accent-hover text-white font-semibold px-9 py-3 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-sm"
          >
            Book Your Detail in Raynham
          </Link>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>

      {/* ── Services in Raynham ── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Detailing Services in Raynham
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed text-center max-w-xl mx-auto mb-12">
            Every service below is available mobile in Raynham, MA — same
            prices, same results, at your location.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service) => (
              <Link
                key={service.name}
                href={service.href}
                className="group bg-zinc-800/90 backdrop-blur-sm border border-zinc-700 rounded-2xl p-6 flex flex-col gap-2 hover:border-accent/70 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(66,109,182,0.25)] transition-all duration-200 h-full block"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-white font-semibold text-base">
                    {service.name}
                  </h3>
                  <span className="text-accent-light text-xs font-medium whitespace-nowrap">
                    {service.price}
                  </span>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed flex-1">
                  {service.description}
                </p>
                <span className="text-accent-light text-xs font-medium mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  View service →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why mobile in Raynham ── */}
      <section className="bg-zinc-900 py-16 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Why Raynham Drivers Choose Mobile Detailing
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">We Come to You</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Home, office, or anywhere your car is parked in Raynham — no
                drop-off, no waiting room, no rearranging your day.
              </p>
            </div>
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">Fully Self-Sufficient</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Our setup carries its own water and power, so apartments,
                condos, and workplaces all work — nothing needed from you.
              </p>
            </div>
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">Local, Not a Chain</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Founded by a Taunton native, serving Raynham and the
                surrounding towns with the same care on every vehicle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Service area ── */}
      <section className="bg-zinc-950 py-16 px-6 border-t border-zinc-800 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
            Also Serving Nearby Towns
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed">
            In addition to Raynham, CMT Detailing provides mobile detailing
            throughout Taunton, Bridgewater, Middleborough, Lakeville,
            Norton, Dighton, Berkley, and Easton, MA.
          </p>
          <p className="text-zinc-500 text-sm leading-relaxed mt-4">
            Hours: 7:00 AM – 6:00 PM, Monday – Sunday.
          </p>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="border-t border-zinc-900 py-24 px-6 text-center">
        <div className="max-w-lg mx-auto">
          <p className="text-zinc-600 text-xs uppercase tracking-[0.2em] font-semibold mb-5">
            Ready to get started?
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
            Book your detail in Raynham
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed mb-9">
            Send a booking request and we&apos;ll confirm the details with you directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/book"
              className="bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:scale-[1.02] transition-all duration-200 text-sm"
            >
              Book Now
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
