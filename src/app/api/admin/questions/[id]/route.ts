import { adminRoute, noContent, readJson } from "@/lib/api/admin-route";
import { deleteQuestion, getQuestion, updateQuestion } from "@/lib/cms/questions";

export const GET = adminRoute("question:write", (actor, _req, { id }) => getQuestion(actor, id));
export const PATCH = adminRoute("question:write", async (actor, req, { id }) =>
  updateQuestion(actor, id, (await readJson(req)) as never),
);
export const DELETE = adminRoute("question:write", async (actor, _req, { id }) => {
  await deleteQuestion(actor, id);
  return noContent();
});
