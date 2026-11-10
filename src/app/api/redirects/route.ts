import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { publicRedirectMap } from "@/lib/cms/redirects";
import { connectDb } from "@/lib/db/connect";
import "@/lib/db/models";

async function getRedirectMap() {
  "use cache";
  cacheLife("minutes");
  cacheTag("redirects");
  await connectDb();
  return publicRedirectMap();
}

/** Public, read-only list consumed by proxy.ts. */
export async function GET() {
  await connection(); // request-time only: never bake the list in at build
  try {
    return Response.json(await getRedirectMap());
  } catch (err) {
    console.error(err);
    return Response.json([], { status: 200 }); // fail open: redirects are best-effort
  }
}
