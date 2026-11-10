/** Styles CMS rich text (already sanitised) with Tailwind arbitrary variants. */
export function Prose({ html }: { html: string }) {
  return (
    <div
      className="max-w-none [&_a]:link [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_h2]:mt-6 [&_h2]:scroll-mt-20 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:scroll-mt-20 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:ml-6 [&_ol]:list-decimal [&_p]:my-3 [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
