import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { reportService } from "../reports/report.service.js";
import type { UserRole } from "../../constants/roles.js";
import type { CreateTemplateSchema, UpdateTemplateSchema } from "./report-template.schema.js";
import type { ReportTemplateItem } from "./report-template.types.js";

export interface Requester {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

function toItem(row: {
  id: string;
  name: string;
  reportType: ReportTemplateItem["reportType"];
  filters: Prisma.JsonValue;
  chartsEnabled: boolean;
  columns: string[];
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ReportTemplateItem {
  return {
    id: row.id,
    name: row.name,
    reportType: row.reportType,
    filters: (row.filters as Record<string, unknown>) ?? {},
    chartsEnabled: row.chartsEnabled,
    columns: row.columns,
    isFavorite: row.isFavorite,
    isPinned: row.isPinned,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Backs "Report Templates" (Part 7) and "Report Favorites" (Part 8 — favorite/pin/recently
 * opened/duplicate all attach to a Template; see the schema's own doc comment for why). Templates
 * are always personal — no `isShared` concept exists here, unlike `SavedView` (Chunk 2), since
 * Part 7/8 never mention sharing a template with other users. */
class ReportTemplateService {
  async create(requester: Requester, input: CreateTemplateSchema): Promise<ReportTemplateItem> {
    reportService.assertCanGenerateReportType(requester, input.reportType);
    const { name, chartsEnabled, columns, ...filters } = input;

    const row = await prisma.reportTemplate.create({
      data: {
        userId: requester.id,
        name,
        reportType: input.reportType,
        filters: filters as unknown as Prisma.InputJsonValue,
        chartsEnabled: chartsEnabled ?? true,
        columns: columns ?? [],
      },
    });
    return toItem(row);
  }

  async list(requester: Requester): Promise<ReportTemplateItem[]> {
    const rows = await prisma.reportTemplate.findMany({
      where: { userId: requester.id },
      orderBy: [{ isPinned: "desc" }, { isFavorite: "desc" }, { updatedAt: "desc" }],
    });
    return rows.map(toItem);
  }

  async update(requester: Requester, id: string, input: UpdateTemplateSchema): Promise<ReportTemplateItem> {
    const existing = await this.findOwnedOrThrow(requester, id);
    if (input.reportType) reportService.assertCanGenerateReportType(requester, input.reportType);

    const { name, chartsEnabled, columns, reportType, ...rest } = input;
    const filtersChanged = Object.keys(rest).length > 0;

    const row = await prisma.reportTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(reportType ? { reportType } : {}),
        ...(filtersChanged
          ? { filters: { ...(existing.filters as Record<string, unknown>), ...rest } as unknown as Prisma.InputJsonValue }
          : {}),
        ...(chartsEnabled !== undefined ? { chartsEnabled } : {}),
        ...(columns !== undefined ? { columns } : {}),
      },
    });
    return toItem(row);
  }

  async remove(requester: Requester, id: string): Promise<void> {
    await this.findOwnedOrThrow(requester, id);
    await prisma.reportTemplate.delete({ where: { id } });
  }

  async setFavorite(requester: Requester, id: string, isFavorite: boolean): Promise<ReportTemplateItem> {
    await this.findOwnedOrThrow(requester, id);
    const row = await prisma.reportTemplate.update({ where: { id }, data: { isFavorite } });
    return toItem(row);
  }

  async setPinned(requester: Requester, id: string, isPinned: boolean): Promise<ReportTemplateItem> {
    await this.findOwnedOrThrow(requester, id);
    const row = await prisma.reportTemplate.update({ where: { id }, data: { isPinned } });
    return toItem(row);
  }

  /** "Recently opened" (Part 8) — called when a template is actually applied to the Report
   * Builder, not on every list fetch, so `lastUsedAt` reflects real usage. */
  async markUsed(requester: Requester, id: string): Promise<ReportTemplateItem> {
    await this.findOwnedOrThrow(requester, id);
    const row = await prisma.reportTemplate.update({ where: { id }, data: { lastUsedAt: new Date() } });
    return toItem(row);
  }

  async duplicate(requester: Requester, id: string): Promise<ReportTemplateItem> {
    const existing = await this.findOwnedOrThrow(requester, id);
    const row = await prisma.reportTemplate.create({
      data: {
        userId: requester.id,
        name: `${existing.name} (Copy)`,
        reportType: existing.reportType,
        filters: existing.filters as Prisma.InputJsonValue,
        chartsEnabled: existing.chartsEnabled,
        columns: existing.columns,
      },
    });
    return toItem(row);
  }

  private async findOwnedOrThrow(requester: Requester, id: string) {
    const row = await prisma.reportTemplate.findUnique({ where: { id } });
    if (!row) throw new ApiError("NOT_FOUND", "Template not found.", 404);
    if (row.userId !== requester.id) {
      throw new ApiError("FORBIDDEN", "You can only modify your own templates.", 403);
    }
    return row;
  }
}

export const reportTemplateService = new ReportTemplateService();
