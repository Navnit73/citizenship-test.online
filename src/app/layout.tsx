import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/site/Analytics";
import { CookieBanner } from "@/components/site/CookieBanner";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SITE_NAME } from "@/lib/seo/schema";
import { INDEXABLE, SITE_URL } from "@/lib/site/config";

// `optional`: never swap fonts after first paint, which keeps LCP and CLS stable.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "optional" });

const DESCRIPTION = "Free citizenship test practice for the US, UK, Canada and Australia.";

/**
 * Site-wide defaults. Pages override these via `buildMetadata` (lib/seo/metadata), which
 * sets its own canonical, Open Graph and Twitter fields so nothing is inherited by accident.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en", description: DESCRIPTION },
  twitter: { card: "summary_large_image" },
  // Non-production deployments (previews, staging, localhost) must never be indexed.
  robots: INDEXABLE ? undefined : { index: false, follow: false },
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
