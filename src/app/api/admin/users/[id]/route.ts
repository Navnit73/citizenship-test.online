import { z } from "zod";
import { adminRoute, readJson } from "@/lib/api/admin-route";
import { parse } from "@/lib/cms/shared";
import { setUserRole } from "@/lib/cms/users";

const bodySchema = z.object({ role: z.enum(["admin", "editor", "author", "user"]) });

export const PATCH = adminRoute("user:manage", async (actor, req, { id }) => {
  const { role } = parse(bodySchema, await readJson(req));
  return setUserRole(actor, id, role);
});
