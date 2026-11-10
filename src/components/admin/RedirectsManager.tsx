"use client";

import { useState, type FormEvent } from "react";
import { apiClient } from "@/lib/api/client";
import { ErrorAlert, Field, inputCls, Loading, errMessage, selectCls, useLoad } from "./ui";

type Row = { id: string; from: string; to: string; status: number };

export function RedirectsManager() {
  const { data, error, loading, reload } = useLoad(
    async () => (await apiClient.get<Row[]>("/admin/redirects")).data,
    [],
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState(301);
  const [formError, setFormError] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await apiClient.post("/admin/redirects", { from, to, status });
      setFrom("");
      setTo("");
      reload();
    } catch (err) {
      setFormError(errMessage(err));
    }
  }

  async function remove(id: string) {
    try {
      await apiClient.delete(`/admin/redirects/${id}`);
      reload();
    } catch (err) {
      setFormError(errMessage(err));
    }
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Redirects</h1>
      <form onSubmit={add} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
        <Field label="From path">
          <input
            className={inputCls}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="/old-page"
            required
          />
        </Field>
        <Field label="To (path or URL)">
          <input
            className={inputCls}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="/new-page"
            required
          />
        </Field>
        <Field label="Type">
          <select
            className={selectCls}
            value={status}
            onChange={(e) => setStatus(Number(e.target.value))}
          >
            <option value={301}>301 permanent</option>
            <option value={302}>302 temporary</option>
            <option value={307}>307</option>
            <option value={308}>308</option>
          </select>
        </Field>
        <button type="submit" className="btn btn-primary">
          Add
        </button>
      </form>
      <ErrorAlert error={formError ?? error} />
      {loading ? (
        <Loading />
      ) : (
        <table className="table">
          <caption className="sr-only">Redirects</caption>
          <thead>
            <tr>
              <th scope="col">From</th>
              <th scope="col">To</th>
              <th scope="col">Type</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.from}</th>
                <td>{r.to}</td>
                <td>{r.status}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline btn-error"
                    onClick={() => remove(r.id)}
                    aria-label={`Delete redirect from ${r.from}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {data?.length === 0 && (
              <tr>
                <td colSpan={4}>No redirects yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
