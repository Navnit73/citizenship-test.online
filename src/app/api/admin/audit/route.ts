import { adminRoute } from "@/lib/api/admin-route";
import { listAudit } from "@/lib/cms/audit";

export const GET = adminRoute("audit:read", (actor, req) =>
  listAudit(actor, { limit: Number(new URL(req.url).searchParams.get("limit")) || undefined }),
);
