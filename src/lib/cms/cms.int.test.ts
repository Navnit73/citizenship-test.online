// @vitest-environment node
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import "@/lib/db/models";
import { AuditLogModel, ChapterModel, QuestionModel, UserModel } from "@/lib/db/models";
import { clearTestDb, startTestDb, stopTestDb } from "@/lib/db/test-utils";
import type { Actor } from "@/lib/auth/permissions";
import { listAudit } from "./audit";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "./errors";
import { createPost, deletePost, listPosts, updatePost } from "./posts";
import {
  bulkImportQuestions,
  createQuestion,
  deleteQuestion,
  getQuestion,
  listQuestions,
  updateQuestion,
} from "./questions";
import { createRedirect, deleteRedirect, listRedirects } from "./redirects";
import { createTest, deleteTest, getTest, listTests, updateTest } from "./tests";
import { listUsers, setUserRole } from "./users";

beforeAll(startTestDb, 180_000);
afterAll(stopTestDb);
beforeEach(clearTestDb);

const id = () => String(new mongoose.Types.ObjectId());
const admin: Actor = { id: id(), role: "admin" };
const editor: Actor = { id: id(), role: "editor" };
const author: Actor = { id: id(), role: "author" };
const author2: Actor = { id: id(), role: "author" };
const plain: Actor = { id: id(), role: "user" };

describe("posts", () => {
  const input = {
    type: "blog" as const,
    title: "Hello World",
    body: "<p>Hi</p>",
    status: "draft" as const,
  };

  it("creates a draft with a generated slug, sanitised body and author", async () => {
    const post = await createPost(author, { ...input, body: "<p>Hi</p><script>x()</script>" });
    expect(post.slug).toBe("hello-world");
    expect(post.body).toBe("<p>Hi</p>");
    expect(String(post.authorId)).toBe(author.id);
  });
  it("rejects plain users", async () => {
    await expect(createPost(plain, input)).rejects.toBeInstanceOf(ForbiddenError);
  });
  it("authors cannot publish or schedule", async () => {
    await expect(createPost(author, { ...input, status: "published" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      createPost(author, {
        ...input,
        status: "scheduled",
        publishedAt: new Date(Date.now() + 1e6),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
  it("editors publish; publishedAt defaults to now", async () => {
    const post = await createPost(editor, { ...input, status: "published" });
    expect(post.publishedAt!.getTime()).toBeLessThanOrEqual(Date.now());
  });
  it("scheduled posts need a future date", async () => {
    await expect(createPost(editor, { ...input, status: "scheduled" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(
      createPost(editor, {
        ...input,
        status: "scheduled",
        publishedAt: new Date(Date.now() - 1000),
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      createPost(editor, {
        ...input,
        status: "scheduled",
        publishedAt: new Date(Date.now() + 1e6),
      }),
    ).resolves.toBeTruthy();
  });
  it("rejects duplicate slugs within a type only", async () => {
    await createPost(editor, input);
    await expect(createPost(editor, input)).rejects.toBeInstanceOf(ConflictError);
    await expect(createPost(editor, { ...input, type: "guide" })).resolves.toBeTruthy();
  });
  it("rejects invalid input", async () => {
    await expect(createPost(editor, { ...input, title: "" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(createPost(editor, { ...input, slug: "Bad Slug!" })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
  it("update stores the previous body as a revision", async () => {
    const post = await createPost(editor, input);
    const updated = await updatePost(editor, String(post.id), { body: "<p>v2</p>" });
    expect(updated.body).toBe("<p>v2</p>");
    expect(updated.revisions).toHaveLength(1);
    expect(updated.revisions[0].body).toBe("<p>Hi</p>");
  });
  it("authors edit only their own posts", async () => {
    const post = await createPost(author, input);
    await expect(updatePost(author2, String(post.id), { title: "Hijack" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(updatePost(author, String(post.id), { title: "Mine" })).resolves.toBeTruthy();
    await expect(updatePost(editor, String(post.id), { title: "Edited" })).resolves.toBeTruthy();
  });
  it("authors cannot edit live content or change status to published", async () => {
    const post = await createPost(editor, { ...input, status: "published" });
    await expect(updatePost(author, String(post.id), { body: "<p>x</p>" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    const mine = await createPost(author, { ...input, slug: "mine" });
    await expect(
      updatePost(author, String(mine.id), { status: "published" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
  it("404s for unknown ids", async () => {
    await expect(updatePost(editor, id(), { title: "x" })).rejects.toBeInstanceOf(NotFoundError);
    await expect(updatePost(editor, "not-an-id", { title: "x" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
  it("lists: authors see only their own, editors see all", async () => {
    await createPost(author, { ...input, slug: "a1" });
    await createPost(author2, { ...input, slug: "a2" });
    expect((await listPosts(author, {})).items).toHaveLength(1);
    expect((await listPosts(editor, {})).total).toBe(2);
    expect((await listPosts(editor, { type: "guide" })).total).toBe(0);
  });
  it("only editors and admins delete", async () => {
    const post = await createPost(author, input);
    await expect(deletePost(author, String(post.id))).rejects.toBeInstanceOf(ForbiddenError);
    await deletePost(editor, String(post.id));
    expect((await listPosts(editor, {})).total).toBe(0);
  });
  it("writes audit entries for mutations", async () => {
    const post = await createPost(editor, input);
    await updatePost(editor, String(post.id), { title: "New" });
    await deletePost(editor, String(post.id));
    const actions = (await AuditLogModel.find().sort({ at: 1, _id: 1 })).map((a) => a.action);
    expect(actions).toEqual(["post.create", "post.update", "post.delete"]);
  });
});

describe("questions", () => {
  let chapterId: string;
  beforeEach(async () => {
    chapterId = String(
      (await ChapterModel.create({ countryCode: "uk", slug: "history", title: "History" }))._id,
    );
  });
  const base = () => ({
    countryCode: "uk" as const,
    versions: ["3rd-edition"],
    chapterId,
    type: "single" as const,
    prompt: "In which year was Hastings?",
    options: [
      { id: "a", text: "1066" },
      { id: "b", text: "1215" },
    ],
    correctOptionIds: ["a"],
    sourceRef: "Handbook",
    status: "published" as const,
  });

  it("creates, updates, lists and deletes (editors only)", async () => {
    await expect(createQuestion(author, base())).rejects.toBeInstanceOf(ForbiddenError);
    const q = await createQuestion(editor, base());
    await updateQuestion(editor, String(q.id), { difficulty: 3 });
    expect((await listQuestions(editor, { countryCode: "uk" })).items[0].difficulty).toBe(3);
    await deleteQuestion(editor, String(q.id));
    expect((await listQuestions(editor, {})).total).toBe(0);
  });
  it("validates choice questions", async () => {
    await expect(
      createQuestion(editor, { ...base(), correctOptionIds: ["z"] }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      createQuestion(editor, { ...base(), correctOptionIds: ["a", "b"] }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      createQuestion(editor, { ...base(), options: [{ id: "a", text: "x" }] }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
  it("allows multiple correct answers for multiple choice", async () => {
    await expect(
      createQuestion(editor, { ...base(), type: "multiple", correctOptionIds: ["a", "b"] }),
    ).resolves.toBeTruthy();
  });
  it("requires accepted answers for text questions unless state-specific", async () => {
    const text = { ...base(), type: "shorttext" as const, options: [], correctOptionIds: [] };
    await expect(createQuestion(editor, text)).rejects.toBeInstanceOf(ValidationError);
    await expect(createQuestion(editor, { ...text, acceptedAnswers: ["x"] })).resolves.toBeTruthy();
    await expect(
      createQuestion(editor, { ...text, prompt: "Governor?", tags: ["state-specific"] }),
    ).resolves.toBeTruthy();
  });
  it("fetches one question and 404s for unknown ids", async () => {
    const q = await createQuestion(editor, base());
    expect((await getQuestion(editor, String(q.id))).prompt).toBe(base().prompt);
    await expect(getQuestion(editor, id())).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateQuestion(editor, String(q.id), { chapterId: id() })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
  it("requires a source reference", async () => {
    await expect(createQuestion(editor, { ...base(), sourceRef: "" })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
  it("filters by text and tag", async () => {
    await createQuestion(editor, { ...base(), tags: ["values"] });
    await createQuestion(editor, { ...base(), prompt: "Capital of Wales?", tags: [] });
    expect((await listQuestions(editor, { q: "wales" })).total).toBe(1);
    expect((await listQuestions(editor, { tag: "values" })).total).toBe(1);
    expect((await listQuestions(editor, { q: "(.*" })).total).toBe(0); // regex-safe
  });

  describe("bulkImportQuestions", () => {
    const row = (over: Record<string, unknown> = {}) => ({
      countryCode: "uk",
      versions: ["3rd-edition"],
      chapter: "history",
      type: "single",
      prompt: "Q1?",
      options: [
        { id: "a", text: "A" },
        { id: "b", text: "B" },
      ],
      correctOptionIds: ["a"],
      sourceRef: "Handbook",
      status: "published",
      ...over,
    });
    it("creates valid rows and reports invalid ones with row numbers", async () => {
      const result = await bulkImportQuestions(editor, [
        row(),
        row({ prompt: "Q2?", chapter: "nope" }),
        row({ prompt: "Q3?", correctOptionIds: [] }),
      ]);
      expect(result.created).toBe(1);
      expect(result.errors.map((e) => e.row)).toEqual([2, 3]);
      expect(result.errors[0].message).toMatch(/chapter/i);
      expect(await QuestionModel.countDocuments()).toBe(1);
    });
    it("is idempotent: re-importing updates instead of duplicating", async () => {
      await bulkImportQuestions(editor, [row()]);
      const again = await bulkImportQuestions(editor, [row({ explanation: "New" })]);
      expect(again).toMatchObject({ created: 0, updated: 1 });
      expect(await QuestionModel.countDocuments()).toBe(1);
    });
    it("dry run validates without writing", async () => {
      const result = await bulkImportQuestions(editor, [row()], { dryRun: true });
      expect(result.created).toBe(1);
      expect(await QuestionModel.countDocuments()).toBe(0);
    });
    it("is forbidden for authors and capped in size", async () => {
      await expect(bulkImportQuestions(author, [row()])).rejects.toBeInstanceOf(ForbiddenError);
      await expect(
        bulkImportQuestions(
          editor,
          Array.from({ length: 1001 }, () => row()),
        ),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });
});

describe("tests builder", () => {
  let questionId: string;
  beforeEach(async () => {
    const chapter = await ChapterModel.create({ countryCode: "uk", slug: "h", title: "H" });
    questionId = String(
      (
        await QuestionModel.create({
          countryCode: "uk",
          versions: ["v"],
          chapterId: chapter._id,
          type: "single",
          prompt: "Q",
          options: [
            { id: "a", text: "A" },
            { id: "b", text: "B" },
          ],
          correctOptionIds: ["a"],
          sourceRef: "r",
          status: "published",
        })
      )._id,
    );
  });
  const custom = () => ({
    title: "My Test",
    countryCode: "uk" as const,
    kind: "custom" as const,
    questionIds: [questionId],
    isPublished: true,
  });

  it("creates a custom test with a slug and publishes it", async () => {
    const t = await createTest(editor, custom());
    expect(t.slug).toBe("my-test");
    expect(t.isPublished).toBe(true);
  });
  it("is forbidden for authors", async () => {
    await expect(createTest(author, custom())).rejects.toBeInstanceOf(ForbiddenError);
  });
  it("custom tests need questions that exist in the same country", async () => {
    await expect(createTest(editor, { ...custom(), questionIds: [] })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(createTest(editor, { ...custom(), questionIds: [id()] })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(createTest(editor, { ...custom(), countryCode: "us" })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
  it("chapter tests need chapter ids", async () => {
    await expect(
      createTest(editor, { title: "C", countryCode: "uk", kind: "chapter", isPublished: false }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      createTest(editor, {
        title: "C",
        countryCode: "uk",
        kind: "chapter",
        rules: { chapterIds: [id()] },
        isPublished: false,
      }),
    ).resolves.toBeTruthy();
  });
  it("mock tests need no questions; duplicate slugs conflict", async () => {
    await createTest(editor, { title: "Mock", countryCode: "uk", kind: "mock", isPublished: true });
    await expect(
      createTest(editor, { title: "Mock", countryCode: "uk", kind: "mock", isPublished: true }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
  it("gets, lists and deletes tests; update rejects a duplicate slug", async () => {
    const a = await createTest(editor, custom());
    const b = await createTest(editor, { ...custom(), title: "Other" });
    expect((await getTest(editor, String(a.id))).slug).toBe("my-test");
    expect((await listTests(editor, { countryCode: "uk" })).total).toBe(2);
    expect((await listTests(editor, { countryCode: "us" })).total).toBe(0);
    await expect(updateTest(editor, String(b.id), { slug: "my-test" })).rejects.toBeInstanceOf(
      ConflictError,
    );
    await deleteTest(editor, String(a.id));
    await expect(getTest(editor, String(a.id))).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteTest(author, String(b.id))).rejects.toBeInstanceOf(ForbiddenError);
  });
  it("updates and unpublishes", async () => {
    const t = await createTest(editor, custom());
    const u = await updateTest(editor, String(t.id), { isPublished: false, timeLimitSec: 600 });
    expect(u.isPublished).toBe(false);
    expect(u.timeLimitSec).toBe(600);
  });
});

describe("redirects", () => {
  it("creates, lists and deletes", async () => {
    const r = await createRedirect(editor, { from: "/old", to: "/new", status: 301 });
    expect((await listRedirects(editor)).map((x) => x.from)).toEqual(["/old"]);
    await deleteRedirect(editor, String(r.id));
    expect(await listRedirects(editor)).toHaveLength(0);
  });
  it("validates paths and rejects self-redirects and duplicates", async () => {
    await expect(
      createRedirect(editor, { from: "old", to: "/new", status: 301 }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      createRedirect(editor, { from: "/a", to: "/a", status: 301 }),
    ).rejects.toBeInstanceOf(ValidationError);
    await createRedirect(editor, { from: "/a", to: "/b", status: 301 });
    await expect(
      createRedirect(editor, { from: "/a", to: "/c", status: 301 }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
  it("rejects redirect loops", async () => {
    await createRedirect(editor, { from: "/a", to: "/b", status: 301 });
    await createRedirect(editor, { from: "/b", to: "/c", status: 301 });
    await expect(
      createRedirect(editor, { from: "/c", to: "/a", status: 301 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
  it("allows external destinations and forbids authors", async () => {
    await expect(
      createRedirect(editor, { from: "/ext", to: "https://example.com/x", status: 302 }),
    ).resolves.toBeTruthy();
    await expect(
      createRedirect(author, { from: "/z", to: "/y", status: 301 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      createRedirect(editor, { from: "/j", to: "javascript:alert(1)", status: 301 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("users", () => {
  it("only admins list users and change roles", async () => {
    const u = await UserModel.create({ email: "u@example.com" });
    await expect(listUsers(editor)).rejects.toBeInstanceOf(ForbiddenError);
    expect((await listUsers(admin)).map((x) => x.email)).toEqual(["u@example.com"]);
    await expect(setUserRole(editor, String(u.id), "editor")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect((await setUserRole(admin, String(u.id), "editor")).role).toBe("editor");
  });
  it("never removes the last admin", async () => {
    const a = await UserModel.create({ email: "a@example.com", role: "admin" });
    await expect(setUserRole(admin, String(a.id), "user")).rejects.toBeInstanceOf(ValidationError);
    await UserModel.create({ email: "b@example.com", role: "admin" });
    await expect(setUserRole(admin, String(a.id), "user")).resolves.toBeTruthy();
  });
  it("rejects invalid roles and unknown users", async () => {
    await expect(setUserRole(admin, id(), "editor")).rejects.toBeInstanceOf(NotFoundError);
    await expect(setUserRole(admin, id(), "root" as never)).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("audit log", () => {
  it("is readable by admins only", async () => {
    await createRedirect(editor, { from: "/a", to: "/b", status: 301 });
    await expect(listAudit(editor)).rejects.toBeInstanceOf(ForbiddenError);
    const log = await listAudit(admin);
    expect(log[0]).toMatchObject({ action: "redirect.create", entity: "redirect" });
  });
});
