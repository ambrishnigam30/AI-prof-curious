import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import "./globals.css";

/**
 * Inter — closest available Google Font to SF Pro.
 * Optical sizing enabled for Apple-like typography behavior.
 * SF Pro itself is not available on Google Fonts, so Inter is the
 * industry-standard substitute with matching metrics.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Prof. Curious — AI Tutor for CBSE & ICSE Students",
    template: "%s | Prof. Curious",
  },
  description:
    "Learn like your best teacher is always free. AI-powered tutoring for Indian students in Classes 8–10 with bilingual support, adaptive learning, and Socratic guidance.",
  keywords: [
    "CBSE",
    "ICSE",
    "AI tutor",
    "online learning",
    "India education",
    "Class 9",
    "Class 10",
    "math help",
    "Prof Curious",
  ],
  authors: [{ name: "Prof. Curious" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Prof. Curious",
    title: "Prof. Curious — AI Tutor for CBSE & ICSE Students",
    description:
      "Learn like your best teacher is always free. AI-powered tutoring with bilingual support.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
