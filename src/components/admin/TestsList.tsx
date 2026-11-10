"use client";

import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { ErrorAlert, Loading, useLoad } from "./ui";

type Row = {
  id: string;
  title: string;
  slug: string;
  countryCode: string;
  kind: string;
  isPublished: boolean;
};

export function TestsList() {
  const { data, error, loading } = useLoad(
    async () => (await apiClient.get<{ items: Row[] }>("/admin/tests")).data,
    [],
  );
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tests</h1>
        <Link href="/admin/tests/new" className="btn btn-primary">
          New test
        </Link>
      </div>
      <ErrorAlert error={error} />
      {loading ? (
        <Loading />
      ) : (
        <table className="table">
          <caption className="sr-only">Tests</caption>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Country</th>
              <th scope="col">Kind</th>
              <th scope="col">Published</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((t) => (
              <tr key={t.id}>
                <th scope="row">
                  <Link href={`/admin/tests/${t.id}`} className="link">
                    {t.title}
                  </Link>
                </th>
                <td>{t.countryCode}</td>
                <td>{t.kind}</td>
                <td>{t.isPublished ? "Yes" : "No"}</td>
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={4}>No tests yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
