import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { auditService } from "../audit/audit.service.js";
import { buildPaginationMeta, getSkipTake } from "../../utils/pagination.js";
import { workflowService } from "../workflow/workflow.service.js";
import type {
  AssignImplementationSchema,
  CompleteImplementationSchema,
  ListImplementationsQuerySchema,
  RegisterImplementationAttachmentSchema,
  UpdateImplementationSchema,
  VerifyImplementationSchema,
} from "./implementation.schema.js";
import type {
  ImplementationAttachmentItem,
  ImplementationItem,
  PaginatedImplementations,
} from "./implementation.types.js";
import type { UserRole } from "../../constants/roles.js";

interface Requester {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

const COMPANY_WIDE_ROLES: UserRole[] = ["HR", "CMD", "SUPER_ADMIN"];

const IMPLEMENTATION_INCLUDE = {
  kaizen: {
    select: {
      id: true,
      kaizenNumber: true,
      title: true,
      status: true,
      implementationDueDate: true,
      submitter: { select: { id: true, displayName: true } },
      department: { select: { id: true, name: true } },
    },
  },
  owner: { select: { id: true, displayName: true } },
  assignedDepartment: { select: { id: true, name: true } },
  verifiedBy: { select: { id: true, displayName: true } },
  attachments: {
    orderBy: { createdAt: "asc" as const },
    include: { uploadedBy: { select: { id: true, displayName: true } } },
  },
} as const;

type ImplementationRow = Prisma.ImplementationGetPayload<{
  include: typeof IMPLEMENTATION_INCLUDE;
}>;

function toAttachmentItem(
  attachment: ImplementationRow["attachments"][number],
): ImplementationAttachmentItem {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    fileType: attachment.fileType,
    mimeType: attachment.mimeType,
    fileSizeBytes: Number(attachment.fileSizeBytes),
    cloudinaryPublicId: attachment.cloudinaryPublicId,
    cloudinarySecureUrl: attachment.cloudinarySecureUrl,
    uploadedBy: attachment.uploadedBy,
    createdAt: attachment.createdAt.toISOString(),
  };
}

function toImplementationItem(implementation: ImplementationRow): ImplementationItem {
  return {
    id: implementation.id,
    kaizenId: implementation.kaizenId,
    kaizen: implementation.kaizen,
    owner: implementation.owner,
    assignedDepartment: implementation.assignedDepartment,
    description: implementation.description,
    progressPercent: implementation.progressPercent,
    estimatedCost: implementation.estimatedCost ? Number(implementation.estimatedCost) : null,
    actualCost: implementation.actualCost ? Number(implementation.actualCost) : null,
    timeTakenDays: implementation.timeTakenDays,
    startedAt: implementation.startedAt?.toISOString() ?? null,
    completedAt: implementation.completedAt?.toISOString() ?? null,
    completionNotes: implementation.completionNotes,
    verificationStatus: implementation.verificationStatus,
    verifiedBy: implementation.verifiedBy,
    verifiedAt: implementation.verifiedAt?.toISOString() ?? null,
    dueDate: implementation.kaizen.implementationDueDate?.toISOString() ?? null,
    attachments: implementation.attachments.map(toAttachmentItem),
    createdAt: implementation.createdAt.toISOString(),
    updatedAt: implementation.updatedAt.toISOString(),
  };
}

class ImplementationService {
  /** GET /implementations — per the API spec: Dept Manager (own dept), HR/CMD/Super Admin (all),
   * Employee (own Kaizens only, read-only). Broader than the Review queue (which blocks
   * Employees outright) since this is status/progress visibility on ideas they submitted. */
  async list(
    requester: Requester,
    query: ListImplementationsQuerySchema,
  ): Promise<PaginatedImplementations> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
    const { skip, take } = getSkipTake({ page, pageSize });

    const isCompanyWide = COMPANY_WIDE_ROLES.includes(requester.role);

    // Multiple independent conditions on the related Kaizen (department/submitter scope, plus the
    // optional `kaizenStatus` filter) are combined via `AND` rather than spread together, since
    // Prisma's `kaizen` relation filter type doesn't allow merging plain-object shapes safely.
    const kaizenFilters: Prisma.KaizenWhereInput[] = [];
    if (!isCompanyWide) {
      if (requester.role === "DEPARTMENT_MANAGER") {
        if (!requester.departmentId) {
          return { items: [], meta: buildPaginationMeta({ page, pageSize }, 0) };
        }
        kaizenFilters.push({ departmentId: requester.departmentId });
      } else {
        kaizenFilters.push({ submitterId: requester.id });
      }
    }
    if (query.kaizenStatus) kaizenFilters.push({ status: query.kaizenStatus });

    const where: Prisma.ImplementationWhereInput = {
      ...(isCompanyWide && query.departmentId ? { assignedDepartmentId: query.departmentId } : {}),
      ...(query.status ? { verificationStatus: query.status as never } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(kaizenFilters.length > 0 ? { kaizen: { AND: kaizenFilters } } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            startedAt: {
              ...(query.dateFrom ? { gte: query.dateFrom } : {}),
              ...(query.dateTo ? { lte: query.dateTo } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.implementation.findMany({
        where,
        include: IMPLEMENTATION_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.implementation.count({ where }),
    ]);

    return {
      items: rows.map(toImplementationItem),
      meta: buildPaginationMeta({ page, pageSize }, total),
    };
  }

  /** GET /kaizens/:id/implementation — "Required (scoped)". Own view-permission check rather
   * than reusing KaizenService.getById: the assigned owner needs to see this even when they're
   * not the submitter, not a reviewer, and not necessarily in the Kaizen's own department (see
   * `assertCanView`). Returns null if the Kaizen hasn't been assigned yet (not an error — a
   * normal pre-assignment state, same convention as ScoringService.getEvaluation). */
  async getByKaizenId(kaizenId: string, requester: Requester): Promise<ImplementationItem | null> {
    const kaizen = await this.loadKaizen(kaizenId);
    this.assertCanView(kaizen, requester);

    const implementation = await prisma.implementation.findUnique({
      where: { kaizenId },
      include: IMPLEMENTATION_INCLUDE,
    });

    return implementation ? toImplementationItem(implementation) : null;
  }

  /** POST /kaizens/:id/implementation/assign — APPROVED -> IMPLEMENTATION_IN_PROGRESS. */
  async assign(
    kaizenId: string,
    requester: Requester,
    input: AssignImplementationSchema,
  ): Promise<ImplementationItem> {
    const kaizen = await this.loadKaizen(kaizenId);
    this.assertCanView(kaizen, requester);
    this.assertCanManage(kaizen, requester);

    const existing = await prisma.implementation.findUnique({ where: { kaizenId } });
    if (existing) {
      throw new ApiError("CONFLICT", "This Kaizen already has an implementation assigned.", 409);
    }

    const owner = await prisma.user.findUnique({ where: { id: input.ownerId } });
    if (!owner || !owner.isActive) {
      throw new ApiError("VALIDATION_ERROR", "Owner not found.", 400, [
        { field: "ownerId", message: "Owner not found or inactive." },
      ]);
    }

    const assignedDepartment = await prisma.department.findUnique({
      where: { id: input.assignedDepartmentId },
    });
    if (!assignedDepartment) {
      throw new ApiError("VALIDATION_ERROR", "Assigned department not found.", 400, [
        { field: "assignedDepartmentId", message: "Department not found." },
      ]);
    }

    const startedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.implementation.create({
        data: {
          kaizenId,
          ownerId: input.ownerId,
          assignedDepartmentId: input.assignedDepartmentId,
          description: input.description,
          startedAt,
        },
      });

      await tx.kaizen.update({
        where: { id: kaizenId },
        data: {
          assignedOwnerId: input.ownerId,
          implementationDueDate: input.dueDate,
        },
      });
    });

    await workflowService.transition({
      kaizenId,
      toStatus: "IMPLEMENTATION_IN_PROGRESS",
      actor: requester,
      description: `Implementation assigned to ${owner.displayName}.`,
      metadata: { ownerId: input.ownerId, assignedDepartmentId: input.assignedDepartmentId },
    });

    const result = await this.getByKaizenId(kaizenId, requester);
    if (!result)
      throw new ApiError("INTERNAL_ERROR", "Failed to load assigned implementation.", 500);
    return result;
  }

  /** PATCH /kaizens/:id/implementation — "Department Manager or assigned owner". Does not itself
   * change `kaizens.status` (only `complete` does), so it doesn't go through WorkflowService. */
  async updateProgress(
    kaizenId: string,
    requester: Requester,
    input: UpdateImplementationSchema,
  ): Promise<ImplementationItem> {
    const kaizen = await this.loadKaizen(kaizenId);
    this.assertCanView(kaizen, requester);
    const implementation = await this.findOrThrow(kaizenId);
    this.assertCanUpdate(kaizen, implementation, requester);

    await prisma.implementation.update({
      where: { kaizenId },
      data: {
        progressPercent: input.progressPercent,
        description: input.description,
        estimatedCost: input.estimatedCost,
        actualCost: input.actualCost,
        timeTakenDays: input.timeTakenDays,
      },
    });

    const result = await this.getByKaizenId(kaizenId, requester);
    if (!result) throw new ApiError("INTERNAL_ERROR", "Failed to load implementation.", 500);
    return result;
  }

  /** POST /kaizens/:id/implementation/complete — IMPLEMENTATION_IN_PROGRESS ->
   * IMPLEMENTATION_COMPLETED. */
  async complete(
    kaizenId: string,
    requester: Requester,
    input: CompleteImplementationSchema,
  ): Promise<ImplementationItem> {
    const kaizen = await this.loadKaizen(kaizenId);
    this.assertCanView(kaizen, requester);
    const implementation = await this.findOrThrow(kaizenId);
    this.assertCanUpdate(kaizen, implementation, requester);

    const completedAt = new Date();

    await prisma.implementation.update({
      where: { kaizenId },
      data: { completionNotes: input.completionNotes, completedAt },
    });

    await workflowService.transition({
      kaizenId,
      toStatus: "IMPLEMENTATION_COMPLETED",
      actor: requester,
      description: input.completionNotes
        ? `Implementation completed. ${input.completionNotes}`
        : "Implementation completed.",
    });

    const result = await this.getByKaizenId(kaizenId, requester);
    if (!result) throw new ApiError("INTERNAL_ERROR", "Failed to load implementation.", 500);
    return result;
  }

  /** POST /kaizens/:id/implementation/verify — "Department Manager, HR, CMD" per the API spec;
   * Super Admin included too, matching the hierarchy-based "unrestricted access" precedent
   * documented for every other HR/CMD-level action in this codebase. Doesn't change
   * `kaizens.status` (no `Transition:` line in the spec for this endpoint — verification is a
   * quality sub-process, not a lifecycle stage on its own), so it writes its own timeline/audit
   * entries directly rather than going through WorkflowService. */
  async verify(
    kaizenId: string,
    requester: Requester,
    input: VerifyImplementationSchema,
  ): Promise<ImplementationItem> {
    const kaizen = await this.loadKaizen(kaizenId);
    this.assertCanView(kaizen, requester);
    const implementation = await this.findOrThrow(kaizenId);
    this.assertCanVerify(kaizen, requester);

    const verifiedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.implementation.update({
        where: { kaizenId },
        data: { verificationStatus: input.status, verifiedById: requester.id, verifiedAt },
      });

      await tx.timelineEvent.create({
        data: {
          kaizenId,
          eventType: "STATUS_CHANGED",
          actorId: requester.id,
          description: input.notes
            ? `Implementation ${input.status.toLowerCase()}. ${input.notes}`
            : `Implementation ${input.status.toLowerCase()}.`,
          metadata: { verificationStatus: input.status, notes: input.notes },
        },
      });

      await auditService.record(
        {
          userId: requester.id,
          userRole: requester.role,
          action: "implementation.verify",
          entityType: "Implementation",
          entityId: implementation.id,
          previousValue: { verificationStatus: implementation.verificationStatus },
          newValue: { verificationStatus: input.status },
        },
        tx,
      );
    });

    const result = await this.getByKaizenId(kaizenId, requester);
    if (!result) throw new ApiError("INTERNAL_ERROR", "Failed to load implementation.", 500);
    return result;
  }

  /** POST /kaizens/:id/implementation/attachments — "Department Manager or owner", registering
   * evidence already uploaded elsewhere (no Cloudinary SDK/upload-signing endpoint exists yet —
   * same documented gap as Kaizen attachments since Milestone 4). */
  async registerAttachment(
    kaizenId: string,
    requester: Requester,
    input: RegisterImplementationAttachmentSchema,
  ): Promise<ImplementationAttachmentItem> {
    const kaizen = await this.loadKaizen(kaizenId);
    this.assertCanView(kaizen, requester);
    const implementation = await this.findOrThrow(kaizenId);
    this.assertCanUpdate(kaizen, implementation, requester);

    const attachment = await prisma.implementationAttachment.create({
      data: {
        implementationId: implementation.id,
        fileName: input.fileName,
        fileType: input.fileType,
        mimeType: input.mimeType,
        fileSizeBytes: input.fileSizeBytes,
        cloudinaryPublicId: input.cloudinaryPublicId,
        cloudinarySecureUrl: input.cloudinarySecureUrl,
        uploadedById: requester.id,
      },
      include: { uploadedBy: { select: { id: true, displayName: true } } },
    });

    await auditService.record({
      userId: requester.id,
      userRole: requester.role,
      action: "implementation.attachment_added",
      entityType: "Implementation",
      entityId: implementation.id,
      newValue: { fileName: input.fileName },
    });

    return toAttachmentItem(attachment);
  }

  private async loadKaizen(kaizenId: string) {
    const kaizen = await prisma.kaizen.findUnique({
      where: { id: kaizenId },
      select: {
        id: true,
        status: true,
        submitterId: true,
        assignedOwnerId: true,
        department: { select: { id: true, name: true } },
      },
    });
    if (!kaizen) {
      throw new ApiError("NOT_FOUND", "Kaizen not found.", 404);
    }
    return kaizen;
  }

  /** Broader than KaizenService's own `assertCanView` (submitter / dept-manager-same-dept /
   * HR-CMD-SuperAdmin): also grants the Kaizen's `assignedOwnerId`, who is picked without any
   * department constraint (see `AssignImplementationSchema`) and would otherwise be unable to
   * see or act on work they were explicitly assigned. Kept local to this module rather than
   * added to KaizenService, since it's a broader rule specific to the implementation lifecycle,
   * not a general Kaizen-viewing rule. */
  private assertCanView(
    kaizen: { submitterId: string; assignedOwnerId: string | null; department: { id: string } },
    requester: Requester,
  ): void {
    if (kaizen.submitterId === requester.id) return;
    if (kaizen.assignedOwnerId === requester.id) return;
    if (COMPANY_WIDE_ROLES.includes(requester.role)) return;
    if (requester.role === "DEPARTMENT_MANAGER" && requester.departmentId === kaizen.department.id) {
      return;
    }
    throw new ApiError("FORBIDDEN", "You cannot view this Kaizen's implementation.", 403);
  }

  private async findOrThrow(kaizenId: string) {
    const implementation = await prisma.implementation.findUnique({ where: { kaizenId } });
    if (!implementation) {
      throw new ApiError("NOT_FOUND", "No implementation has been assigned for this Kaizen.", 404);
    }
    return implementation;
  }

  /** Assign is scoped to "Department Manager, same department" (the department that
   * submitted/reviewed the Kaizen, not the department the work is eventually assigned to), plus
   * CMD/Super Admin as enterprise-wide overrides — matching ReviewService's `assertCanManage`
   * exactly. Deliberately narrower than this file's own `COMPANY_WIDE_ROLES` (which includes HR,
   * appropriate for viewing/verifying but not for assigning — same review-action RBAC as
   * ReviewService/ScoringService). Milestone 20 — restores the CMD/Super Admin override that
   * Milestone 13 regressed. */
  private assertCanManage(kaizen: { department: { id: string } }, requester: Requester): void {
    if (requester.role === "SUPER_ADMIN" || requester.role === "CMD") return;
    if (requester.role === "DEPARTMENT_MANAGER" && requester.departmentId === kaizen.department.id) {
      return;
    }
    throw new ApiError(
      "FORBIDDEN",
      "Only the department manager for this Kaizen — or CMD/Super Admin — can assign its implementation.",
      403,
    );
  }

  /** Update progress / complete / register attachment: "Department Manager or assigned owner" —
   * the owner can be anyone, from any department, so this check is independent of `assertCanManage`. */
  private assertCanUpdate(
    kaizen: { department: { id: string } },
    implementation: { ownerId: string },
    requester: Requester,
  ): void {
    const isManager =
      requester.role === "DEPARTMENT_MANAGER" && requester.departmentId === kaizen.department.id;
    const isOwner = implementation.ownerId === requester.id;
    if (!isManager && !isOwner) {
      throw new ApiError(
        "FORBIDDEN",
        "Only the department manager or the assigned owner can update this implementation.",
        403,
      );
    }
  }

  /** Verify: "Department Manager, HR, CMD" (+ Super Admin, see class doc comment). */
  private assertCanVerify(kaizen: { department: { id: string } }, requester: Requester): void {
    const isManager =
      requester.role === "DEPARTMENT_MANAGER" && requester.departmentId === kaizen.department.id;
    if (!isManager && !COMPANY_WIDE_ROLES.includes(requester.role)) {
      throw new ApiError("FORBIDDEN", "You cannot verify this implementation.", 403);
    }
  }
}

export const implementationService = new ImplementationService();
