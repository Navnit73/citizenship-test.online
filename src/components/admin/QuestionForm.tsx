"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiClient } from "@/lib/api/client";
import {
  emptyQuestionForm,
  fromQuestion,
  toQuestionPayload,
  type ApiQuestion,
  type QuestionFormState,
} from "./question-form";
import {
  ErrorAlert,
  Field,
  inputCls,
  Loading,
  Notice,
  selectCls,
  textareaCls,
  errMessage,
  useLoad,
} from "./ui";

type Chapter = { id: string; title: string; countryCode: string };

export function QuestionForm({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<QuestionFormState>(emptyQuestionForm);
  const [ready, setReady] = useState(!id);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: chapters } = useLoad(
    async () => (await apiClient.get<Chapter[]>("/admin/chapters")).data,
    [],
  );
  const { error: loadError } = useLoad(async () => {
    if (!id) return true;
    setForm(fromQuestion((await apiClient.get<ApiQuestion>(`/admin/questions/${id}`)).data));
    setReady(true);
    return true;
  }, [id]);

  const set = <K extends keyof QuestionFormState>(k: K, v: QuestionFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const choice = ["single", "multiple", "truefalse"].includes(form.type);
  const countryChapters = (chapters ?? []).filter((c) => c.countryCode === form.countryCode);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const payload = toQuestionPayload(form);
      if (id) {
        await apiClient.patch(`/admin/questions/${id}`, payload);
        setSaved(true);
      } else {
        const q = (await apiClient.post("/admin/questions", payload)).data;
        router.push(`/admin/questions/${q.id}`);
      }
    } catch (err) {
      setError(errMessage(err));
    }
  }

  async function remove() {
    if (!id || !window.confirm("Delete this question?")) return;
    try {
      await apiClient.delete(`/admin/questions/${id}`);
      router.push("/admin/questions");
    } catch (err) {
      setError(errMessage(err));
    }
  }

  if (loadError) return <ErrorAlert error={loadError} />;
  if (!ready) return <Loading />;

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-bold">{id ? "Edit question" : "New question"}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Country">
          <select
            className={selectCls}
            value={form.countryCode}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                countryCode: e.target.value as QuestionFormState["countryCode"],
                chapterId: "",
              }))
            }
          >
            {["us", "uk", "ca", "au"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Chapter">
          <select
            className={selectCls}
            value={form.chapterId}
            onChange={(e) => set("chapterId", e.target.value)}
            required
          >
            <option value="">Select a chapter…</option>
            {countryChapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Exam versions" hint="Comma separated, e.g. 2025, 2008">
          <input
            className={inputCls}
            value={form.versions}
            onChange={(e) => set("versions", e.target.value)}
            required
          />
        </Field>
        <Field label="Type">
          <select
            className={selectCls}
            value={form.type}
            onChange={(e) => set("type", e.target.value as QuestionFormState["type"])}
          >
            <option value="single">Single choice</option>
            <option value="multiple">Multiple choice</option>
            <option value="truefalse">True / false</option>
            <option value="shorttext">Short text</option>
            <option value="dictation">Dictation</option>
          </select>
        </Field>
      </div>
      <Field label="Question">
        <textarea
          className={textareaCls}
          rows={2}
          value={form.prompt}
          onChange={(e) => set("prompt", e.target.value)}
          required
        />
      </Field>
      {choice ? (
        <>
          <Field
            label="Options"
            hint='One per line as "a: Text". Plain lines get letters automatically.'
          >
            <textarea
              className={textareaCls}
              rows={4}
              value={form.options}
              onChange={(e) => set("options", e.target.value)}
            />
          </Field>
          <Field label="Correct option ids" hint="Comma separated, e.g. a or a, c">
            <input
              className={inputCls}
              value={form.correct}
              onChange={(e) => set("correct", e.target.value)}
            />
          </Field>
        </>
      ) : (
        <Field
          label="Accepted answers"
          hint="One per line. Matching ignores case, punctuation and articles."
        >
          <textarea
            className={textareaCls}
            rows={3}
            value={form.accepted}
            onChange={(e) => set("accepted", e.target.value)}
          />
        </Field>
      )}
      <Field label="Explanation">
        <textarea
          className={textareaCls}
          rows={2}
          value={form.explanation}
          onChange={(e) => set("explanation", e.target.value)}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Source reference" hint="Handbook chapter or official page. Required.">
          <input
            className={inputCls}
            value={form.sourceRef}
            onChange={(e) => set("sourceRef", e.target.value)}
            required
          />
        </Field>
        <Field label="Tags" hint="Comma separated, e.g. values, state-specific">
          <input
            className={inputCls}
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
          />
        </Field>
        <Field label="Difficulty">
          <select
            className={selectCls}
            value={form.difficulty}
            onChange={(e) => set("difficulty", Number(e.target.value))}
          >
            <option value={1}>1 – easy</option>
            <option value={2}>2 – medium</option>
            <option value={3}>3 – hard</option>
          </select>
        </Field>
        <Field label="Status">
          <select
            className={selectCls}
            value={form.status}
            onChange={(e) => set("status", e.target.value as QuestionFormState["status"])}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </Field>
      </div>
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
