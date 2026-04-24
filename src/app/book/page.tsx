import BookingForm from "@/components/BookingForm";
import FadeUp from "@/components/FadeUp";

export default function BookPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <FadeUp className="text-center mb-10">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.2em] mb-3">
            Get Started
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Request a Booking
          </h1>
          <p className="text-zinc-400 leading-relaxed">
            Tell us about your vehicle and we&apos;ll help you find the right
            service. Takes about 2 minutes.
          </p>
          <p className="text-zinc-600 text-sm mt-3">
            Mobile service &middot; Taunton, MA &amp; surrounding areas
          </p>
        </FadeUp>

        <FadeUp delay={0.15} className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 rounded-2xl p-8">
          <BookingForm />
        </FadeUp>
      </div>
    </div>
  );
}
