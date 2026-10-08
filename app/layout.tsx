import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POUDEV — Независимая веб-студия",
  description: "Дизайн и разработка сайтов. Создаём с нуля, переосмысляем и развиваем существующие проекты.",
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
    <html lang="ru" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:"(()=>{const root=document.documentElement;const nav=performance.getEntriesByType('navigation')[0];let seen=false;try{seen=sessionStorage.getItem('poudev-intro-seen')==='1';sessionStorage.setItem('poudev-intro-seen','1');}catch{}root.dataset.loadingMode=seen&&nav?.type!=='navigate'?'simple':'intro';root.dataset.loadingStarted=String(performance.now());root.classList.add('site-loading');})();"}}/></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

