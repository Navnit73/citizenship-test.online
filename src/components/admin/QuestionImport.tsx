"use client";

import { useState, type ChangeEvent } from "react";
import { apiClient } from "@/lib/api/client";
import { ErrorAlert, Field, errMessage, textareaCls } from "./ui";

type Result = { created: number; updated: number; errors: { row: number; message: string }[] };

const SAMPLE =
  "countryCode,versions,chapter,type,prompt,options,correct,accepted,explanation,sourceRef,tags,difficulty,status\n" +
  'uk,3rd-edition,history,single,"In which year was the Battle of Hastings?",a:1066|b:1215,a,,,Life in the UK handbook,,1,draft';

export function QuestionImport() {
  const [text, setText] = useState("");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [result, setResult] = useState<(Result & { dryRun: boolean }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setText(await file.text());
    setFormat(file.name.endsWith(".json") ? "json" : "csv");
  }

  async function run(dryRun: boolean) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const body = format === "json" ? { rows: JSON.parse(text), dryRun } : { csv: text, dryRun };
      const { data } = await apiClient.post<Result>("/admin/questions/import", body);
      setResult({ ...data, dryRun });
    } catch (err) {
      setError(err instanceof SyntaxError ? "That isn't valid JSON." : errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Bulk import questions</h1>
      <p>
        Upload or paste CSV (columns below) or a JSON array. Questions are matched by country and
        prompt, so re-importing updates instead of duplicating. Always run a dry run first.
      </p>
      <details>
        <summary className="cursor-pointer">CSV format example</summary>
        <pre className="overflow-x-auto rounded bg-base-200 p-3 text-xs">{SAMPLE}</pre>
        <p className="text-sm">
          Use | to separate multiple versions, options (id:text), correct ids, accepted answers and
          tags.
        </p>
      </details>
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm">
          File
          <input
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="file-input file-input-bordered ml-2"
            onChange={onFile}
          />
        </label>
        <fieldset className="flex gap-3">
          <legend className="sr-only">Format</legend>
          {(["csv", "json"] as const).map((f) => (
            <label key={f} className="flex items-center gap-1">
              <input
                type="radio"
                name="format"
                className="radio radio-sm"
                checked={format === f}
                onChange={() => setFormat(f)}
              />
              {f.toUpperCase()}
            </label>
          ))}
        </fieldset>
      </div>
      <Field label="Data">
        <textarea
          className={`${textareaCls} font-mono`}
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Field>
      <div className="flex gap-3">
        <button
          type="button"
          className="btn btn-outline"
          disabled={busy || !text.trim()}
          onClick={() => run(true)}
        >
          Dry run
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || !text.trim()}
          onClick={() => run(false)}
        >
          Import
        </button>
      </div>
      <ErrorAlert error={error} />
      {result && (
        <div
          role="status"
          className={`alert ${result.errors.length ? "alert-warning" : "alert-success"}`}
        >
          <div>
            <p className="font-semibold">
              {result.dryRun ? "Dry run: " : "Imported: "}
              {result.created} new, {result.updated} updated, {result.errors.length} error(s).
            </p>
            <ul className="list-disc pl-5">
              {result.errors.map((e) => (
                <li key={e.row}>
                  Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
