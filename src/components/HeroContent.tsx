"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";

export default function HeroContent() {
  const reduced = useReducedMotion();

  const container: Variants = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: reduced ? 0 : 0.1,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.6, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      className="relative z-10"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.p
        variants={item}
        className="text-gray-400 text-xs font-semibold uppercase tracking-[0.2em] mb-5"
      >
        Taunton, MA &amp; Surrounding Areas
      </motion.p>

      <motion.h1
        variants={item}
        className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight max-w-3xl mb-6"
      >
        Mobile Detailing Done Right
      </motion.h1>

      <motion.p
        variants={item}
        className="text-gray-300 text-base md:text-lg max-w-2xl leading-relaxed mb-10"
      >
        Clean, consistent, professional detailing — brought directly to your
        driveway. CMT Detailing serves Taunton, MA and surrounding areas with
        high-quality interior, exterior, and premium detailing services.
      </motion.p>

      <motion.div
        variants={item}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <Link
          href="/book"
          className="bg-accent hover:bg-accent-hover text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Book Now
        </Link>
        <Link
          href="/services"
          className="border-2 border-accent text-accent-light hover:bg-accent/10 font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          View Services
        </Link>
      </motion.div>
    </motion.div>
  );
}
