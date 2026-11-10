import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/shell";
import { isStaff } from "@/lib/auth/permissions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

/** Server-side gate: the session is read at request time, behind Suspense. */
async function AdminGate({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fadmin");
  if (!isStaff(session.user.role)) {
    return (
      <main>
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2">Your account doesn&apos;t have permission to use the admin area.</p>
      </main>
    );
  }
  return (
    <AdminShell role={session.user.role} email={session.user.email}>
      {children}
    </AdminShell>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p role="status">Loading…</p>}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
