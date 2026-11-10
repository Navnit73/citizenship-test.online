import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { POST_BASE_PATH, postPath, type PublicPostType } from "@/lib/cms/paths";
import { getPublicPost, listPublicPosts } from "@/lib/cms/public";
import { DynamicMarker } from "./DynamicMarker";

const fmt = (d?: Date) =>
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
                <Link href={postPath(type, p.slug)} className="link">
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
    <Suspense fallback={<p role="status">Loading…</p>}>
      <PostList {...props} />
    </Suspense>
  );
}

async function PostDetail({ type, slug }: { type: PublicPostType; slug: string }) {
  const post = await getPublicPost(type, slug);
  if (!post) notFound();
  return (
    <main>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <Link href="/" className="link">
          Home
        </Link>{" "}
        /{" "}
        {type !== "page" ? (
          <>
            <Link href={POST_BASE_PATH[type]} className="link">
              {{ blog: "Blog", guide: "Guides", howto: "How-to", legal: "Legal" }[type]}
            </Link>{" "}
            /{" "}
          </>
        ) : null}
        {post.title}
      </nav>
      <article>
        <h1 className="mb-2 text-3xl font-bold">{post.title}</h1>
        {post.publishedAt && (
          <p className="mb-6 text-sm opacity-80">Published {fmt(post.publishedAt)}</p>
        )}
        <div
          className="prose max-w-none [&_a]:link [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:ml-6 [&_ol]:list-decimal [&_p]:my-3 [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      </article>
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
      <Suspense fallback={<p role="status">Loading…</p>}>
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
  return {
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt,
    alternates: { canonical: postPath(type, slug) },
    robots: post.seo?.noindex ? { index: false, follow: false } : undefined,
  };
}
