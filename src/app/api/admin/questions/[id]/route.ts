import { adminRoute, noContent, readJson } from "@/lib/api/admin-route";
import { invalidate } from "@/lib/api/revalidate";
import { deleteQuestion, getQuestion, updateQuestion } from "@/lib/cms/questions";

export const GET = adminRoute("question:write", (actor, _req, { id }) => getQuestion(actor, id));

export const PATCH = adminRoute("question:write", async (actor, req, { id }) => {
  const q = await updateQuestion(actor, id, (await readJson(req)) as never);
  invalidate("questions");
  return q;
});

export const DELETE = adminRoute("question:write", async (actor, _req, { id }) => {
  await deleteQuestion(actor, id);
  invalidate("questions");
  return noContent();
});
