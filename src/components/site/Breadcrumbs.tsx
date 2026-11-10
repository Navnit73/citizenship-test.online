import Link from "next/link";
import { breadcrumbLd } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/site/config";
import { JsonLd } from "./JsonLd";

export type Crumb = { name: string; path: string };

/** Visible trail plus BreadcrumbList markup. The last crumb is the current page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <ol className="flex flex-wrap gap-x-2">
          {items.map((c, i) => (
            <li key={c.path} className="flex gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i === items.length - 1 ? (
                <span aria-current="page">{c.name}</span>
              ) : (
                <Link href={c.path} className="link">
                  {c.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbLd(SITE_URL, items)} />
    </>
  );
}
