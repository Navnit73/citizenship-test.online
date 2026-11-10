import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { addHeadingIds } from "@/lib/cms/toc";
import { POST_BASE_PATH, POST_LABEL, postPath, type PublicPostType } from "@/lib/cms/paths";
import { getPublicPost, listPublicPosts } from "@/lib/cms/public";
import { articleLd } from "@/lib/seo/schema";
import { buildMetadata, truncate } from "@/lib/seo/metadata";
import { slotTarget } from "@/lib/site/country-pages";
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

async function PostList({ type, title }: { type: PublicPostType; title: string }) {
  const posts = await listPublicPosts(type);
  return (
    <main>
      <h1 className="mb-6 text-3xl font-bold">{title}</h1>
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
    </main>
  );
}

export function PostListPage(props: { type: PublicPostType; title: string }) {
  return (
    <Suspense fallback={<PageFallback />}>
      <PostList {...props} />
    </Suspense>
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
  });
}
