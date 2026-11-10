import { z } from "zod";
import type { Actor } from "@/lib/auth/permissions";
import { RedirectModel } from "@/lib/db/models";
import { recordAudit } from "./audit";
import { ConflictError, ValidationError } from "./errors";
import { assertCan, assertFound, isDuplicateKey, isObjectId, parse } from "./shared";

const localPath = z
  .string()
  .max(300)
  .regex(/^\/(?!\/)[^\s]*$/, "must be a path starting with a single /");

export const redirectSchema = z.object({
  from: localPath,
  to: z.union([
    localPath,
    z
      .string()
      .url()
      .refine((u) => /^https?:\/\//i.test(u), "only http(s) URLs are allowed"),
  ]),
  status: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]).default(301),
});
export type RedirectInput = z.input<typeof redirectSchema>;

const normalize = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);

export async function createRedirect(actor: Actor, input: RedirectInput) {
  assertCan(actor, "redirect:write");
  const data = parse(redirectSchema, input);
  const from = normalize(data.from);
  const to = data.to.startsWith("/") ? normalize(data.to) : data.to;
  if (from === to) throw new ValidationError("A redirect cannot point to itself");

  // Follow the existing chain from `to`; reaching `from` would create a loop.
  const map = new Map((await RedirectModel.find()).map((r) => [r.from, r.to]));
  let hop = to;
  for (let i = 0; i < 25 && map.has(hop); i++) {
    hop = map.get(hop)!;
    if (hop === from) throw new ValidationError("This redirect would create a loop");
  }

  try {
    const r = await RedirectModel.create({ ...data, from, to });
    await recordAudit(actor, "redirect.create", "redirect", String(r.id), { from, to });
    return r;
  } catch (err) {
    if (isDuplicateKey(err)) throw new ConflictError(`A redirect from ${from} already exists`);
    throw err;
  }
}

export async function listRedirects(actor: Actor) {
  assertCan(actor, "redirect:write");
  return RedirectModel.find().sort({ from: 1 });
}

export async function deleteRedirect(actor: Actor, id: string) {
  assertCan(actor, "redirect:write");
  const r = assertFound(
    isObjectId(id) ? await RedirectModel.findByIdAndDelete(id) : null,
    "Redirect",
  );
  await recordAudit(actor, "redirect.delete", "redirect", id, { from: r.from });
}

/** Public, read-only map used by the proxy. */
export async function publicRedirectMap() {
  const all = await RedirectModel.find().lean();
  return all.map((r) => ({ from: r.from, to: r.to, status: r.status }));
}
