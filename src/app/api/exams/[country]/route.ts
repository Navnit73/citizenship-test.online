import { connection } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import "@/lib/db/models";
import { buildExam, ExamError } from "@/lib/exam";

const paramsSchema = z.object({ country: z.enum(["us", "uk", "ca", "au"]) });
const querySchema = z.object({
  seed: z
    .string()
    .regex(/^[\w-]{1,64}$/)
    .optional(),
  version: z.string().max(40).optional(),
});

export async function GET(request: Request, ctx: { params: Promise<{ country: string }> }) {
  await connection();
  const params = paramsSchema.safeParse(await ctx.params);
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!params.success || !query.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    await connectDb();
    const seed = query.data.seed ?? crypto.randomUUID();
    const exam = await buildExam(params.data.country, seed, query.data.version);
    return Response.json(exam, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof ExamError) return Response.json({ error: err.message }, { status: 400 });
    console.error(err);
    return Response.json({ error: "Could not load exam" }, { status: 500 });
  }
}
