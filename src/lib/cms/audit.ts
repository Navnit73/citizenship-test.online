import { AuditLogModel } from "@/lib/db/models";
import type { Actor } from "@/lib/auth/permissions";
import { assertCan } from "./shared";

export async function recordAudit(
  actor: Actor,
  action: string,
  entity: string,
  entityId?: string,
  meta?: Record<string, unknown>,
) {
  await AuditLogModel.create({ actorId: actor.id, action, entity, entityId, meta } as never);
}

export async function listAudit(actor: Actor, { limit = 100 }: { limit?: number } = {}) {
  assertCan(actor, "audit:read");
  return AuditLogModel.find().sort({ at: -1 }).limit(Math.min(limit, 500)).lean();
}
