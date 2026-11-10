export type Role = "admin" | "editor" | "author" | "user";

export type Permission =
  | "admin:access"
  | "post:write-own"
  | "post:write-any"
  | "post:publish"
  | "post:delete"
  | "question:write"
  | "test:write"
  | "redirect:write"
  | "user:manage"
  | "audit:read";

const EDITOR: Permission[] = [
  "admin:access",
  "post:write-own",
  "post:write-any",
  "post:publish",
  "post:delete",
  "question:write",
  "test:write",
  "redirect:write",
];

const MATRIX: Record<Role, Permission[]> = {
  admin: [...EDITOR, "user:manage", "audit:read"],
  editor: EDITOR,
  author: ["admin:access", "post:write-own"],
  user: [],
};

export function can(role: Role | undefined, permission: Permission): boolean {
  return !!role && MATRIX[role].includes(permission);
}

export const isStaff = (role: Role | undefined) => can(role, "admin:access");

export type Actor = { id: string; role: Role };
