import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POUDEV — Web Studio",
  description: "Independent web studio for thoughtful website design, content, and development.",
  icons: {
    icon: "/favicon.svg?v=3",
    shortcut: "/favicon.svg?v=3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning><head><link rel="preload" href="/fonts/golos-0.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

