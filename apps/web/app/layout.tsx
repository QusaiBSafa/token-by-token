import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://token-by-token.vercel.app"),
  title: { default: "Token by Token: learn AI engineering by watching it move", template: "%s · Token by Token" },
  description: "An animated course that explains how AI systems work, one token at a time. Foundations are free.",
  openGraph: { title: "Token by Token", description: "Learn AI engineering by watching it move.", type: "website" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const themeScript = `try{var t=localStorage.getItem("tbt:theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="sr-only">Skip to content</a>
        <SiteHeader />
        <div id="main">{children}</div>
        <footer className="site-footer">
          <div className="wrap">Token by Token — learn how AI systems work, one token at a time. Foundations are free.</div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
