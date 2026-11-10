import { z } from "zod";
import type { Actor, Role } from "@/lib/auth/permissions";
import { UserModel } from "@/lib/db/models";
import { recordAudit } from "./audit";
import { ValidationError } from "./errors";
import { assertCan, assertFound, isObjectId, parse } from "./shared";

export async function listUsers(actor: Actor) {
  assertCan(actor, "user:manage");
  return UserModel.find().sort({ createdAt: -1 }).limit(500);
}

export async function setUserRole(actor: Actor, userId: string, role: Role) {
  assertCan(actor, "user:manage");
  parse(z.enum(["admin", "editor", "author", "user"]), role);
  const user = assertFound(isObjectId(userId) ? await UserModel.findById(userId) : null, "User");
  if (
    user.role === "admin" &&
    role !== "admin" &&
    (await UserModel.countDocuments({ role: "admin" })) <= 1
  ) {
    throw new ValidationError("There must be at least one admin");
  }
  user.role = role;
  await user.save();
  await recordAudit(actor, "user.role", "user", userId, { role });
  return user;
}
