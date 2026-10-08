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
    <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:"(()=>{const root=document.documentElement;const nav=performance.getEntriesByType('navigation')[0];let seen=false;try{seen=sessionStorage.getItem('poudev-intro-seen')==='1';sessionStorage.setItem('poudev-intro-seen','1');}catch{}root.dataset.loadingMode=seen&&nav?.type!=='navigate'?'simple':'intro';root.dataset.loadingStarted=String(performance.now());root.classList.add('site-loading');})();"}}/></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

