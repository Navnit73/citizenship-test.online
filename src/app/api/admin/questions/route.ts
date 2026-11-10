import { adminRoute, created, readJson } from "@/lib/api/admin-route";
import { createQuestion, listQuestions } from "@/lib/cms/questions";

export const GET = adminRoute("question:write", (actor, req) => {
  const p = new URL(req.url).searchParams;
  return listQuestions(actor, {
    countryCode: p.get("countryCode") ?? undefined,
    chapterId: p.get("chapterId") ?? undefined,
    status: p.get("status") ?? undefined,
    tag: p.get("tag") ?? undefined,
    q: p.get("q") ?? undefined,
    page: Number(p.get("page")) || undefined,
    limit: Number(p.get("limit")) || undefined,
  });
});

export const POST = adminRoute("question:write", async (actor, req) =>
  created(await createQuestion(actor, (await readJson(req)) as never)),
);
