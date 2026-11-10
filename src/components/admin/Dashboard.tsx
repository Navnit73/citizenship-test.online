"use client";

import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { useCan } from "./shell";
import { useLoad } from "./ui";

function Stat({ label, href, path }: { label: string; href: string; path: string }) {
  const { data } = useLoad(
    async () => (await apiClient.get<{ total: number }>(path, { params: { limit: 1 } })).data.total,
    [path],
  );
  return (
    <Link href={href} className="stat rounded border border-base-300">
      <span className="stat-title">{label}</span>
      <span className="stat-value">{data ?? "…"}</span>
    </Link>
  );
}

export function Dashboard() {
  const questions = useCan("question:write");
  const tests = useCan("test:write");
  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Admin dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Posts" href="/admin/posts" path="/admin/posts" />
        {questions && <Stat label="Questions" href="/admin/questions" path="/admin/questions" />}
        {tests && <Stat label="Tests" href="/admin/tests" path="/admin/tests" />}
      </div>
    </section>
  );
}
