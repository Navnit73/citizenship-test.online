import { connection } from "next/server";
import { requireActor } from "@/lib/auth/session";
import type { Actor, Permission } from "@/lib/auth/permissions";
import { connectDb } from "@/lib/db/connect";
import "@/lib/db/models";
import { errorResponse, ForbiddenError, ValidationError } from "@/lib/cms/errors";

/**
 * CSRF defence-in-depth on top of SameSite=Lax cookies: reject mutations whose
 * Origin header names a different host.
 */
export function assertSameOrigin(req: Request): void {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.get("origin");
  if (!origin) return;
  let host: string | null = null;
  try {
    host = new URL(origin).host;
  } catch {
    /* "null" and other junk origins fall through to rejection */
  }
  if (host !== new URL(req.url).host) throw new ForbiddenError("Cross-origin request blocked");
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
}

type Ctx = { params: Promise<Record<string, string>> };

/** Wraps a handler: DB connect, same-origin check, auth + permission, error mapping. */
export function adminRoute(
  permission: Permission,
  fn: (actor: Actor, req: Request, params: Record<string, string>) => Promise<unknown>,
) {
  return async (req: Request, ctx: Ctx = { params: Promise.resolve({}) }): Promise<Response> => {
    await connection(); // request-time only; outside try so Next can bail out of prerender
    try {
      assertSameOrigin(req);
      await connectDb();
      const actor = await requireActor(permission);
      const out = await fn(actor, req, await ctx.params);
      return out instanceof Response ? out : Response.json(out);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export const created = (body: unknown) => Response.json(body, { status: 201 });
export const noContent = () => new Response(null, { status: 204 });
