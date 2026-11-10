import { adminRoute } from "@/lib/api/admin-route";
import { listUsers } from "@/lib/cms/users";

export const GET = adminRoute("user:manage", (actor) => listUsers(actor));
