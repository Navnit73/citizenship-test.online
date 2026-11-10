import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/site/Analytics";
import { CookieBanner } from "@/components/site/CookieBanner";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SITE_URL } from "@/lib/site/config";

// `optional`: never swap fonts after first paint, which keeps LCP and CLS stable.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "optional" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "citizenship-test.online", template: "%s | citizenship-test.online" },
  description: "Free citizenship test practice for the US, UK, Canada and Australia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-base-100 focus:p-2"
        >
          Skip to content
        </a>
        <SiteHeader />
        <div id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </div>
        <SiteFooter />
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
