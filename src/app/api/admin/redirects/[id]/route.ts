import { adminRoute, noContent } from "@/lib/api/admin-route";
import { invalidate } from "@/lib/api/revalidate";
import { deleteRedirect } from "@/lib/cms/redirects";

export const DELETE = adminRoute("redirect:write", async (actor, _req, { id }) => {
  await deleteRedirect(actor, id);
  invalidate("redirects");
  return noContent();
});
