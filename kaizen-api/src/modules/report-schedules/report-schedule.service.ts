import type { Prisma, ReportScheduleFrequency } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { auditService } from "../audit/audit.service.js";
import { reportService } from "../reports/report.service.js";
import type { UserRole } from "../../constants/roles.js";
import type { CreateScheduleSchema, UpdateScheduleSchema } from "./report-schedule.schema.js";
import type { ReportScheduleItem } from "./report-schedule.types.js";

export interface Requester {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

/** Part 6 frequencies map onto a next-run offset from `from` (defaults to now). Calendar-aware
 * (`setMonth`/`setFullYear` correctly roll over year/day boundaries) rather than fixed millisecond
 * multiples, so e.g. a MONTHLY schedule created on the 31st lands on the nearest valid date the
 * JS Date engine resolves to, not a drifting 30-day approximation. */
export function computeNextRun(frequency: ReportScheduleFrequency, from: Date = new Date()): Date {
  const next = new Date(from);
  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

function toItem(row: {
  id: string;
  reportType: ReportScheduleItem["reportType"];
  format: ReportScheduleItem["format"];
  filters: Prisma.JsonValue;
  frequency: ReportScheduleFrequency;
  recipientIds: string[];
  isEnabled: boolean;
  lastRunAt: Date | null;
  nextRunAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; displayName: string };
}): ReportScheduleItem {
  return {
    id: row.id,
    reportType: row.reportType,
    format: row.format,
    filters: (row.filters as Record<string, unknown>) ?? {},
    frequency: row.frequency,
    recipientIds: row.recipientIds,
    isEnabled: row.isEnabled,
    lastRunAt: row.lastRunAt?.toISOString() ?? null,
    nextRunAt: row.nextRunAt.toISOString(),
    createdBy: row.user,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Backs "Scheduled Reports" (Part 6/12/13). Every schedule is executed by
 * `src/jobs/report-schedule.job.ts` through `ReportExportService.createScheduledExport`, so
 * scheduled runs go through the exact same generation/RBAC engine as an interactive export. */
class ReportScheduleService {
  async create(requester: Requester, input: CreateScheduleSchema): Promise<ReportScheduleItem> {
    reportService.assertCanGenerateReportType(requester, input.reportType);
    await this.assertValidRecipients(input.recipientIds);

    const { frequency, format, recipientIds, isEnabled, ...filters } = input;
    const row = await prisma.reportSchedule.create({
      data: {
        userId: requester.id,
        reportType: input.reportType,
        filters: filters as unknown as Prisma.InputJsonValue,
        format,
        frequency,
        recipientIds,
        isEnabled: isEnabled ?? true,
        nextRunAt: computeNextRun(frequency),
      },
      include: { user: { select: { id: true, displayName: true } } },
    });

    await auditService.record({
      userId: requester.id,
      userRole: requester.role,
      action: "report.schedule.created",
      entityType: "ReportSchedule",
      entityId: row.id,
      newValue: { reportType: row.reportType, frequency: row.frequency },
    });

    return toItem(row);
  }

  async list(requester: Requester): Promise<ReportScheduleItem[]> {
    const where: Prisma.ReportScheduleWhereInput = requester.role === "SUPER_ADMIN" ? {} : { userId: requester.id };
    const rows = await prisma.reportSchedule.findMany({
      where,
      include: { user: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toItem);
  }

  async update(requester: Requester, id: string, input: UpdateScheduleSchema): Promise<ReportScheduleItem> {
    const existing = await this.findOwnedOrThrow(requester, id);
    if (input.reportType) reportService.assertCanGenerateReportType(requester, input.reportType);
    if (input.recipientIds) await this.assertValidRecipients(input.recipientIds);

    const { frequency, format, recipientIds, isEnabled, reportType, ...rest } = input;
    const filtersChanged = Object.keys(rest).length > 0 || reportType !== undefined;

    const row = await prisma.reportSchedule.update({
      where: { id },
      data: {
        ...(reportType ? { reportType } : {}),
        ...(filtersChanged
          ? { filters: { ...(existing.filters as Record<string, unknown>), ...rest } as unknown as Prisma.InputJsonValue }
          : {}),
        ...(format ? { format } : {}),
        ...(frequency ? { frequency, nextRunAt: computeNextRun(frequency) } : {}),
        ...(recipientIds ? { recipientIds } : {}),
        ...(isEnabled !== undefined ? { isEnabled } : {}),
      },
      include: { user: { select: { id: true, displayName: true } } },
    });

    await auditService.record({
      userId: requester.id,
      userRole: requester.role,
      action: "report.schedule.edited",
      entityType: "ReportSchedule",
      entityId: row.id,
      previousValue: { isEnabled: existing.isEnabled, frequency: existing.frequency },
      newValue: { isEnabled: row.isEnabled, frequency: row.frequency },
    });

    return toItem(row);
  }

  async remove(requester: Requester, id: string): Promise<void> {
    const existing = await this.findOwnedOrThrow(requester, id);
    await prisma.reportSchedule.delete({ where: { id } });

    await auditService.record({
      userId: requester.id,
      userRole: requester.role,
      action: "report.schedule.removed",
      entityType: "ReportSchedule",
      entityId: id,
      previousValue: { reportType: existing.reportType, frequency: existing.frequency },
    });
  }

  /** Used only by `src/jobs/report-schedule.job.ts` — every enabled schedule whose `nextRunAt`
   * has passed. */
  async listDue(now: Date) {
    return prisma.reportSchedule.findMany({
      where: { isEnabled: true, nextRunAt: { lte: now } },
      include: { user: { select: { id: true, role: true, departmentId: true } } },
    });
  }

  async markRun(id: string, ranAt: Date, nextRunAt: Date): Promise<void> {
    await prisma.reportSchedule.update({ where: { id }, data: { lastRunAt: ranAt, nextRunAt } });
  }

  private async assertValidRecipients(recipientIds: string[]): Promise<void> {
    const count = await prisma.user.count({ where: { id: { in: recipientIds }, isActive: true } });
    if (count !== recipientIds.length) {
      throw new ApiError("VALIDATION_ERROR", "One or more recipients are not valid, active users.", 400);
    }
  }

  private async findOwnedOrThrow(requester: Requester, id: string) {
    const row = await prisma.reportSchedule.findUnique({ where: { id } });
    if (!row) throw new ApiError("NOT_FOUND", "Schedule not found.", 404);
    if (row.userId !== requester.id && requester.role !== "SUPER_ADMIN") {
      throw new ApiError("FORBIDDEN", "You cannot modify this schedule.", 403);
    }
    return row;
  }
}

export const reportScheduleService = new ReportScheduleService();
