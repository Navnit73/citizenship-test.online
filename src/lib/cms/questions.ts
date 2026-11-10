import { z } from "zod";
import type { Actor } from "@/lib/auth/permissions";
import { ChapterModel, QuestionModel } from "@/lib/db/models";
import { recordAudit } from "./audit";
import { ValidationError } from "./errors";
import { assertCan, assertFound, escapeRegExp, isObjectId, pageParams, parse } from "./shared";

const CHOICE = ["single", "multiple", "truefalse"];

export const questionSchema = z
  .object({
    countryCode: z.enum(["us", "uk", "ca", "au"]),
    versions: z.array(z.string().min(1)).min(1),
    chapterId: z.string().refine(isObjectId, "invalid chapter id"),
    type: z.enum(["single", "multiple", "truefalse", "shorttext", "dictation"]),
    prompt: z.string().trim().min(1).max(1000),
    options: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).default([]),
    correctOptionIds: z.array(z.string()).default([]),
    acceptedAnswers: z.array(z.string().min(1)).default([]),
    explanation: z.string().max(2000).optional(),
    sourceRef: z.string().trim().min(1, "source reference is required"),
    tags: z.array(z.string()).default([]),
    difficulty: z.number().int().min(1).max(3).default(1),
    audioUrl: z.string().max(500).optional(),
    status: z.enum(["draft", "published"]).default("draft"),
  })
  .superRefine((q, ctx) => {
    const add = (message: string, path: string) =>
      ctx.addIssue({ code: "custom", message, path: [path] });
    if (CHOICE.includes(q.type)) {
      const ids = q.options.map((o) => o.id);
      if (q.options.length < 2) add("needs at least 2 options", "options");
      if (new Set(ids).size !== ids.length) add("option ids must be unique", "options");
      if (q.correctOptionIds.length === 0) add("needs a correct answer", "correctOptionIds");
      if (q.correctOptionIds.some((id) => !ids.includes(id)))
        add("correct answer must be one of the options", "correctOptionIds");
      if (q.type !== "multiple" && q.correctOptionIds.length > 1)
        add("only one correct answer allowed", "correctOptionIds");
    } else if (
      q.acceptedAnswers.length === 0 &&
      !(q.type === "shorttext" && q.tags.includes("state-specific"))
    ) {
      add("needs at least one accepted answer", "acceptedAnswers");
    }
  });
export type QuestionInput = z.input<typeof questionSchema>;

async function assertChapterMatches(chapterId: string, countryCode: string) {
  const chapter = await ChapterModel.findById(chapterId);
  if (!chapter || chapter.countryCode !== countryCode) {
    throw new ValidationError("chapter does not exist for this country");
  }
}

export async function createQuestion(actor: Actor, input: QuestionInput) {
  assertCan(actor, "question:write");
  const data = parse(questionSchema, input);
  await assertChapterMatches(data.chapterId, data.countryCode);
  const q = await QuestionModel.create(data);
  await recordAudit(actor, "question.create", "question", String(q.id));
  return q;
}

const FIELDS = [
  "countryCode",
  "versions",
  "chapterId",
  "type",
  "prompt",
  "options",
  "correctOptionIds",
  "acceptedAnswers",
  "explanation",
  "sourceRef",
  "tags",
  "difficulty",
  "audioUrl",
  "status",
] as const;

export async function updateQuestion(actor: Actor, id: string, patch: Partial<QuestionInput>) {
  assertCan(actor, "question:write");
  const q = assertFound(isObjectId(id) ? await QuestionModel.findById(id) : null, "Question");
  const current = Object.fromEntries(FIELDS.map((f) => [f, q.get(f)]));
  const merged = { ...JSON.parse(JSON.stringify(current)), ...patch };
  const data = parse(questionSchema, merged);
  await assertChapterMatches(data.chapterId, data.countryCode);
  q.set(data);
  await q.save();
  await recordAudit(actor, "question.update", "question", id, { fields: Object.keys(patch) });
  return q;
}

export async function getQuestion(actor: Actor, id: string) {
  assertCan(actor, "question:write");
  return assertFound(isObjectId(id) ? await QuestionModel.findById(id) : null, "Question");
}

export async function deleteQuestion(actor: Actor, id: string) {
  assertCan(actor, "question:write");
  assertFound(isObjectId(id) ? await QuestionModel.findByIdAndDelete(id) : null, "Question");
  await recordAudit(actor, "question.delete", "question", id);
}

export async function listQuestions(
  actor: Actor,
  f: {
    countryCode?: string;
    chapterId?: string;
    status?: string;
    tag?: string;
    q?: string;
    page?: number;
    limit?: number;
  },
) {
  assertCan(actor, "question:write");
  const { limit, page, skip } = pageParams(f);
  const query: Record<string, unknown> = {};
  if (f.countryCode) query.countryCode = f.countryCode;
  if (f.chapterId && isObjectId(f.chapterId)) query.chapterId = f.chapterId;
  if (f.status) query.status = f.status;
  if (f.tag) query.tags = f.tag;
  if (f.q) query.prompt = { $regex: escapeRegExp(f.q), $options: "i" };
  const [items, total] = await Promise.all([
    QuestionModel.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    QuestionModel.countDocuments(query),
  ]);
  return { items, total, page, limit };
}

export type ImportResult = {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
};

const MAX_IMPORT_ROWS = 1000;

/** Rows use `chapter` (slug within the country) or `chapterId`. Upserts by country + prompt. */
export async function bulkImportQuestions(
  actor: Actor,
  rows: Record<string, unknown>[],
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<ImportResult> {
  assertCan(actor, "question:write");
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new ValidationError(`Import at most ${MAX_IMPORT_ROWS} rows at a time`);
  }
  const chapters = await ChapterModel.find();
  const bySlug = new Map(chapters.map((c) => [`${c.countryCode}/${c.slug}`, String(c._id)]));
  const result: ImportResult = { created: 0, updated: 0, errors: [] };
  const seen = new Set<string>();

  for (const [i, raw] of rows.entries()) {
    const rowNum = i + 1;
    try {
      const { chapter, ...rest } = raw;
      let chapterId = rest.chapterId;
      if (!chapterId) {
        chapterId = bySlug.get(`${rest.countryCode}/${chapter}`);
        if (!chapterId)
          throw new ValidationError(`Unknown chapter "${chapter}" for ${rest.countryCode}`);
      }
      const data = parse(questionSchema, { ...rest, chapterId });
      const key = `${data.countryCode}::${data.prompt}`;
      const existing = await QuestionModel.findOne({
        countryCode: data.countryCode,
        prompt: data.prompt,
      });
      const isUpdate = !!existing || seen.has(key);
      seen.add(key);
      if (!dryRun) {
        if (existing) await existing.set(data).save();
        else await QuestionModel.create(data);
      }
      if (isUpdate) result.updated++;
      else result.created++;
    } catch (err) {
      if (!(err instanceof ValidationError)) throw err;
      result.errors.push({ row: rowNum, message: err.message });
    }
  }
  if (!dryRun) {
    await recordAudit(actor, "question.import", "question", undefined, {
      created: result.created,
      updated: result.updated,
      errors: result.errors.length,
    });
  }
  return result;
}
