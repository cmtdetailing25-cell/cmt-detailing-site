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
        // CMT Detailing brand accent — see docs/design-brief.md
        accent: {
          DEFAULT: "#426db6", // primary — buttons, borders, badges
          hover: "#355185",   // darker — hover states
          light: "#6f8fd1",   // lighter — text links, labels
        },
      },
    },
  },
  plugins: [],
};

export default config;
