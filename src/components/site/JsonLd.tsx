import { serializeLd } from "@/lib/seo/schema";

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeLd(data) }} />
  );
}
