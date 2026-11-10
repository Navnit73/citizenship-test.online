import { connection } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/cms/errors";
import { connectDb } from "@/lib/db/connect";
import "@/lib/db/models";
import { buildTestExam } from "@/lib/exam";

const seedSchema = z
  .string()
  .regex(/^[\w-]{1,64}$/)
  .optional();

export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await ctx.params;
  const seed = seedSchema.safeParse(new URL(request.url).searchParams.get("seed") ?? undefined);
  if (!seed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  try {
    await connectDb();
    const exam = await buildTestExam(slug, seed.data ?? crypto.randomUUID());
    return Response.json(exam, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}
