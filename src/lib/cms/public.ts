/**
 * Request-time wrappers around the cached reads in `lib/site/data`. Each one
 * opts into dynamic rendering first, so nothing touches the DB during the build.
 */
import { connection } from "next/server";
import "@/lib/db/models";
import { connectDb } from "@/lib/db/connect";
import { postsRepo } from "@/lib/db/repos/posts";
import { testsRepo } from "@/lib/db/repos/tests";
import {
  getPostBySlug,
  getPostList,
  getTestBySlug,
  getTestList,
  type PostCard,
  type PostPage,
} from "@/lib/site/data";
import type { PublicPostType } from "./paths";

export type { PostCard, PostPage };

export async function getPublicPost(type: PublicPostType, slug: string) {
  await connection();
  return getPostBySlug(type, slug);
}

export async function listPublicPosts(type: PublicPostType) {
  await connection();
  return getPostList(type);
}

export async function listPublicTests() {
  await connection();
  return getTestList();
}

export async function getPublicTest(slug: string) {
  await connection();
  return getTestBySlug(slug);
}

/** Mongoose adds `updatedAt` via `timestamps`, but InferSchemaType omits it. */
const updated = (doc: object) => (doc as { updatedAt?: Date }).updatedAt;

const ALL_TYPES = ["blog", "guide", "howto", "legal", "page"] as const;

/** Everything CMS-driven that belongs in the sitemap (noindex posts excluded). */
export async function listSitemapEntries() {
  await connection();
  await connectDb();
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
          countryCode: p.countryCode ?? undefined,
          lastModified: updated(p) ?? p.publishedAt ?? undefined,
        })),
    ),
    tests: tests.map((t) => ({ slug: t.slug, lastModified: updated(t) })),
  };
}
