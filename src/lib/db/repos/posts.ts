import type { InferSchemaType } from "mongoose";
import { PostModel } from "../models";

type PostType = "blog" | "guide" | "howto" | "legal" | "page";
type PostInput = Partial<InferSchemaType<typeof PostModel.schema>>;

/** A post is public once published, or scheduled with publishedAt in the past. */
function visible(now: Date) {
  return {
    status: { $in: ["published", "scheduled"] as ("published" | "scheduled")[] },
    publishedAt: { $lte: now },
  };
}

export const postsRepo = {
  create(input: PostInput) {
    return PostModel.create(input);
  },
  findPublishedBySlug(type: PostType, slug: string, now = new Date()) {
    return PostModel.findOne({ type, slug, ...visible(now) });
  },
  listPublished(type: PostType, now = new Date()) {
    return PostModel.find({ type, ...visible(now) }).sort({ publishedAt: -1 });
  },
};
