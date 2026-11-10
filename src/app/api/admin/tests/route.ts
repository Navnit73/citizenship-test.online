import { adminRoute, created, readJson } from "@/lib/api/admin-route";
import { invalidate } from "@/lib/api/revalidate";
import { createTest, listTests } from "@/lib/cms/tests";

export const GET = adminRoute("test:write", (actor, req) => {
  const p = new URL(req.url).searchParams;
  return listTests(actor, {
    countryCode: p.get("countryCode") ?? undefined,
    page: Number(p.get("page")) || undefined,
  });
});

export const POST = adminRoute("test:write", async (actor, req) => {
  const t = await createTest(actor, (await readJson(req)) as never);
  invalidate("tests");
  return created(t);
});
