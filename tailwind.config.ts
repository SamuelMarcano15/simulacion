// tailwind.config.ts (CORREGIDO Y FINAL)
import { heroui } from "@heroui/react";
import { tailwindColors } from "./app/styles/colors";
import type { Config } from 'tailwindcss'; 

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: { ...tailwindColors },
      fontFamily: {
        sans: "var(--font-sans)",
        headings: "var(--font-headings)",
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};

export default config;