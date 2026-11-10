import { connection } from "next/server";
import { connectDb } from "@/lib/db/connect";
import "@/lib/db/models";
import { postsRepo } from "@/lib/db/repos/posts";
import { testsRepo } from "@/lib/db/repos/tests";
import type { PublicPostType } from "./paths";
import { sanitizeRichText } from "./sanitize";

/** Mongoose adds `updatedAt` via `timestamps`, but InferSchemaType omits it. */
const updated = (doc: object) => (doc as { updatedAt?: Date }).updatedAt;

/** Opt into request-time rendering, then make sure Mongo is connected. */
async function ready() {
  await connection();
  await connectDb();
}

export type PublicPost = {
  title: string;
  slug: string;
  type: PublicPostType;
  excerpt?: string;
  body: string;
  publishedAt?: Date;
  updatedAt?: Date;
  seo?: { title?: string; description?: string; noindex?: boolean };
};

export async function getPublicPost(
  type: PublicPostType,
  slug: string,
): Promise<PublicPost | null> {
  await ready();
  const p = await postsRepo.findPublishedBySlug(type, slug);
  if (!p) return null;
  return {
    title: p.title,
    slug: p.slug,
    type,
    excerpt: p.excerpt ?? undefined,
    body: sanitizeRichText(p.body), // defence in depth: also sanitised on save
    publishedAt: p.publishedAt ?? undefined,
    updatedAt: updated(p),
    seo: p.seo
      ? {
          title: p.seo.title ?? undefined,
          description: p.seo.description ?? undefined,
          noindex: p.seo.noindex ?? undefined,
        }
      : undefined,
  };
}

export async function listPublicPosts(type: PublicPostType) {
  await ready();
  const posts = await postsRepo.listPublished(type);
  return posts.map((p) => ({
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt ?? undefined,
    publishedAt: p.publishedAt ?? undefined,
  }));
}

export async function listPublicTests() {
  await ready();
  const tests = await testsRepo.listPublished();
  return tests.map((t) => ({
    title: t.title,
    slug: t.slug,
    countryCode: t.countryCode,
    kind: t.kind,
  }));
}

export async function getPublicTest(slug: string) {
  await ready();
  const t = await testsRepo.findPublishedBySlug(slug);
  return t
    ? { title: t.title, slug: t.slug, countryCode: t.countryCode, seo: t.seo ?? undefined }
    : null;
}

const ALL_TYPES = ["blog", "guide", "howto", "legal", "page"] as const;

/** Everything CMS-driven that belongs in the sitemap (noindex posts excluded). */
export async function listSitemapEntries() {
  await ready();
  const [lists, tests] = await Promise.all([
    Promise.all(ALL_TYPES.map((t) => postsRepo.listPublished(t))),
    testsRepo.listPublished(),
  ]);
  return {
    posts: lists.flatMap((list, i) =>
      list
        .filter((p) => !p.seo?.noindex)
        .map((p) => ({
          type: ALL_TYPES[i],
          slug: p.slug,
          lastModified: updated(p) ?? p.publishedAt ?? undefined,
        })),
    ),
    tests: tests.map((t) => ({ slug: t.slug, lastModified: updated(t) })),
  };
}
