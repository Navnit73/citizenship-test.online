// @vitest-environment node
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/db/models";
import { ChapterModel, QuestionModel, UserModel } from "@/lib/db/models";
import { clearTestDb, startTestDb, stopTestDb } from "@/lib/db/test-utils";

const { auth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@/auth", () => ({ auth }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }));

import * as auditRoute from "./audit/route";
import * as importRoute from "./questions/import/route";
import * as postRoute from "./posts/[id]/route";
import * as postsRoute from "./posts/route";
import * as redirectsRoute from "./redirects/route";
import * as usersRoute from "./users/route";
import * as userRoute from "./users/[id]/route";

beforeAll(startTestDb, 180_000);
afterAll(stopTestDb);
beforeEach(async () => {
  await clearTestDb();
  auth.mockReset();
});

const oid = () => String(new mongoose.Types.ObjectId());
const as = (role: string | null) =>
  auth.mockResolvedValue(role ? { user: { id: oid(), role } } : null);
const json = (method: string, url: string, body?: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://site.test${url}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const ctx = (params: Record<string, string>) => ({ params: Promise.resolve(params) });
const post = { type: "blog", title: "Hello", body: "<p>x</p>", status: "draft" };

describe("authentication & authorisation", () => {
  it("401 for anonymous requests", async () => {
    as(null);
    expect((await postsRoute.GET(json("GET", "/api/admin/posts"))).status).toBe(401);
  });
  it("403 for plain users on every admin endpoint", async () => {
    as("user");
    expect((await postsRoute.GET(json("GET", "/x"))).status).toBe(403);
    expect((await postsRoute.POST(json("POST", "/x", post))).status).toBe(403);
    expect((await importRoute.POST(json("POST", "/x", { rows: [] }))).status).toBe(403);
    expect((await redirectsRoute.GET(json("GET", "/x"))).status).toBe(403);
    expect((await usersRoute.GET(json("GET", "/x"))).status).toBe(403);
    expect((await auditRoute.GET(json("GET", "/x"))).status).toBe(403);
  });
  it("editors cannot reach admin-only endpoints", async () => {
    as("editor");
    expect((await usersRoute.GET(json("GET", "/x"))).status).toBe(403);
    expect((await auditRoute.GET(json("GET", "/x"))).status).toBe(403);
  });
  it("blocks cross-origin mutations", async () => {
    as("editor");
    const res = await postsRoute.POST(
      json("POST", "/api/admin/posts", post, { origin: "https://evil.test" }),
    );
    expect(res.status).toBe(403);
  });
});

describe("posts API", () => {
  it("authors create drafts (201) but cannot publish (403)", async () => {
    as("author");
    expect((await postsRoute.POST(json("POST", "/x", post))).status).toBe(201);
    const res = await postsRoute.POST(
      json("POST", "/x", { ...post, title: "Two", status: "published" }),
    );
    expect(res.status).toBe(403);
  });
  it("editors publish, fetch, update and delete", async () => {
    as("editor");
    const created = await (
      await postsRoute.POST(json("POST", "/x", { ...post, status: "published" }))
    ).json();
    expect(created.slug).toBe("hello");
    const got = await postRoute.GET(json("GET", "/x"), ctx({ id: created.id }));
    expect(got.status).toBe(200);
    const patched = await postRoute.PATCH(
      json("PATCH", "/x", { title: "Renamed" }),
      ctx({ id: created.id }),
    );
    expect((await patched.json()).title).toBe("Renamed");
    expect((await postRoute.DELETE(json("DELETE", "/x"), ctx({ id: created.id }))).status).toBe(
      204,
    );
    expect((await postRoute.GET(json("GET", "/x"), ctx({ id: created.id }))).status).toBe(404);
  });
  it("409 on duplicate slug, 400 on bad input and bad JSON", async () => {
    as("editor");
    await postsRoute.POST(json("POST", "/x", post));
    expect((await postsRoute.POST(json("POST", "/x", post))).status).toBe(409);
    expect((await postsRoute.POST(json("POST", "/x", { ...post, title: "" }))).status).toBe(400);
    const bad = new Request("http://site.test/x", { method: "POST", body: "{nope" });
    expect((await postsRoute.POST(bad)).status).toBe(400);
  });
  it("lists with filters", async () => {
    as("editor");
    await postsRoute.POST(json("POST", "/x", post));
    const res = await postsRoute.GET(json("GET", "/api/admin/posts?type=guide"));
    expect((await res.json()).total).toBe(0);
  });
});

describe("question import API", () => {
  beforeEach(async () => {
    await ChapterModel.create({ countryCode: "uk", slug: "history", title: "History" });
  });
  const row = {
    countryCode: "uk",
    versions: ["v"],
    chapter: "history",
    type: "single",
    prompt: "Q?",
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
    ],
    correctOptionIds: ["a"],
    sourceRef: "r",
    status: "published",
  };
  it("imports JSON rows", async () => {
    as("editor");
    const res = await importRoute.POST(json("POST", "/x", { rows: [row] }));
    expect(await res.json()).toMatchObject({ created: 1, errors: [] });
    expect(await QuestionModel.countDocuments()).toBe(1);
  });
  it("imports CSV text and supports dry runs", async () => {
    as("editor");
    const csv =
      "countryCode,versions,chapter,type,prompt,options,correct,accepted,explanation,sourceRef,tags,difficulty,status\n" +
      'uk,v,history,single,"CSV Q?",a:A|b:B,a,,,Ref,,1,published';
    const res = await importRoute.POST(json("POST", "/x", { csv, dryRun: true }));
    expect(await res.json()).toMatchObject({ created: 1 });
    expect(await QuestionModel.countDocuments()).toBe(0);
  });
  it("400 when neither rows nor csv is given", async () => {
    as("editor");
    expect((await importRoute.POST(json("POST", "/x", {}))).status).toBe(400);
  });
});

describe("redirects, users and audit API", () => {
  it("creates and lists redirects", async () => {
    as("editor");
    expect((await redirectsRoute.POST(json("POST", "/x", { from: "/a", to: "/b" }))).status).toBe(
      201,
    );
    expect((await (await redirectsRoute.GET(json("GET", "/x"))).json()).length).toBe(1);
  });
  it("admins change roles and read the audit log", async () => {
    as("admin");
    const u = await UserModel.create({ email: "u@example.com" });
    const res = await userRoute.PATCH(
      json("PATCH", "/x", { role: "editor" }),
      ctx({ id: String(u.id) }),
    );
    expect((await res.json()).role).toBe("editor");
    const log = await (await auditRoute.GET(json("GET", "/x"))).json();
    expect(log[0].action).toBe("user.role");
  });
});
