import type { Metadata } from "next";
import { fontSans, fontHeadings } from "@/config/fonts";
import { Providers } from "./providers";
import clsx from "clsx";
import "@/styles/globals.css"; 

export const metadata: Metadata = {
  title: { default: "Elara", template: `%s | Elara` },
  description: "Herramienta de estudio inteligente para Ingeniería de Sistemas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={clsx(
          "min-h-screen font-sans antialiased",
          fontSans.variable,
          fontHeadings.variable
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}