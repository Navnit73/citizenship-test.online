"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { ErrorAlert, Loading, errMessage, selectCls, useLoad } from "./ui";

type Row = { id: string; email: string; name?: string; role: string };

export function UsersManager() {
  const { data, error, loading, reload } = useLoad(
    async () => (await apiClient.get<Row[]>("/admin/users")).data,
    [],
  );
  const [actionError, setActionError] = useState<string | null>(null);

  async function changeRole(id: string, role: string) {
    setActionError(null);
    try {
      await apiClient.patch(`/admin/users/${id}`, { role });
    } catch (err) {
      setActionError(errMessage(err));
    }
    reload();
  }

  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Users</h1>
      <ErrorAlert error={actionError ?? error} />
      {loading ? (
        <Loading />
      ) : (
        <table className="table">
          <caption className="sr-only">Users</caption>
          <thead>
            <tr>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((u) => (
              <tr key={u.id}>
                <th scope="row">{u.email}</th>
                <td>
                  <select
                    className={selectCls}
                    aria-label={`Role for ${u.email}`}
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                  >
                    {["user", "author", "editor", "admin"].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
