import type { TocItem } from "@/lib/cms/toc";

export function Toc({ items }: { items: Pick<TocItem, "id" | "text">[] }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label="On this page" className="my-6 rounded border border-base-300 p-4">
      <p className="mb-2 font-semibold">On this page</p>
      <ul className="space-y-1">
        {items.map((t) => (
          <li key={t.id}>
            <a href={`#${t.id}`} className="link">
              {t.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
