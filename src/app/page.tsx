import Link from "next/link";
import Image from "next/image";
import HeroContent from "@/components/HeroContent";
import FadeUp from "@/components/FadeUp";
import HomeHeader from "@/components/HomeHeader";

const services = [
  {
    name: "Interior Detail",
    description:
      "Deep cleaning of every surface inside your vehicle — vacuuming, steam cleaning, and odor elimination.",
    href: "/services/interior-detail",
  },
  {
    name: "Exterior Detail",
    description:
      "Hand wash, clay bar treatment, tire dressing, and window polish for a clean, protected finish.",
    href: "/services/exterior-detail",
  },
  {
    name: "Full Detail",
    description:
      "A complete interior and exterior detail — the best option for a full vehicle refresh.",
    href: "/services/full-detail",
  },
  {
    name: "Paint Correction",
    description:
      "Machine polishing to remove swirl marks, light scratches, and oxidation from your paint.",
    href: "/services/paint-correction",
  },
  {
    name: "Ceramic Coating",
    description:
      "Long-lasting paint protection with a professional ceramic coating that repels water and dirt.",
    href: "/services/ceramic-coating",
  },
];

const whyPoints = [
  {
    title: "Mobile Convenience",
    body: "We come to your home or location — no drop-offs, no waiting around.",
  },
  {
    title: "Consistent Results",
    body: "Every detail is performed with care and attention from start to finish.",
  },
  {
    title: "Professional Service",
    body: "Clean work, reliable scheduling, and clear communication every time.",
  },
  {
    title: "Built on Trust",
    body: "Local service you can count on, backed by honest work and real results.",
  },
];

const resultImages = [
  {
    src: "/images/interior-bmw-1.jpg",
    alt: "BMW interior detail result",
    label: "Interior Detail",
    href: "/services/interior-detail",
  },
  {
    src: "/images/exterior-genesis.jpg",
    alt: "Genesis exterior detail result",
    label: "Exterior Detail",
    href: "/services/exterior-detail",
  },
  {
    src: "/images/detail-close.jpg",
    alt: "Close-up detailing work",
    label: "Full Detail",
    href: "/services/full-detail",
  },
];

export default function HomePage() {
  return (
    <div>
      <HomeHeader />

      {/* ── Hero ── */}
      <section className="relative w-full min-h-[85vh] md:min-h-[72vh] lg:min-h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <Image
          src="/images/hero-mustang.jpg"
          alt="CMT Detailing — clean Mustang detail"
          fill
          priority
          className="object-cover object-[60%_50%] sm:object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b
          from-black/40 via-black/50 to-black/65
          md:from-black/10 md:via-black/18 md:to-black/30
          lg:from-black/32 lg:via-black/40 lg:to-black/58"
        />
        <HeroContent />
      </section>

      {/* ── Results Grid ── */}
      <section className="bg-gradient-to-b from-zinc-950 to-zinc-900 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
              Our Work
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Real Results, Every Time
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {resultImages.map((img, i) => (
              <FadeUp key={img.src} delay={i * 0.1}>
                <Link
                  href={img.href}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-800 block"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between">
                    <p className="text-sm font-semibold text-white tracking-wide">
                      {img.label}
                    </p>
                    <span className="text-accent-light text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      View Gallery →
                    </span>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services Preview ── */}
      <section className="bg-zinc-900 py-20 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Professional Mobile Detailing Services
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-base leading-relaxed">
              From interior refreshes to full details and premium services, CMT
              Detailing focuses on delivering reliable, high-quality results
              every time.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service, i) => (
              <FadeUp key={service.name} delay={i * 0.06}>
                <Link
                  href={service.href}
                  className="group bg-zinc-800/90 backdrop-blur-sm border border-zinc-700 rounded-2xl p-6 flex flex-col gap-2 hover:border-accent/70 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(66,109,182,0.25)] transition-all duration-200 h-full block"
                >
                  <h3 className="text-white font-semibold text-base">
                    {service.name}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed flex-1">
                    {service.description}
                  </p>
                  <span className="text-accent-light text-xs font-medium mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    View Gallery →
                  </span>
                </Link>
              </FadeUp>
            ))}

            {/* "See all" card */}
            <FadeUp delay={services.length * 0.06}>
              <div className="bg-zinc-800/50 border border-zinc-700 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 h-full">
                <p className="text-zinc-400 text-sm">
                  Not sure which service is right for you?
                </p>
                <Link
                  href="/services"
                  className="text-accent-light hover:text-accent text-sm font-medium transition-colors"
                >
                  See all services →
                </Link>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── Why Choose CMT ── */}
      <section className="bg-gradient-to-b from-zinc-950 to-zinc-900 py-20 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Why Choose CMT Detailing
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {whyPoints.map((point, i) => (
              <FadeUp key={point.title} delay={i * 0.08}>
                <div className="flex gap-4 bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-2xl p-6 h-full">
                  <div className="shrink-0 w-2 h-2 rounded-full bg-accent/50 mt-2" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">
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

      {/* ── Service Area ── */}
      <section className="bg-zinc-900 border-t border-zinc-800 py-16 px-6 text-center">
        <FadeUp className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
            Serving Taunton and Surrounding Areas
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed">
            CMT Detailing provides mobile detailing services throughout Taunton,
            MA and nearby towns. We come to you — wherever your vehicle is
            parked.
          </p>
        </FadeUp>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-b from-zinc-950 to-zinc-900 border-t border-zinc-800 py-20 px-6 text-center">
        <FadeUp className="max-w-xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Your Vehicle Detailed?
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed mb-8">
            Send a booking request online and we&apos;ll handle the rest. No
            back-and-forth, no hassle.
          </p>
          <Link
            href="/book"
            className="inline-block bg-accent hover:bg-accent-hover text-white font-semibold px-10 py-3 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          >
            Book Now
          </Link>
        </FadeUp>
      </section>
    </div>
  );
}
