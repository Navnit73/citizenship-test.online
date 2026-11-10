import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
import { testLoginEnabled } from "@/lib/auth/test-login";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

async function Form() {
  await connection(); // read env at request time, not build time
  return <LoginForm google={!!process.env.AUTH_GOOGLE_ID} testLogin={testLoginEnabled()} />;
}

export default function LoginPage() {
  return (
    <main>
      <h1 className="mb-6 text-3xl font-bold">Sign in</h1>
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Form />
      </Suspense>
    </main>
  );
}
