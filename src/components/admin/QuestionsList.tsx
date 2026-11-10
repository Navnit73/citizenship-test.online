"use client";

import Link from "next/link";
import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { ErrorAlert, Loading, inputCls, selectCls, useLoad } from "./ui";

type Row = {
  id: string;
  prompt: string;
  countryCode: string;
  type: string;
  status: string;
  tags: string[];
};

export function QuestionsList() {
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const { data, error, loading } = useLoad(
    async () =>
      (
        await apiClient.get<{ items: Row[]; total: number }>("/admin/questions", {
          params: {
            countryCode: country || undefined,
            status: status || undefined,
            q: q || undefined,
          },
        })
      ).data,
    [country, status, q],
  );
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Question bank</h1>
        <div className="flex gap-2">
          <Link href="/admin/questions/import" className="btn btn-outline">
            Bulk import
          </Link>
          <Link href="/admin/questions/new" className="btn btn-primary">
            New question
          </Link>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="text-sm">
          Country
          <select
            className={selectCls}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">All</option>
            {["us", "uk", "ca", "au"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Status
          <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option>draft</option>
            <option>published</option>
          </select>
        </label>
        <label className="text-sm">
          Search
          <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      <ErrorAlert error={error} />
      {loading ? (
        <Loading />
      ) : (
        <>
          <p className="mb-2 text-sm">{data?.total} question(s)</p>
          <table className="table">
            <caption className="sr-only">Questions</caption>
            <thead>
              <tr>
                <th scope="col">Question</th>
                <th scope="col">Country</th>
                <th scope="col">Type</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((r) => (
                <tr key={r.id}>
                  <th scope="row">
                    <Link href={`/admin/questions/${r.id}`} className="link">
                      {r.prompt}
                    </Link>
                  </th>
                  <td>{r.countryCode}</td>
                  <td>{r.type}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
