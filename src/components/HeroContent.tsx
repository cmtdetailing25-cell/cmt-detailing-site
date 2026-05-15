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
      className="relative z-10 w-full"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.h1
        variants={item}
        className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight max-w-3xl mx-auto mb-4 sm:mb-6"
      >
        Mobile Detailing Done Right
      </motion.h1>

      <motion.p
        variants={item}
        className="text-gray-300 text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-8 sm:mb-10"
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
          className="bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 font-semibold px-8 py-3 rounded-lg transition-all duration-200"
        >
          View Services
        </Link>
      </motion.div>
    </motion.div>
  );
}
