import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

type Client = PrismaClient | Prisma.TransactionClient;

interface AuditParams {
  tenantId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldData?: Prisma.InputJsonValue;
  newData?: Prisma.InputJsonValue;
}

/**
 * Records an audit log entry (section 34). Accepts a transaction client so it
 * can participate in the same transaction as the mutation it describes.
 */
export function recordAudit(params: AuditParams, client: Client = prisma) {
  return client.auditLog.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      oldData: params.oldData,
      newData: params.newData,
    },
  });
}
