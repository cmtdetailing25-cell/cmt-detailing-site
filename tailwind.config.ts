import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CMT Detailing brand accent
        accent: {
          DEFAULT: "#4a7bc4",
          hover: "#385f9a",
          light: "#7aa3d8",
        },
        // CMT brand palette
        cmt: {
          dark:   "#151b23", // header / nav background
          light:  "#e9f0ef", // primary text on dark
          muted:  "#708289", // secondary / muted text
          border: "#434e56", // dividers, borders
          subtle: "#94b2b6", // inactive links, accents
        },
      },
      fontFamily: {
        sans: ["var(--font-canva-sans)", "sans-serif"],
        display: ["var(--font-montserrat)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
