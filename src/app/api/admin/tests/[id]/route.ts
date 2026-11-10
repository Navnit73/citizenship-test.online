import { adminRoute, noContent, readJson } from "@/lib/api/admin-route";
import { invalidate } from "@/lib/api/revalidate";
import { deleteTest, getTest, updateTest } from "@/lib/cms/tests";

export const GET = adminRoute("test:write", (actor, _req, { id }) => getTest(actor, id));
export const PATCH = adminRoute("test:write", async (actor, req, { id }) => {
  const t = await updateTest(actor, id, (await readJson(req)) as never);
  invalidate("tests");
  return t;
});
export const DELETE = adminRoute("test:write", async (actor, _req, { id }) => {
  await deleteTest(actor, id);
  invalidate("tests");
  return noContent();
});
