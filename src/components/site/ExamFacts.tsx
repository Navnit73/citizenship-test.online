import type { CountrySummary } from "@/lib/site/data";

export function ExamFacts({ summary }: { summary: CountrySummary }) {
  const d = summary.description;
  const rows: [string, string][] = [
    ["Questions", d.questions],
    ["Question pool", d.pool],
    ["Pass mark", d.passMark],
    ["Time", d.time],
  ];
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <caption className="mb-2 text-left font-semibold">{summary.testName} at a glance</caption>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <th scope="row">{k}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {d.notes.length > 0 && (
        <ul className="mt-2 list-disc pl-6">
          {d.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OfficialSource({ summary }: { summary: CountrySummary }) {
  const reviewed = summary.lastReviewedAt
    ? new Date(summary.lastReviewedAt).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  return (
    <aside aria-label="Official source" className="rounded border border-base-300 p-4 text-sm">
      <p>
        Official source:{" "}
        <a
          href={summary.officialSourceUrl}
          className="link"
          rel="noopener noreferrer"
          target="_blank"
        >
          {new URL(summary.officialSourceUrl).hostname}
        </a>
        . Rules change, so always confirm there.
      </p>
      {reviewed && <p>Last reviewed: {reviewed}</p>}
    </aside>
  );
}
