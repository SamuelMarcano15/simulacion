// tailwind.config.ts
import { heroui } from "@heroui/react";
// Importa el objeto 'colors' completo, no solo 'tailwindColors'
import { colors } from "./app/styles/colors";
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Verifica si esta es la ruta correcta para HeroUI, a veces es @heroui/react/dist/...
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Incluye el objeto 'unimar' completo para poder usar unimar-primary, etc.
        unimar: colors.unimar,
        // Puedes incluir los otros si los necesitas también
        status: colors.status,
        gray: colors.gray,
        base: colors.base
        // NOTA: Si también quieres usar 'primary' directamente (ej. text-primary),
        // puedes añadirlo aquí mapeándolo:
        // primary: colors.unimar.primary,
        // secondary: colors.unimar.secondary,
      },
      fontFamily: {
        sans: "var(--font-sans)",
        headings: "var(--font-headings)",
      },
    },
  },
  darkMode: "class",
  plugins: [heroui({
    // Opcional: Si quieres que los componentes HeroUI usen tus colores por defecto
    // themes: {
    //   light: {
    //     colors: {
    //       primary: colors.unimar.primary,
    //       secondary: colors.unimar.secondary,
    //     }
    //   }
    // }
  })],
};

export default config;