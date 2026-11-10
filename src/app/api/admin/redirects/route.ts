import { adminRoute, created, readJson } from "@/lib/api/admin-route";
import { invalidate } from "@/lib/api/revalidate";
import { createRedirect, listRedirects } from "@/lib/cms/redirects";

export const GET = adminRoute("redirect:write", (actor) => listRedirects(actor));
export const POST = adminRoute("redirect:write", async (actor, req) => {
  const r = await createRedirect(actor, (await readJson(req)) as never);
  invalidate("redirects");
  return created(r);
});
