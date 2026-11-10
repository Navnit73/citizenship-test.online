"use client";

import Link from "next/link";
import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { ErrorAlert, Loading, selectCls, useLoad } from "./ui";

type Row = {
  id: string;
  title: string;
  type: string;
  status: string;
  slug: string;
  updatedAt: string;
};

export function PostsList() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const { data, error, loading } = useLoad(
    async () =>
      (
        await apiClient.get<{ items: Row[]; total: number }>("/admin/posts", {
          params: { type: type || undefined, status: status || undefined },
        })
      ).data,
    [type, status],
  );
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Link href="/admin/posts/new" className="btn btn-primary">
          New post
        </Link>
      </div>
      <div className="mb-4 flex gap-3">
        <label className="text-sm">
          Type
          <select className={selectCls} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All</option>
            {["blog", "guide", "howto", "legal", "page"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Status
          <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {["draft", "scheduled", "published"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <ErrorAlert error={error} />
      {loading ? (
        <Loading />
      ) : (
        <table className="table">
          <caption className="sr-only">Posts</caption>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Type</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p.id}>
                <th scope="row">
                  <Link href={`/admin/posts/${p.id}`} className="link">
                    {p.title}
                  </Link>
                </th>
                <td>{p.type}</td>
                <td>{p.status}</td>
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={3}>No posts yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
