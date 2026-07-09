import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type { UserRole } from "../../constants/roles.js";

interface AuditLogEntry {
  userId: string | null;
  userRole: UserRole | null;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: unknown;
  newValue?: unknown;
}

/** Immutable system-wide audit trail (`audit_logs`) — no UPDATE/DELETE, only `record()`. */
class AuditService {
  async record(
    entry: AuditLogEntry,
    client: Prisma.TransactionClient | PrismaClient = prisma,
  ): Promise<void> {
    await client.auditLog.create({
      data: {
        userId: entry.userId,
        userRole: entry.userRole,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        previousValue: entry.previousValue as Prisma.InputJsonValue,
        newValue: entry.newValue as Prisma.InputJsonValue,
      },
    });
  }
}

export const auditService = new AuditService();
