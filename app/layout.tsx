// app/layout.tsx
import type { Metadata } from "next";
import { fontSans, fontHeadings } from "@/config/fonts";
import { Providers } from "./providers";
import { ToastProvider } from "@heroui/react"; // <-- Importar
import clsx from "clsx";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: "Calculadora Colas | UNIMAR", template: `%s | Calculadora Colas` }, // Título ajustado
  description: "Calculadora de modelos de líneas de espera M/M/1.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={clsx(
          "min-h-screen font-sans antialiased bg-unimar-background text-unimar-textDark", // <-- Aplicar colores base
          fontSans.variable,
          fontHeadings.variable
        )}
      >
        <Providers>
          <ToastProvider placement="top-right"/> 
            {children}      
        </Providers>
      </body>
    </html>
  );
}