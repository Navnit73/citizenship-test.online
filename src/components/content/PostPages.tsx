import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { addHeadingIds } from "@/lib/cms/toc";
import { POST_BASE_PATH, POST_LABEL, postPath, type PublicPostType } from "@/lib/cms/paths";
import { getPublicPost, listPublicPosts } from "@/lib/cms/public";
import { articleLd } from "@/lib/seo/schema";
import { buildMetadata, truncate } from "@/lib/seo/metadata";
import { COUNTRY_CODES, isCountryCode } from "@/lib/countries";
import type { CountryCode } from "@/lib/engine/types";
import { getCountryPage, hubPage, hubPath, slotTarget } from "@/lib/site/country-pages";
import { SITE_URL } from "@/lib/site/config";
import { PageFallback } from "@/components/site/PageFallback";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { Prose } from "@/components/site/Prose";
import { Toc } from "@/components/site/Toc";
import { DynamicMarker } from "./DynamicMarker";

const fmt = (d?: string | Date | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })
    : "";

/** Copy for the /blog, /guides, /how-to and /legal index pages. */
export const LISTING: Record<
  Exclude<PublicPostType, "page">,
  { title: string; heading: string; description: string }
> = {
  blog: {
    title: "Citizenship test blog",
    heading: "Citizenship test blog",
    description:
      "News and articles on citizenship tests in the US, UK, Canada and Australia, including rule changes, study tips and what to expect on test day.",
  },
  guide: {
    title: "Citizenship test guides",
    heading: "Citizenship test guides",
    description:
      "In-depth guides to the US, UK, Canadian and Australian citizenship tests: what each test covers, how it is scored and how to prepare.",
  },
  howto: {
    title: "How-to guides for the citizenship process",
    heading: "How-to guides",
    description:
      "Step-by-step guides to booking, applying for and preparing for citizenship tests in the US, UK, Canada and Australia.",
  },
  legal: {
    title: "Legal information and policies",
    heading: "Legal information",
    description:
      "The disclaimer, editorial and accuracy policy, cookie policy and other legal information for citizenship-test.online.",
  },
};

async function PostList({ type }: { type: Exclude<PublicPostType, "page"> }) {
  const posts = await listPublicPosts(type);
  const copy = LISTING[type];
  return (
    <main>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: POST_LABEL[type], path: POST_BASE_PATH[type] },
        ]}
      />
      <h1 className="mb-3 text-3xl font-bold">{copy.heading}</h1>
      <p className="mb-6 max-w-2xl">{copy.description}</p>
      {posts.length === 0 ? (
        <p>Nothing published yet.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((p) => (
            <li key={p.slug}>
              <h2 className="text-xl font-semibold">
                <Link href={p.path} className="link">
                  {p.title}
                </Link>
              </h2>
              {p.excerpt && <p>{p.excerpt}</p>}
              {p.publishedAt && <p className="text-sm opacity-80">{fmt(p.publishedAt)}</p>}
            </li>
          ))}
        </ul>
      )}
      {type !== "legal" && <CountryLinks />}
    </main>
  );
}

export function PostListPage(props: { type: Exclude<PublicPostType, "page"> }) {
  return (
    <Suspense fallback={<PageFallback />}>
      <PostList {...props} />
    </Suspense>
  );
}

/** Index pages stay out of search results until they list something. */
export async function listingMetadata(type: Exclude<PublicPostType, "page">): Promise<Metadata> {
  const posts = await listPublicPosts(type);
  const copy = LISTING[type];
  return buildMetadata({
    title: copy.title,
    description: copy.description,
    path: POST_BASE_PATH[type],
    noindex: posts.length === 0,
  });
}

/** Practice-test links for every country: the main conversion path from any article. */
function CountryLinks({ only }: { only?: CountryCode }) {
  const codes = only ? [only] : COUNTRY_CODES;
  return (
    <aside
      aria-labelledby="practice-links-heading"
      className="mt-10 rounded border border-base-300 p-4"
    >
      <h2 id="practice-links-heading" className="mb-2 text-xl font-semibold">
        {only ? `Prepare for the ${hubPage(only).label}` : "Practise for your citizenship test"}
      </h2>
      <ul className="list-disc space-y-1 pl-6">
        {codes.map((c) => (
          <li key={c}>
            <Link href={`/${c}/practice-test`} className="link">
              {getCountryPage(c, "practice-test")!.heading}
            </Link>
            {" · "}
            <Link href={hubPath(c)} className="link">
              {hubPage(c).label} rules and format
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

async function PostDetail({ type, slug }: { type: PublicPostType; slug: string }) {
  const post = await getPublicPost(type, slug);
  if (!post) notFound();
  const { html, toc } = addHeadingIds(post.body);
  const path = postPath(type, slug);
  const crumbs = [
    { name: "Home", path: "/" },
    ...(type !== "page" ? [{ name: POST_LABEL[type], path: POST_BASE_PATH[type] }] : []),
    { name: post.title, path },
  ];
  return (
    <main>
      <Breadcrumbs items={crumbs} />
      <article>
        <h1 className="mb-2 text-3xl font-bold">{post.title}</h1>
        {post.publishedAt && (
          <p className="mb-2 text-sm opacity-80">Published {fmt(post.publishedAt)}</p>
        )}
        {post.updatedAt && post.updatedAt !== post.publishedAt && (
          <p className="mb-4 text-sm opacity-80">Updated {fmt(post.updatedAt)}</p>
        )}
        <Toc items={toc} />
        <Prose html={html} />
      </article>
      {type !== "legal" && (
        <CountryLinks
          only={post.countryCode && isCountryCode(post.countryCode) ? post.countryCode : undefined}
        />
      )}
      {type !== "legal" && type !== "page" && (
        <JsonLd
          data={articleLd(SITE_URL, {
            title: post.title,
            path,
            description: post.seo?.description || post.excerpt,
            publishedAt: post.publishedAt ? new Date(post.publishedAt) : undefined,
            updatedAt: post.updatedAt ? new Date(post.updatedAt) : undefined,
          })}
        />
      )}
    </main>
  );
}

async function PostDetailFromParams({
  type,
  params,
}: {
  type: PublicPostType;
  params: Promise<{ slug: string }>;
}) {
  return <PostDetail type={type} slug={(await params).slug} />;
}

export function PostDetailPage({
  type,
  params,
}: {
  type: PublicPostType;
  params: Promise<{ slug: string }>;
}) {
  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <PostDetailFromParams type={type} params={params} />
      </Suspense>
      <DynamicMarker />
    </>
  );
}

export async function postMetadata(
  type: PublicPostType,
  params: Promise<{ slug: string }>,
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicPost(type, slug);
  if (!post) return { title: "Not found", robots: { index: false } };
  // A country page's CMS body lives at its country URL; this copy must not compete with it.
  const slot = type === "page" ? slotTarget(slug) : null;
  return buildMetadata({
    title: post.seo?.title || post.title,
    description: truncate(post.seo?.description || post.excerpt || "", 160) || undefined,
    path: slot ?? postPath(type, slug),
    noindex: !!post.seo?.noindex || !!slot,
    type: type === "blog" || type === "guide" || type === "howto" ? "article" : "website",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  });
}
