"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { createContext, useContext, type ReactNode } from "react";
import { can, type Permission, type Role } from "@/lib/auth/permissions";

const RoleContext = createContext<Role>("user");
export const useRole = () => useContext(RoleContext);
export const useCan = (p: Permission) => can(useContext(RoleContext), p);

const LINKS: { href: string; label: string; perm: Permission }[] = [
  { href: "/admin", label: "Dashboard", perm: "admin:access" },
  { href: "/admin/posts", label: "Posts", perm: "post:write-own" },
  { href: "/admin/questions", label: "Questions", perm: "question:write" },
  { href: "/admin/tests", label: "Tests", perm: "test:write" },
  { href: "/admin/redirects", label: "Redirects", perm: "redirect:write" },
  { href: "/admin/users", label: "Users", perm: "user:manage" },
  { href: "/admin/audit", label: "Audit log", perm: "audit:read" },
];

export function AdminShell({
  role,
  email,
  children,
}: {
  role: Role;
  email?: string | null;
  children: ReactNode;
}) {
  return (
    <RoleContext.Provider value={role}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-base-300 pb-3">
        <nav aria-label="Admin" className="flex flex-wrap gap-4">
          {LINKS.filter((l) => can(role, l.perm)).map((l) => (
            <Link key={l.href} href={l.href} className="link link-hover font-medium">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span>
            {email} ({role})
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => signOut({ redirectTo: "/" })}
          >
            Sign out
          </button>
        </div>
      </div>
      <main>{children}</main>
    </RoleContext.Provider>
  );
}
