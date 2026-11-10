import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "citizenship-test.online", template: "%s | citizenship-test.online" },
  description: "Free citizenship test practice for the US, UK, Canada and Australia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-base-100 focus:p-2"
        >
          Skip to content
        </a>
        <header className="border-b border-base-300">
          <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
            <Link href="/" className="font-bold">
              citizenship-test.online
            </Link>
          </div>
        </header>
        <div id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
          {children}
        </div>
        <footer className="border-t border-base-300">
          <p className="mx-auto max-w-3xl px-4 py-4 text-sm">
            Not affiliated with any government. Always check the official source for current rules.
          </p>
        </footer>
      </body>
    </html>
  );
}
