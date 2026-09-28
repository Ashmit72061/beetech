import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Honey Chain · Trusted from hive to home",
    template: "%s · Honey Chain",
  },
  description: "Verifiable honey provenance, responsible sourcing and trusted marketplace access across India.",
  icons: {
    icon: "/BeeTech.png",
    apple: "/BeeTech.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f8f5ed",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
