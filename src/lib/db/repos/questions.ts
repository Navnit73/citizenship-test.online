import type { Types } from "mongoose";
import type { CountryCode } from "@/lib/engine/types";
import { QuestionModel } from "../models";

export type QuestionInput = {
  countryCode: CountryCode;
  versions: string[];
  chapterId: string | Types.ObjectId;
  type: "single" | "multiple" | "truefalse" | "shorttext" | "dictation";
  prompt: string;
  options?: { id: string; text: string }[];
  correctOptionIds?: string[];
  acceptedAnswers?: string[];
  explanation?: string;
  sourceRef: string;
  tags?: string[];
  difficulty?: number;
  audioUrl?: string;
  status?: "draft" | "published";
};

export const questionsRepo = {
  create(input: QuestionInput) {
    return QuestionModel.create(input);
  },
  findPublished(filter: {
    countryCode: CountryCode;
    version?: string;
    chapterId?: string;
    tag?: string;
  }) {
    return QuestionModel.find({
      countryCode: filter.countryCode,
      status: "published",
      ...(filter.version && { versions: filter.version }),
      ...(filter.chapterId && { chapterId: filter.chapterId }),
      ...(filter.tag && { tags: filter.tag }),
    });
  },
};
