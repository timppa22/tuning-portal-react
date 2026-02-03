import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/app/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Tuning Portal",
    template: "%s | Tuning Portal",
  },
  description: "Professional automotive tuning services at tuning-portal.eu",
  keywords: [
    "car tuning",
    "automotive tuning",
    "ECU remapping",
    "performance tuning",
    "chip tuning",
  ],
  authors: [{ name: "Tuning Portal Team" }],
  creator: "Tuning Portal",
  publisher: "Tuning Portal",
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  metadataBase: new URL("https://tuning-portal.eu"),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-US",
      "de-DE": "/de-DE",
    },
  },
  openGraph: {
    title: "Tuning Portal - Professional Automotive Tuning Services",
    description: "Expert automotive tuning services for optimal vehicle performance",
    url: "https://tuning-portal.eu",
    siteName: "Tuning Portal",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://tuning-portal.eu/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Tuning Portal - Professional Automotive Tuning",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tuning Portal - Professional Automotive Tuning Services",
    description: "Expert automotive tuning services for optimal vehicle performance",
    creator: "@tuningportal",
    images: ["https://tuning-portal.eu/images/twitter-image.jpg"],
  },

};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 ease-in-out`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
