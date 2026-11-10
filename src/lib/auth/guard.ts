import { can, type Permission, type Role } from "./permissions";

export type { Role } from "./permissions";

const forbidden = () => Response.json({ error: "Forbidden" }, { status: 403 });

/** Returns a 403 Response unless the caller is staff (admin, editor or author). */
export function guardAdminApi(role: Role | undefined): Response | null {
  return can(role, "admin:access") ? null : forbidden();
}

/** Returns a 403 Response unless the role holds the permission. */
export function guardPermission(role: Role | undefined, permission: Permission): Response | null {
  return can(role, permission) ? null : forbidden();
}
