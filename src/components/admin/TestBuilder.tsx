"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiClient } from "@/lib/api/client";
import { ErrorAlert, Field, inputCls, Loading, Notice, selectCls, errMessage, useLoad } from "./ui";

type Form = {
  title: string;
  slug: string;
  countryCode: string;
  kind: "mock" | "chapter" | "custom";
  questionIds: string[];
  chapterIds: string[];
  questionsAsked: string;
  passPercent: string;
  timeLimitMin: string;
  isPublished: boolean;
};
const empty: Form = {
  title: "",
  slug: "",
  countryCode: "uk",
  kind: "mock",
  questionIds: [],
  chapterIds: [],
  questionsAsked: "",
  passPercent: "",
  timeLimitMin: "",
  isPublished: false,
};

type Chapter = { id: string; title: string; countryCode: string };
type Q = { id: string; prompt: string };

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export function TestBuilder({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(empty);
  const [ready, setReady] = useState(!id);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const { data: chapters } = useLoad(
    async () => (await apiClient.get<Chapter[]>("/admin/chapters")).data,
    [],
  );
  const { data: questions } = useLoad(
    async () =>
      form.kind === "custom"
        ? (
            await apiClient.get<{ items: Q[] }>("/admin/questions", {
              params: {
                countryCode: form.countryCode,
                status: "published",
                q: search || undefined,
                limit: 50,
              },
            })
          ).data.items
        : [],
    [form.kind, form.countryCode, search],
  );
  const { error: loadError } = useLoad(async () => {
    if (!id) return true;
    const t = (await apiClient.get(`/admin/tests/${id}`)).data;
    setForm({
      title: t.title,
      slug: t.slug,
      countryCode: t.countryCode,
      kind: t.kind,
      questionIds: (t.questionIds ?? []).map(String),
      chapterIds: (t.rules?.chapterIds ?? []).map(String),
      questionsAsked: t.rules?.questionsAsked ? String(t.rules.questionsAsked) : "",
      passPercent: t.rules?.passRule?.type === "percent" ? String(t.rules.passRule.value) : "",
      timeLimitMin: t.timeLimitSec ? String(Math.round(t.timeLimitSec / 60)) : "",
      isPublished: !!t.isPublished,
    });
    setReady(true);
    return true;
  }, [id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const rules = {
      ...(form.questionsAsked && { questionsAsked: Number(form.questionsAsked) }),
      ...(form.passPercent && { passRule: { type: "percent", value: Number(form.passPercent) } }),
      ...(form.kind === "chapter" && { chapterIds: form.chapterIds }),
    };
    const payload = {
      title: form.title,
      slug: form.slug || undefined,
      countryCode: form.countryCode,
      kind: form.kind,
      questionIds: form.kind === "custom" ? form.questionIds : undefined,
      rules: Object.keys(rules).length ? rules : undefined,
      timeLimitSec: form.timeLimitMin ? Math.round(Number(form.timeLimitMin) * 60) : undefined,
      isPublished: form.isPublished,
    };
    try {
      if (id) {
        await apiClient.patch(`/admin/tests/${id}`, payload);
        setSaved(true);
      } else {
        const t = (await apiClient.post("/admin/tests", payload)).data;
        router.push(`/admin/tests/${t.id}`);
      }
    } catch (err) {
      setError(errMessage(err));
    }
  }

  async function remove() {
    if (!id || !window.confirm("Delete this test?")) return;
    try {
      await apiClient.delete(`/admin/tests/${id}`);
      router.push("/admin/tests");
    } catch (err) {
      setError(errMessage(err));
    }
  }

  if (loadError) return <ErrorAlert error={loadError} />;
  if (!ready) return <Loading />;

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-bold">{id ? "Edit test" : "New test"}</h1>
      <Field label="Title">
        <input
          className={inputCls}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          required
        />
      </Field>
      <Field
        label="URL slug"
        hint="Published at /tests/your-slug. Leave blank to generate from the title."
      >
        <input
          className={inputCls}
          value={form.slug}
          onChange={(e) => set("slug", e.target.value)}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Country">
          <select
            className={selectCls}
            value={form.countryCode}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                countryCode: e.target.value,
                questionIds: [],
                chapterIds: [],
              }))
            }
          >
            {["us", "uk", "ca", "au"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Kind" hint="Mock uses the country's official exam rules.">
          <select
            className={selectCls}
            value={form.kind}
            onChange={(e) => set("kind", e.target.value as Form["kind"])}
          >
            <option value="mock">Mock exam (official rules)</option>
            <option value="chapter">Chapter practice</option>
            <option value="custom">Hand-picked questions</option>
          </select>
        </Field>
        <Field label="Time limit (minutes)" hint="Optional. Blank = rules default.">
          <input
            type="number"
            min={1}
            className={inputCls}
            value={form.timeLimitMin}
            onChange={(e) => set("timeLimitMin", e.target.value)}
          />
        </Field>
        {form.kind !== "mock" && (
          <>
            <Field label="Questions asked" hint="Blank = all available.">
              <input
                type="number"
                min={1}
                className={inputCls}
                value={form.questionsAsked}
                onChange={(e) => set("questionsAsked", e.target.value)}
              />
            </Field>
            <Field label="Pass mark (%)" hint="Blank = 75%.">
              <input
                type="number"
                min={1}
                max={100}
                className={inputCls}
                value={form.passPercent}
                onChange={(e) => set("passPercent", e.target.value)}
              />
            </Field>
          </>
        )}
      </div>

      {form.kind === "chapter" && (
        <fieldset>
          <legend className="mb-2 font-semibold">Chapters</legend>
          {(chapters ?? [])
            .filter((c) => c.countryCode === form.countryCode)
            .map((c) => (
              <label key={c.id} className="mr-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={form.chapterIds.includes(c.id)}
                  onChange={() => set("chapterIds", toggle(form.chapterIds, c.id))}
                />
                {c.title}
              </label>
            ))}
        </fieldset>
      )}

      {form.kind === "custom" && (
        <fieldset>
          <legend className="mb-2 font-semibold">
            Questions ({form.questionIds.length} selected)
          </legend>
          <Field label="Search published questions">
            <input
              className={inputCls}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
          <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto">
            {(questions ?? []).map((q) => (
              <li key={q.id}>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm mt-1"
                    checked={form.questionIds.includes(q.id)}
                    onChange={() => set("questionIds", toggle(form.questionIds, q.id))}
                  />
                  {q.prompt}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          className="checkbox"
          checked={form.isPublished}
          onChange={(e) => set("isPublished", e.target.checked)}
        />
        Published
      </label>
      <ErrorAlert error={error} />
      {saved && <Notice>Saved.</Notice>}
      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary">
          Save
        </button>
        {id && (
          <button type="button" className="btn btn-outline btn-error" onClick={remove}>
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
