import { z } from "zod";
import { can, type Actor } from "@/lib/auth/permissions";
import { PostModel, POST_TYPES } from "@/lib/db/models";
import { recordAudit } from "./audit";
import { ConflictError, ForbiddenError, ValidationError } from "./errors";
import { sanitizeRichText } from "./sanitize";
import {
  assertCan,
  assertFound,
  escapeRegExp,
  isDuplicateKey,
  isObjectId,
  pageParams,
  parse,
} from "./shared";
import { SLUG_PATTERN, slugify } from "./slug";

const seoSchema = z
  .object({
    title: z.string().max(120),
    description: z.string().max(320),
    ogImage: z.string().max(500),
    noindex: z.boolean(),
  })
  .partial();

export const postInputSchema = z.object({
  type: z.enum(POST_TYPES),
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .max(120)
    .regex(SLUG_PATTERN, "must be lowercase letters, numbers and dashes")
    .optional(),
  countryCode: z.enum(["us", "uk", "ca", "au"]).optional(),
  body: z.string().min(1).max(500_000),
  excerpt: z.string().max(500).optional(),
  seo: seoSchema.optional(),
  status: z.enum(["draft", "scheduled", "published"]).default("draft"),
  publishedAt: z.coerce.date().optional(),
});
export type PostInput = z.input<typeof postInputSchema>;

const postPatchSchema = postInputSchema.partial().omit({ type: true });

function assertSchedule(status: string, publishedAt: Date | undefined) {
  if (status === "scheduled" && (!publishedAt || publishedAt.getTime() <= Date.now())) {
    throw new ValidationError("Scheduled posts need a publish date in the future");
  }
}

export async function createPost(actor: Actor, input: PostInput) {
  assertCan(actor, "post:write-own");
  const data = parse(postInputSchema, input);
  if (data.status !== "draft" && !can(actor.role, "post:publish")) {
    throw new ForbiddenError("Only editors can publish or schedule");
  }
  assertSchedule(data.status, data.publishedAt);
  const slug = data.slug ?? slugify(data.title);
  if (!slug) throw new ValidationError("Could not build a slug from the title");

  try {
    const post = await PostModel.create({
      ...data,
      slug,
      body: sanitizeRichText(data.body),
      authorId: actor.id,
      publishedAt:
        data.status === "published" ? (data.publishedAt ?? new Date()) : data.publishedAt,
    });
    await recordAudit(actor, "post.create", "post", String(post.id), { type: post.type, slug });
    return post;
  } catch (err) {
    if (isDuplicateKey(err))
      throw new ConflictError(`A ${data.type} with slug "${slug}" already exists`);
    throw err;
  }
}

async function loadEditable(actor: Actor, id: string) {
  assertCan(actor, "post:write-own");
  const post = assertFound(isObjectId(id) ? await PostModel.findById(id) : null, "Post");
  if (String(post.authorId) !== actor.id && !can(actor.role, "post:write-any")) {
    throw new ForbiddenError("You can only edit your own posts");
  }
  return post;
}

export async function getPost(actor: Actor, id: string) {
  return loadEditable(actor, id);
}

export async function updatePost(actor: Actor, id: string, patch: Partial<PostInput>) {
  const post = await loadEditable(actor, id);
  const data = parse(postPatchSchema, patch);

  if (!can(actor.role, "post:publish")) {
    if (post.status !== "draft") throw new ForbiddenError("Only editors can change live content");
    if (data.status && data.status !== "draft")
      throw new ForbiddenError("Only editors can publish");
  }

  const status = data.status ?? post.status;
  if (data.status !== undefined || data.publishedAt !== undefined) {
    assertSchedule(status, data.publishedAt ?? post.publishedAt ?? undefined);
  }

  if (data.body !== undefined) {
    const body = sanitizeRichText(data.body);
    if (body !== post.body) {
      post.revisions.push({ body: post.body, editedBy: actor.id as never, at: new Date() });
      post.revisions.splice(0, Math.max(0, post.revisions.length - 20));
    }
    post.body = body;
  }
  const { body: _body, ...rest } = data;
  void _body;
  post.set(rest);
  if (status === "published" && !post.publishedAt) post.publishedAt = new Date();

  try {
    await post.save();
  } catch (err) {
    if (isDuplicateKey(err)) throw new ConflictError(`Slug "${post.slug}" is already used`);
    throw err;
  }
  await recordAudit(actor, "post.update", "post", String(post.id), { fields: Object.keys(data) });
  return post;
}

export async function deletePost(actor: Actor, id: string) {
  assertCan(actor, "post:delete");
  const post = assertFound(isObjectId(id) ? await PostModel.findByIdAndDelete(id) : null, "Post");
  await recordAudit(actor, "post.delete", "post", String(post.id), { slug: post.slug });
}

export async function listPosts(
  actor: Actor,
  filter: {
    type?: (typeof POST_TYPES)[number];
    status?: string;
    q?: string;
    page?: number;
    limit?: number;
  },
) {
  assertCan(actor, "post:write-own");
  const { limit, page, skip } = pageParams(filter);
  const query: Record<string, unknown> = {};
  if (!can(actor.role, "post:write-any")) query.authorId = actor.id;
  if (filter.type) query.type = filter.type;
  if (filter.status) query.status = filter.status;
  if (filter.q) query.title = { $regex: escapeRegExp(filter.q), $options: "i" };
  const [items, total] = await Promise.all([
    PostModel.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    PostModel.countDocuments(query),
  ]);
  return { items, total, page, limit };
}
