import { adminRoute, noContent, readJson } from "@/lib/api/admin-route";
import { invalidate } from "@/lib/api/revalidate";
import { deletePost, getPost, updatePost } from "@/lib/cms/posts";

export const GET = adminRoute("post:write-own", (actor, _req, { id }) => getPost(actor, id));

export const PATCH = adminRoute("post:write-own", async (actor, req, { id }) => {
  const post = await updatePost(actor, id, (await readJson(req)) as never);
  invalidate("posts");
  return post;
});

export const DELETE = adminRoute("post:delete", async (actor, _req, { id }) => {
  await deletePost(actor, id);
  invalidate("posts");
  return noContent();
});
