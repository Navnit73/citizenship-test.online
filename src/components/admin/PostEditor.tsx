"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiClient } from "@/lib/api/client";
import { RichTextEditor } from "./RichTextEditor";
import { useCan } from "./shell";
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

type Form = {
  type: string;
  title: string;
  slug: string;
  countryCode: string;
  excerpt: string;
  body: string;
  status: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  noindex: boolean;
};
const empty: Form = {
  type: "blog",
  title: "",
  slug: "",
  countryCode: "",
  excerpt: "",
  body: "",
  status: "draft",
  publishedAt: "",
  seoTitle: "",
  seoDescription: "",
  noindex: false,
};

const toLocalInput = (iso?: string) =>
  iso
    ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";

export function PostEditor({ id }: { id?: string }) {
  const router = useRouter();
  const canPublish = useCan("post:publish");
  const canDelete = useCan("post:delete");
  const [form, setForm] = useState<Form>(empty);
  const [loaded, setLoaded] = useState(!id);
  const [revisions, setRevisions] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const { error: loadError } = useLoad(async () => {
    if (!id) return true;
    const p = (await apiClient.get(`/admin/posts/${id}`)).data;
    setForm({
      type: p.type,
      title: p.title,
      slug: p.slug,
      countryCode: p.countryCode ?? "",
      excerpt: p.excerpt ?? "",
      body: p.body,
      status: p.status,
      publishedAt: toLocalInput(p.publishedAt),
      seoTitle: p.seo?.title ?? "",
      seoDescription: p.seo?.description ?? "",
      noindex: !!p.seo?.noindex,
    });
    setRevisions(p.revisions?.length ?? 0);
    setLoaded(true);
    return true;
  }, [id]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const payload = {
      ...(id ? {} : { type: form.type }),
      title: form.title,
      slug: form.slug || undefined,
      countryCode: form.countryCode || undefined,
      excerpt: form.excerpt || undefined,
      body: form.body,
      status: form.status,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined,
      seo: { title: form.seoTitle, description: form.seoDescription, noindex: form.noindex },
    };
    try {
      if (id) {
        const p = (await apiClient.patch(`/admin/posts/${id}`, payload)).data;
        setRevisions(p.revisions?.length ?? 0);
        setSaved(true);
      } else {
        const p = (await apiClient.post("/admin/posts", payload)).data;
        router.push(`/admin/posts/${p.id}`);
      }
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!id || !window.confirm("Delete this post permanently?")) return;
    try {
      await apiClient.delete(`/admin/posts/${id}`);
      router.push("/admin/posts");
    } catch (err) {
      setError(errMessage(err));
    }
  }

  if (loadError) return <ErrorAlert error={loadError} />;
  if (!loaded) return <Loading />;

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-bold">{id ? "Edit post" : "New post"}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <select
            className={selectCls}
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            disabled={!!id}
          >
            {[
              ["blog", "Blog post"],
              ["guide", "Guide"],
              ["howto", "How-to"],
              ["legal", "Legal page"],
              ["page", "Landing page"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Country (optional)">
          <select
            className={selectCls}
            value={form.countryCode}
            onChange={(e) => set("countryCode", e.target.value)}
          >
            <option value="">None</option>
            {["us", "uk", "ca", "au"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Title">
        <input
          className={inputCls}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          required
          maxLength={200}
        />
      </Field>
      <Field
        label="Slug"
        hint="Leave blank to generate from the title. Lowercase letters, numbers and dashes."
      >
        <input
          className={inputCls}
          value={form.slug}
          onChange={(e) => set("slug", e.target.value)}
        />
      </Field>
      <Field label="Excerpt">
        <textarea
          className={textareaCls}
          rows={2}
          value={form.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
          maxLength={500}
        />
      </Field>
      <div>
        <span className="mb-1 block text-sm font-medium" id="body-label">
          Body
        </span>
        <RichTextEditor value={form.body} onChange={(html) => set("body", html)} label="Body" />
      </div>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-semibold">Publishing</legend>
        <Field
          label="Status"
          hint={canPublish ? undefined : "Only editors can publish or schedule."}
        >
          <select
            className={selectCls}
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="draft">Draft</option>
            {canPublish && <option value="scheduled">Scheduled</option>}
            {canPublish && <option value="published">Published</option>}
          </select>
        </Field>
        <Field label="Publish date" hint="Required for scheduled posts.">
          <input
            type="datetime-local"
            className={inputCls}
            value={form.publishedAt}
            onChange={(e) => set("publishedAt", e.target.value)}
          />
        </Field>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="mb-2 font-semibold">SEO</legend>
        <Field label="SEO title">
          <input
            className={inputCls}
            value={form.seoTitle}
            onChange={(e) => set("seoTitle", e.target.value)}
            maxLength={120}
          />
        </Field>
        <Field label="Meta description">
          <textarea
            className={textareaCls}
            rows={2}
            value={form.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
            maxLength={320}
          />
        </Field>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="checkbox"
            checked={form.noindex}
            onChange={(e) => set("noindex", e.target.checked)}
          />
          Hide from search engines (noindex)
        </label>
      </fieldset>
      <ErrorAlert error={error} />
      {saved && <Notice>Saved.</Notice>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
        {id && canDelete && (
          <button type="button" className="btn btn-outline btn-error" onClick={remove}>
            Delete
          </button>
        )}
        {id && <span className="text-sm opacity-80">{revisions} previous revision(s)</span>}
      </div>
    </form>
  );
}
