import type { Metadata } from "next";
import { SITE_NAME } from "./schema";

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

type Options = {
  title: string;
  path: string;
  description?: string;
  noindex?: boolean;
  type?: "website" | "article";
};

/** Canonical URLs are relative; `metadataBase` in the root layout makes them absolute. */
export function buildMetadata({
  title,
  path,
  description,
  noindex,
  type = "website",
}: Options): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type, siteName: SITE_NAME },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}
