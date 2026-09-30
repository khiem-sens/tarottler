import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tarottler",
  description: "Explore all 78 Rider–Waite–Smith tarot cards.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/saans-regular.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/neue-haas-display-light.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" as="image" href="/cards/RWSa-T-00-800.webp" imageSrcSet="/cards/RWSa-T-00-600.webp 600w, /cards/RWSa-T-00-800.webp 800w, /cards/RWSa-T-00.webp 1086w" imageSizes="(max-width: 600px) 69vw, 366px" fetchPriority="high" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
