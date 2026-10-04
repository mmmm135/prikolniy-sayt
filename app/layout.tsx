import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POUDEV — Сайты с характером",
  description: "Дизайн и разработка сайтов. Создаём с нуля, переосмысляем и развиваем существующие проекты.",
  other: {
    "codex-preview": "development",
  },
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
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
