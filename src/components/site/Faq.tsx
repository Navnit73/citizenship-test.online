import { faqLd } from "@/lib/seo/schema";
import type { FaqItem } from "@/lib/site/exam-describe";
import { JsonLd } from "./JsonLd";

export function Faq({ items, id = "faq" }: { items: FaqItem[]; id?: string }) {
  return (
    <section aria-labelledby={`${id}-heading`} id={id}>
      <h2 id={`${id}-heading`} className="mb-3 text-2xl font-bold">
        Frequently asked questions
      </h2>
      <div className="space-y-2">
        {items.map((f) => (
          <details key={f.q} className="rounded border border-base-300 p-3">
            <summary className="cursor-pointer font-medium">{f.q}</summary>
            <p className="mt-2">{f.a}</p>
          </details>
        ))}
      </div>
      <JsonLd data={faqLd(items)} />
    </section>
  );
}
