import { adminRoute, created, readJson } from "@/lib/api/admin-route";
import { invalidate } from "@/lib/api/revalidate";
import { createPost, listPosts } from "@/lib/cms/posts";
import type { POST_TYPES } from "@/lib/db/models";

export const GET = adminRoute("post:write-own", async (actor, req) => {
  const p = new URL(req.url).searchParams;
  return listPosts(actor, {
    type: (p.get("type") as (typeof POST_TYPES)[number]) ?? undefined,
    status: p.get("status") ?? undefined,
    q: p.get("q") ?? undefined,
    page: Number(p.get("page")) || undefined,
    limit: Number(p.get("limit")) || undefined,
  });
});

export const POST = adminRoute("post:write-own", async (actor, req) => {
  const post = await createPost(actor, (await readJson(req)) as never);
  invalidate("posts");
  return created(post);
});
