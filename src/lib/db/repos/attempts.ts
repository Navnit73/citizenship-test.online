import type { Types } from "mongoose";
import type { CountryCode } from "@/lib/engine/types";
import { AttemptModel } from "../models";

export type AttemptInput = {
  userId?: string | Types.ObjectId;
  guestId?: string;
  testId: string | Types.ObjectId;
  countryCode: CountryCode;
  seed: string;
  answers: {
    questionId: string | Types.ObjectId;
    response?: unknown;
    correct?: boolean;
    timeMs?: number;
  }[];
  score: number;
  passed: boolean;
  startedAt: Date;
  finishedAt?: Date;
  mode?: "read" | "listen" | "write" | "speak";
};

export const attemptsRepo = {
  create(input: AttemptInput) {
    return AttemptModel.create(input);
  },
  listForUser(userId: string, limit = 50) {
    return AttemptModel.find({ userId }).sort({ finishedAt: -1 }).limit(limit);
  },
};
