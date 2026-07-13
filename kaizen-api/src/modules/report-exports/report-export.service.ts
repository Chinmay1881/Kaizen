import { createHash } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { deleteReportFile, uploadReportFile } from "../../lib/cloudinary-client.js";
import { ApiError } from "../../utils/api-error.js";
import { buildPaginationMeta, getSkipTake } from "../../utils/pagination.js";
import { auditService } from "../audit/audit.service.js";
import { notificationService } from "../notifications/notification.service.js";
import { reportService } from "../reports/report.service.js";
import type { ReportResult } from "../reports/report.types.js";
import type { UserRole } from "../../constants/roles.js";
import type { CreateExportSchema, ListExportsQuerySchema } from "./report-export.schema.js";
import type { ReportExportItem } from "./report-export.types.js";
import { buildReportCsv } from "./csv-builder.js";
import { buildReportExcel } from "./excel-builder.js";
import { buildReportPdf } from "./pdf-builder.js";

export interface Requester {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

/** Part 14 — "Do not regenerate identical reports unnecessarily." A COMPLETED export with the
 * same requester/report type/format/filters within this window is served again rather than
 * rebuilt from scratch. */
const CACHE_TTL_MS = 10 * 60 * 1000;
/** How long a completed export stays downloadable (documented `expiresAt`, matching the API
 * spec's `downloadUrl`/`expiresAt` shape from Chunk 3A's own planning notes). */
const EXPIRY_TTL_MS = 24 * 60 * 60 * 1000;
/** Detail-table row cap for CSV/Excel exports — passed as `detailRowLimit` to
 * `ReportService.generateReport`. A real, generous cap rather than an unbounded query; anything
 * beyond this needs cursor-based paging, not implemented (see Remaining Limitations). */
const EXPORT_ROW_CAP = 10_000;

const FORMAT_EXTENSION: Record<CreateExportSchema["format"], string> = { PDF: "pdf", EXCEL: "xlsx", CSV: "csv" };
const FORMAT_CONTENT_TYPE: Record<CreateExportSchema["format"], string> = {
  PDF: "application/pdf",
  EXCEL: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  CSV: "text/csv; charset=utf-8",
};

function hashFilters(reportType: string, format: string, filters: Record<string, unknown>): string {
  const sorted = Object.keys(filters)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const value = filters[key];
      if (value !== undefined) acc[key] = value instanceof Date ? value.toISOString() : value;
      return acc;
    }, {});
  return createHash("sha256").update(JSON.stringify({ reportType, format, sorted })).digest("hex");
}

function toItem(row: {
  id: string;
  reportType: ReportResult["reportType"];
  format: CreateExportSchema["format"];
  filters: Prisma.JsonValue;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  fileName: string;
  fileSizeBytes: number | null;
  errorMessage: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  user: { id: string; displayName: string };
}, reused = false): ReportExportItem {
  return {
    id: row.id,
    reportType: row.reportType,
    format: row.format,
    filters: (row.filters as Record<string, unknown>) ?? {},
    status: row.status,
    fileName: row.fileName,
    fileSizeBytes: row.fileSizeBytes,
    errorMessage: row.errorMessage,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    generatedBy: row.user,
    createdAt: row.createdAt.toISOString(),
    reused,
  };
}

async function resolveAppliedFilters(filters: CreateExportSchema): Promise<Array<[string, string]>> {
  const entries: Array<[string, string]> = [];
  if (filters.dateFrom) entries.push(["From", new Date(filters.dateFrom).toLocaleDateString("en-IN")]);
  if (filters.dateTo) entries.push(["To", new Date(filters.dateTo).toLocaleDateString("en-IN")]);

  const [department, category, employee, reviewer, owner] = await Promise.all([
    filters.departmentId ? prisma.department.findUnique({ where: { id: filters.departmentId }, select: { name: true } }) : null,
    filters.categoryId ? prisma.category.findUnique({ where: { id: filters.categoryId }, select: { name: true } }) : null,
    filters.employeeId ? prisma.user.findUnique({ where: { id: filters.employeeId }, select: { displayName: true } }) : null,
    filters.reviewerId ? prisma.user.findUnique({ where: { id: filters.reviewerId }, select: { displayName: true } }) : null,
    filters.implementationOwnerId
      ? prisma.user.findUnique({ where: { id: filters.implementationOwnerId }, select: { displayName: true } })
      : null,
  ]);

  if (department) entries.push(["Department", department.name]);
  if (category) entries.push(["Category", category.name]);
  if (filters.priority) entries.push(["Priority", filters.priority]);
  if (filters.status) entries.push(["Status", filters.status]);
  if (employee) entries.push(["Employee", employee.displayName]);
  if (reviewer) entries.push(["Reviewer", reviewer.displayName]);
  if (owner) entries.push(["Implementation Owner", owner.displayName]);
  if (filters.rewardStatus) entries.push(["Reward Status", filters.rewardStatus]);
  if (filters.businessImpactStatus) entries.push(["Business Impact Status", filters.businessImpactStatus]);
  if (filters.comparisonPeriod && filters.comparisonPeriod !== "NONE") entries.push(["Comparison", filters.comparisonPeriod]);

  return entries;
}

/** Backs the Export Engine (Milestone 11 Chunk 3B Part 1-4, 10, 14). Generation always goes
 * through `ReportService.generateReport` — the exact same engine and RBAC Chunk 3A already built —
 * so an export can never contain data (or bypass a permission) the live Preview wouldn't also
 * show. Runs asynchronously (`status`: PENDING -> PROCESSING -> COMPLETED/FAILED) so a large
 * export doesn't block the request (Part 10's "show loading progress" — the frontend polls
 * `GET .../:id`). */
class ReportExportService {
  async createExport(requester: Requester, input: CreateExportSchema): Promise<ReportExportItem> {
    // Must happen synchronously, before any row is created or 201 returned — `process()` below
    // also re-derives this via `reportService.generateReport`, but only asynchronously after the
    // response has already gone out, which would otherwise let a Department Manager get back a
    // 201 "started" response for an export type they can't actually generate, only to see it fail
    // silently in the background instead of being rejected up front like every other endpoint in
    // this app (Part 11). Found live during this chunk's own verification.
    reportService.assertCanGenerateReportType(requester, input.reportType);

    const { format, ...filters } = input;
    const filtersHash = hashFilters(input.reportType, format, filters);

    const cached = await prisma.reportExport.findFirst({
      where: {
        userId: requester.id,
        filtersHash,
        format,
        status: "COMPLETED",
        createdAt: { gte: new Date(Date.now() - CACHE_TTL_MS) },
      },
      include: { user: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
    });
    if (cached) return toItem(cached, true);

    const row = await prisma.reportExport.create({
      data: {
        userId: requester.id,
        reportType: input.reportType,
        format,
        filters: filters as unknown as Prisma.InputJsonValue,
        filtersHash,
        status: "PENDING",
        fileName: `${input.reportType.toLowerCase()}-report.${FORMAT_EXTENSION[format]}`,
      },
      include: { user: { select: { id: true, displayName: true } } },
    });

    void this.process(row.id, requester, input).catch((error: unknown) => {
      console.error("[kaizen-api] Report export processing failed:", error);
    });

    return toItem(row);
  }

  /** The actual generation work — deliberately not awaited by `createExport`, matching this
   * codebase's own `void eventBus.emit(...)` fire-and-forget precedent for best-effort background
   * work that shouldn't block the HTTP response. */
  private async process(exportId: string, requester: Requester, input: CreateExportSchema): Promise<void> {
    await prisma.reportExport.update({ where: { id: exportId }, data: { status: "PROCESSING" } });

    try {
      const { format, ...filters } = input;
      const generator = await prisma.user.findUnique({ where: { id: requester.id }, select: { displayName: true } });
      const context = { generatedByName: generator?.displayName ?? "Unknown", appliedFilters: await resolveAppliedFilters(input) };

      // A single `generateReport` call does the RBAC check, builds the report (at the Preview's
      // 100-row cap for PDF, or the export's larger cap for CSV/Excel), and records the
      // ReportGeneration/audit "report generated" entry — one call, no duplicate aggregation
      // query (Part 14).
      const report: ReportResult = await reportService.generateReport(
        requester,
        filters,
        format === "PDF" ? 100 : EXPORT_ROW_CAP,
      );

      const buffer =
        format === "PDF"
          ? await buildReportPdf(report, context)
          : format === "EXCEL"
            ? await buildReportExcel(report, context)
            : buildReportCsv(report, context);

      const publicId = `${input.reportType.toLowerCase()}-${exportId}`;
      const uploaded = await uploadReportFile(buffer, { folder: "reports", publicId });

      await prisma.reportExport.update({
        where: { id: exportId },
        data: {
          status: "COMPLETED",
          fileSizeBytes: buffer.byteLength,
          expiresAt: new Date(Date.now() + EXPIRY_TTL_MS),
          ...(uploaded
            ? { cloudinaryUrl: uploaded.url, cloudinaryPublicId: uploaded.publicId, fileData: null }
            : { fileData: Uint8Array.from(buffer) }),
        },
      });
    } catch (error) {
      await prisma.reportExport.update({
        where: { id: exportId },
        data: { status: "FAILED", errorMessage: error instanceof Error ? error.message.slice(0, 500) : "Export failed." },
      });
    }
  }

  async list(requester: Requester, query: ListExportsQuerySchema) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
    const { skip, take } = getSkipTake({ page, pageSize });
    const where: Prisma.ReportExportWhereInput = requester.role === "SUPER_ADMIN" ? {} : { userId: requester.id };

    const [rows, total] = await Promise.all([
      prisma.reportExport.findMany({
        where,
        include: { user: { select: { id: true, displayName: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.reportExport.count({ where }),
    ]);

    return { items: rows.map((row) => toItem(row)), meta: buildPaginationMeta({ page, pageSize }, total) };
  }

  async getStatus(requester: Requester, id: string): Promise<ReportExportItem> {
    const row = await this.findOwnedOrThrow(requester, id);
    return toItem(row);
  }

  async download(
    requester: Requester,
    id: string,
  ): Promise<{ redirectUrl: string } | { buffer: Buffer; fileName: string; contentType: string }> {
    const row = await this.findOwnedOrThrow(requester, id);
    if (row.status !== "COMPLETED") {
      throw new ApiError("CONFLICT", `Export is not ready yet (status: ${row.status}).`, 409);
    }
    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
      throw new ApiError("GONE", "This export has expired. Generate a new one.", 410);
    }

    await auditService.record({
      userId: requester.id,
      userRole: requester.role,
      action: "report.downloaded",
      entityType: "ReportExport",
      entityId: row.id,
      newValue: { format: row.format, reportType: row.reportType },
    });

    if (row.cloudinaryUrl) return { redirectUrl: row.cloudinaryUrl };
    if (!row.fileData) throw new ApiError("INTERNAL_ERROR", "Export file is missing.", 500);
    return { buffer: Buffer.from(row.fileData), fileName: row.fileName, contentType: FORMAT_CONTENT_TYPE[row.format] };
  }

  async remove(requester: Requester, id: string): Promise<void> {
    const row = await this.findOwnedOrThrow(requester, id);

    if (row.cloudinaryPublicId) {
      await deleteReportFile(row.cloudinaryPublicId).catch((error: unknown) => {
        console.error("[kaizen-api] Cloudinary delete failed (continuing with local delete):", error);
      });
    }
    await prisma.reportExport.delete({ where: { id } });

    await auditService.record({
      userId: requester.id,
      userRole: requester.role,
      action: "report.deleted",
      entityType: "ReportExport",
      entityId: id,
      previousValue: { format: row.format, reportType: row.reportType, fileName: row.fileName },
    });
  }

  /** Called by the schedule execution job (Part 6/13) — same generation path as an interactive
   * export, plus a `REPORT_READY` notification per recipient once the file is ready. */
  async createScheduledExport(
    requester: Requester,
    input: CreateExportSchema,
    scheduleId: string,
    recipientIds: string[],
  ): Promise<ReportExportItem> {
    const { format, ...filters } = input;
    const filtersHash = hashFilters(input.reportType, format, filters);

    const row = await prisma.reportExport.create({
      data: {
        userId: requester.id,
        reportType: input.reportType,
        format,
        filters: filters as unknown as Prisma.InputJsonValue,
        filtersHash,
        status: "PENDING",
        fileName: `${input.reportType.toLowerCase()}-report.${FORMAT_EXTENSION[format]}`,
        scheduleId,
      },
      include: { user: { select: { id: true, displayName: true } } },
    });

    await this.process(row.id, requester, input);

    const completed = await prisma.reportExport.findUniqueOrThrow({
      where: { id: row.id },
      include: { user: { select: { id: true, displayName: true } } },
    });

    if (completed.status === "COMPLETED") {
      await Promise.all(
        recipientIds.map((recipientId) =>
          notificationService.create({
            userId: recipientId,
            type: "REPORT_READY",
            title: "Scheduled report ready",
            body: `${completed.fileName} is ready to download.`,
            entityType: "ReportExport",
            entityId: completed.id,
          }),
        ),
      );
    }

    return toItem(completed);
  }

  private async findOwnedOrThrow(requester: Requester, id: string) {
    const row = await prisma.reportExport.findUnique({
      where: { id },
      include: { user: { select: { id: true, displayName: true } } },
    });
    if (!row) throw new ApiError("NOT_FOUND", "Export not found.", 404);
    if (row.userId !== requester.id && requester.role !== "SUPER_ADMIN") {
      throw new ApiError("FORBIDDEN", "You cannot access this export.", 403);
    }
    return row;
  }
}

export const reportExportService = new ReportExportService();
