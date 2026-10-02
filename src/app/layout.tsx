import type { Metadata } from "next";
import "./globals.css";
import { galleryLocale } from "@/features/tarot/lib/server-language";

export const metadata: Metadata = {
  title: "Tarotler",
  description: "Explore all 78 Rider–Waite–Smith tarot cards.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={await galleryLocale()}>
      <head>
        <link rel="preload" as="image" href="/cards/RWSa-T-00-800.webp" imageSrcSet="/cards/RWSa-T-00-600.webp 600w, /cards/RWSa-T-00-800.webp 800w, /cards/RWSa-T-00.webp 1086w" imageSizes="(max-width: 600px) 69vw, 366px" fetchPriority="high" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
