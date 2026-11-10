import { z } from "zod";
import type { Actor } from "@/lib/auth/permissions";
import { QuestionModel, TestModel } from "@/lib/db/models";
import { recordAudit } from "./audit";
import { ConflictError, ValidationError } from "./errors";
import { assertCan, assertFound, isDuplicateKey, isObjectId, pageParams, parse } from "./shared";
import { SLUG_PATTERN, slugify } from "./slug";

const objectId = z.string().refine(isObjectId, "invalid id");

export const testRulesSchema = z.object({
  questionsAsked: z.number().int().positive().optional(),
  passRule: z
    .object({ type: z.enum(["count", "percent"]), value: z.number().positive() })
    .refine((r) => r.type === "count" || r.value <= 100, "percent must be <= 100")
    .optional(),
  chapterIds: z.array(objectId).optional(),
});
export type TestRules = z.infer<typeof testRulesSchema>;

export const testSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().max(120).regex(SLUG_PATTERN).optional(),
  countryCode: z.enum(["us", "uk", "ca", "au"]),
  kind: z.enum(["mock", "chapter", "custom"]),
  questionIds: z.array(objectId).optional(),
  rules: testRulesSchema.optional(),
  timeLimitSec: z.number().int().positive().optional(),
  isPublished: z.boolean().default(false),
  seo: z
    .object({ title: z.string().max(120), description: z.string().max(320), noindex: z.boolean() })
    .partial()
    .optional(),
});
export type TestInput = z.input<typeof testSchema>;

async function validateKind(data: z.output<typeof testSchema>) {
  if (data.kind === "custom") {
    const ids = data.questionIds ?? [];
    if (ids.length === 0) throw new ValidationError("Custom tests need at least one question");
    const found = await QuestionModel.countDocuments({
      _id: { $in: ids },
      countryCode: data.countryCode,
    });
    if (found !== new Set(ids).size) {
      throw new ValidationError("Some questions don't exist for this country");
    }
  }
  if (data.kind === "chapter" && !(data.rules?.chapterIds?.length ?? 0)) {
    throw new ValidationError("Chapter tests need at least one chapter");
  }
}

export async function createTest(actor: Actor, input: TestInput) {
  assertCan(actor, "test:write");
  const data = parse(testSchema, input);
  await validateKind(data);
  const slug = data.slug ?? slugify(data.title);
  if (!slug) throw new ValidationError("Could not build a slug from the title");
  try {
    const t = await TestModel.create({ ...data, slug });
    await recordAudit(actor, "test.create", "test", String(t.id), { slug });
    return t;
  } catch (err) {
    if (isDuplicateKey(err)) throw new ConflictError(`A test with slug "${slug}" already exists`);
    throw err;
  }
}

const FIELDS = [
  "title",
  "slug",
  "countryCode",
  "kind",
  "questionIds",
  "rules",
  "timeLimitSec",
  "isPublished",
  "seo",
] as const;

export async function updateTest(actor: Actor, id: string, patch: Partial<TestInput>) {
  assertCan(actor, "test:write");
  const t = assertFound(isObjectId(id) ? await TestModel.findById(id) : null, "Test");
  const current = JSON.parse(JSON.stringify(Object.fromEntries(FIELDS.map((f) => [f, t.get(f)]))));
  const data = parse(testSchema, { ...current, ...patch });
  await validateKind(data);
  t.set(data);
  try {
    await t.save();
  } catch (err) {
    if (isDuplicateKey(err)) throw new ConflictError(`Slug "${data.slug}" is already used`);
    throw err;
  }
  await recordAudit(actor, "test.update", "test", id, { fields: Object.keys(patch) });
  return t;
}

export async function deleteTest(actor: Actor, id: string) {
  assertCan(actor, "test:write");
  assertFound(isObjectId(id) ? await TestModel.findByIdAndDelete(id) : null, "Test");
  await recordAudit(actor, "test.delete", "test", id);
}

export async function listTests(
  actor: Actor,
  f: { countryCode?: string; page?: number; limit?: number } = {},
) {
  assertCan(actor, "test:write");
  const { limit, page, skip } = pageParams(f);
  const query = f.countryCode ? { countryCode: f.countryCode } : {};
  const [items, total] = await Promise.all([
    TestModel.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    TestModel.countDocuments(query),
  ]);
  return { items, total, page, limit };
}

export async function getTest(actor: Actor, id: string) {
  assertCan(actor, "test:write");
  return assertFound(isObjectId(id) ? await TestModel.findById(id) : null, "Test");
}
