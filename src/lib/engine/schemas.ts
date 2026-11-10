import { z } from "zod";

export const examVersionSchema = z.object({
  key: z.string().min(1),
  questionsAsked: z.number().int().positive(),
  poolSize: z.number().int().positive(),
  passRule: z
    .object({ type: z.enum(["count", "percent"]), value: z.number().positive() })
    .refine((r) => r.type === "count" || r.value <= 100, "percent must be <= 100"),
  requiredTags: z.array(z.object({ tag: z.string(), mustAllBeCorrect: z.boolean() })).optional(),
  stopWhenPassed: z.boolean(),
  timeLimitSec: z.number().int().positive().optional(),
});

export const examConfigSchema = z
  .object({ versions: z.array(examVersionSchema).min(1), activeVersion: z.string() })
  .refine((c) => c.versions.some((v) => v.key === c.activeVersion), {
    message: "activeVersion must match a version key",
  });
