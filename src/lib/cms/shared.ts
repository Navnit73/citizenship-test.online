import mongoose from "mongoose";
import type { ZodType, z } from "zod";
import { can, type Actor, type Permission } from "@/lib/auth/permissions";
import { ForbiddenError, NotFoundError, ValidationError } from "./errors";

export function assertCan(actor: Actor, permission: Permission): void {
  if (!can(actor.role, permission)) throw new ForbiddenError();
}

export function parse<S extends ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; "),
    );
  }
  return result.data;
}

export const isObjectId = (v: unknown): v is string =>
  typeof v === "string" && mongoose.isValidObjectId(v) && /^[a-f0-9]{24}$/i.test(v);

export function assertFound<T>(doc: T, what = "Item"): NonNullable<T> {
  if (!doc) throw new NotFoundError(`${what} not found`);
  return doc;
}

export const isDuplicateKey = (err: unknown) =>
  typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;

export const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function pageParams(p: { page?: number; limit?: number }) {
  const limit = Math.min(Math.max(p.limit ?? 20, 1), 100);
  const page = Math.max(p.page ?? 1, 1);
  return { limit, page, skip: (page - 1) * limit };
}
