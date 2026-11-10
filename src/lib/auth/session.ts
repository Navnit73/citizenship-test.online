import { auth } from "@/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/cms/errors";
import { can, type Actor, type Permission } from "./permissions";

/** Resolves the signed-in staff member or throws 401/403. */
export async function requireActor(permission: Permission): Promise<Actor> {
  const session = await auth();
  const id = session?.user?.id;
  const role = session?.user?.role;
  if (!id || !role) throw new UnauthorizedError();
  if (!can(role, permission)) throw new ForbiddenError();
  return { id, role };
}
