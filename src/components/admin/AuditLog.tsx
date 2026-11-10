"use client";

import { apiClient } from "@/lib/api/client";
import { ErrorAlert, Loading, useLoad } from "./ui";

type Row = {
  _id: string;
  at: string;
  action: string;
  entity: string;
  entityId?: string;
  actorId: string;
};

export function AuditLog() {
  const { data, error, loading } = useLoad(
    async () => (await apiClient.get<Row[]>("/admin/audit")).data,
    [],
  );
  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Audit log</h1>
      <ErrorAlert error={error} />
      {loading ? (
        <Loading />
      ) : (
        <table className="table">
          <caption className="sr-only">Audit log</caption>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Action</th>
              <th scope="col">Entity</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((a) => (
              <tr key={a._id}>
                <td>{new Date(a.at).toLocaleString()}</td>
                <th scope="row">{a.action}</th>
                <td>
                  {a.entity} {a.entityId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
