import type { InferSchemaType } from "mongoose";
import type { CountryCode } from "@/lib/engine/types";
import { TestModel } from "../models";

export const testsRepo = {
  create(input: Partial<InferSchemaType<typeof TestModel.schema>>) {
    return TestModel.create(input);
  },
  listPublished(countryCode?: CountryCode) {
    return TestModel.find({ isPublished: true, ...(countryCode && { countryCode }) }).sort({
      createdAt: -1,
    });
  },
  findPublishedBySlug(slug: string) {
    return TestModel.findOne({ slug, isPublished: true });
  },
};
