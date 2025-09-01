import { Inter, Plus_Jakarta_Sans } from "next/font/google";

export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const fontHeadings = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-headings",
});