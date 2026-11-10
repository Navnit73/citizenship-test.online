import { z } from "zod";
import { adminRoute, readJson } from "@/lib/api/admin-route";
import { parseQuestionsCsv } from "@/lib/cms/csv";
import { bulkImportQuestions } from "@/lib/cms/questions";
import { parse } from "@/lib/cms/shared";
import { ValidationError } from "@/lib/cms/errors";

const bodySchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())).optional(),
  csv: z.string().max(5_000_000).optional(),
  dryRun: z.boolean().optional(),
});

export const POST = adminRoute("question:write", async (actor, req) => {
  const body = parse(bodySchema, await readJson(req));
  if (!body.rows && body.csv === undefined) throw new ValidationError("Provide rows or csv");
  const rows = body.rows ?? parseQuestionsCsv(body.csv!);
  return bulkImportQuestions(actor, rows, { dryRun: body.dryRun });
});
