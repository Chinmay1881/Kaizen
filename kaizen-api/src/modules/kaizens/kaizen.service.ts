import type { Prisma } from "@prisma/client";

import { env } from "../../config/env.js";
import { eventBus } from "../../events/event-bus.js";
import { deleteAttachment, uploadAttachment } from "../../lib/cloudinary-client.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { formatKaizenNumber } from "../../utils/kaizen-number.js";
import { buildPaginationMeta, getSkipTake } from "../../utils/pagination.js";
import {
  KAIZEN_DETAIL_INCLUDE,
  KAIZEN_LIST_SELECT,
  toAttachmentItem,
  toDetail,
  toListItem,
} from "./kaizen.mapper.js";
import type {
  CreateKaizenSchema,
  ListKaizensQuerySchema,
  UpdateKaizenSchema,
} from "./kaizen.schema.js";
import type {
  KaizenAttachmentItem,
  KaizenDetail,
  PaginatedKaizens,
  SubmitKaizenResult,
  TimelineEventItem,
} from "./kaizen.types.js";
import type { UserRole } from "../../constants/roles.js";
import { KAIZEN_STATUSES, type KaizenStatus } from "../../constants/kaizen-status.js";
import type { AttachmentType } from "@prisma/client";

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/** Classifies a raw MIME type into the schema's `AttachmentType` enum — the server must do this
 * itself (unlike the Implementation "register already-uploaded evidence" endpoint, where the
 * caller supplies `fileType` directly) because this endpoint receives the real file, not a
 * pre-classified description of one. */
function classifyMimeType(mimeType: string): AttachmentType {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "SPREADSHEET";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "PRESENTATION";
  if (mimeType.includes("word") || mimeType.includes("document")) return "DOCUMENT";
  return "OTHER";
}

function cloudinaryResourceType(fileType: AttachmentType): "image" | "video" | "raw" {
  if (fileType === "IMAGE") return "image";
  if (fileType === "VIDEO") return "video";
  return "raw";
}

interface Requester {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

const EDITABLE_STATUSES = ["DRAFT", "NEEDS_CHANGES"] as const;

async function nextKaizenNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const sequence = await prisma.kaizenNumberSequence.upsert({
    where: { year },
    create: { year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
  return formatKaizenNumber(year, sequence.lastValue);
}

function assertFound<T>(kaizen: T | null): asserts kaizen is T {
  if (!kaizen) {
    throw new ApiError("NOT_FOUND", "Kaizen not found.", 404);
  }
}

class KaizenService {
  /** POST /kaizens — matches docs/engineering/02_API_SPECIFICATION.md exactly: minimal fields,
   * department defaults to the submitter's own department when omitted. */
  async createDraft(requester: Requester, input: CreateKaizenSchema): Promise<KaizenDetail> {
    const departmentId = input.departmentId ?? requester.departmentId ?? undefined;

    if (!departmentId) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Department is required — your profile has no department assigned yet.",
        400,
        [{ field: "departmentId", message: "Department is required." }],
      );
    }

    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      throw new ApiError("VALIDATION_ERROR", "Department not found.", 400, [
        { field: "departmentId", message: "Department not found." },
      ]);
    }

    const kaizenNumber = await nextKaizenNumber();

    const kaizen = await prisma.kaizen.create({
      data: {
        kaizenNumber,
        title: input.title?.trim() || "Untitled Kaizen",
        departmentId,
        submitterId: requester.id,
      },
      include: KAIZEN_DETAIL_INCLUDE,
    });

    await prisma.timelineEvent.create({
      data: {
        kaizenId: kaizen.id,
        eventType: "DRAFT_CREATED",
        actorId: requester.id,
        description: "Draft created.",
      },
    });

    return toDetail(kaizen);
  }

  /**
   * GET /kaizens — Milestone 5 (My Ideas) scope only: always scoped to the requester's own
   * submissions, regardless of role. The documented API spec eventually wants broader role-based
   * scoping (Dept Manager sees their department, HR/CMD/Super Admin see everything) for the
   * Review Workspace — that's out of scope here ("Do NOT implement reviewer workflows").
   */
  async list(requester: Requester, query: ListKaizensQuerySchema): Promise<PaginatedKaizens> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? query.limit ?? 25));
    const { skip, take } = getSkipTake({ page, pageSize });

    const statusList = query.status
      ?.split(",")
      .map((value) => value.trim().toUpperCase())
      .filter((value): value is KaizenStatus =>
        (KAIZEN_STATUSES as readonly string[]).includes(value),
      );

    const where: Prisma.KaizenWhereInput = {
      submitterId: requester.id,
      ...(statusList && statusList.length > 0 ? { status: { in: statusList } } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { problemStatement: { contains: query.search, mode: "insensitive" } },
              { kaizenNumber: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { gte: query.dateFrom } : {}),
              ...(query.dateTo ? { lte: query.dateTo } : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.KaizenOrderByWithRelationInput =
      query.sort === "oldest"
        ? { createdAt: "asc" }
        : query.sort === "updated"
          ? { updatedAt: "desc" }
          : { createdAt: "desc" };

    const [rows, total] = await Promise.all([
      prisma.kaizen.findMany({ where, orderBy, skip, take, select: KAIZEN_LIST_SELECT }),
      prisma.kaizen.count({ where }),
    ]);

    return {
      items: rows.map(toListItem),
      meta: buildPaginationMeta({ page, pageSize }, total),
    };
  }

  /** GET /kaizens/:id/timeline — same view permissions as getById, oldest-first (chronological). */
  async getTimeline(kaizenId: string, requester: Requester): Promise<TimelineEventItem[]> {
    const kaizen = await prisma.kaizen.findUnique({
      where: { id: kaizenId },
      select: { submitterId: true, departmentId: true, assignedOwnerId: true },
    });
    assertFound(kaizen);
    this.assertCanView(kaizen, requester);

    const events = await prisma.timelineEvent.findMany({
      where: { kaizenId },
      orderBy: { createdAt: "asc" },
      include: { actor: { select: { id: true, displayName: true } } },
    });

    return events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      actor: event.actor,
      description: event.description,
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
    }));
  }

  async getById(kaizenId: string, requester: Requester): Promise<KaizenDetail> {
    const kaizen = await prisma.kaizen.findUnique({
      where: { id: kaizenId },
      include: KAIZEN_DETAIL_INCLUDE,
    });
    assertFound(kaizen);
    this.assertCanView(kaizen, requester);
    return toDetail(kaizen);
  }

  async update(
    kaizenId: string,
    requester: Requester,
    input: UpdateKaizenSchema,
  ): Promise<KaizenDetail> {
    const existing = await prisma.kaizen.findUnique({ where: { id: kaizenId } });
    assertFound(existing);
    this.assertCanEdit(existing, requester);

    const { fiveW1H, fiveWhy, benefits, ...scalarFields } = input;

    await prisma.$transaction(async (tx) => {
      await tx.kaizen.update({
        where: { id: kaizenId },
        data: scalarFields,
      });

      if (fiveW1H) {
        await tx.kaizen5W1H.upsert({
          where: { kaizenId },
          create: { kaizenId, ...fiveW1H },
          update: fiveW1H,
        });
      }

      if (fiveWhy) {
        for (const entry of fiveWhy) {
          await tx.kaizen5Why.upsert({
            where: { kaizenId_level: { kaizenId, level: entry.level } },
            create: { kaizenId, level: entry.level, answer: entry.answer },
            update: { answer: entry.answer },
          });
        }
      }

      if (benefits) {
        await tx.kaizenBenefit.deleteMany({ where: { kaizenId } });
        if (benefits.length > 0) {
          await tx.kaizenBenefit.createMany({
            data: benefits.map((benefit, index) => ({
              kaizenId,
              benefitType: benefit.benefitType,
              description: benefit.description,
              isCustom: benefit.isCustom ?? false,
              sortOrder: index,
            })),
          });
        }
      }
    });

    return this.getById(kaizenId, requester);
  }

  async remove(kaizenId: string, requester: Requester): Promise<void> {
    const existing = await prisma.kaizen.findUnique({ where: { id: kaizenId } });
    assertFound(existing);

    const isOwner = existing.submitterId === requester.id;
    const isSuperAdmin = requester.role === "SUPER_ADMIN";
    if (!isOwner && !isSuperAdmin) {
      throw new ApiError("FORBIDDEN", "You cannot delete this Kaizen.", 403);
    }
    if (existing.status !== "DRAFT") {
      throw new ApiError("CONFLICT", "Only draft Kaizens can be deleted.", 409);
    }

    await prisma.kaizen.delete({ where: { id: kaizenId } });
  }

  /** POST /kaizens/:id/attachments — multipart upload handled by `middleware/upload.ts`
   * (`req.file`, memory storage) one level up in the route; this uploads the buffer to Cloudinary
   * and creates the `KaizenAttachment` row in one step, rather than the two-step "sign, then
   * register" pattern `implementationService.registerAttachment` uses — there's no separate
   * client-side Cloudinary widget in this app, so a single server round trip is simpler and can't
   * leave an orphaned Cloudinary asset with no DB row if the client never calls a second step. */
  async addAttachment(
    kaizenId: string,
    requester: Requester,
    file: UploadedFile,
  ): Promise<KaizenAttachmentItem> {
    const existing = await prisma.kaizen.findUnique({
      where: { id: kaizenId },
      select: { submitterId: true, status: true, _count: { select: { attachments: true } } },
    });
    assertFound(existing);
    this.assertCanEdit(existing, requester);

    if (existing._count.attachments >= env.MAX_FILES_PER_KAIZEN) {
      throw new ApiError(
        "VALIDATION_ERROR",
        `A Kaizen can have at most ${env.MAX_FILES_PER_KAIZEN} attachments.`,
        400,
      );
    }

    const fileType = classifyMimeType(file.mimetype);
    const uploaded = await uploadAttachment(file.buffer, {
      folder: `kaizens/${kaizenId}`,
      publicId: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_")}`,
    });

    const attachment = await prisma.kaizenAttachment.create({
      data: {
        kaizenId,
        fileName: file.originalname,
        fileType,
        mimeType: file.mimetype,
        fileSizeBytes: BigInt(file.size),
        cloudinaryPublicId: uploaded.publicId,
        cloudinaryUrl: uploaded.url,
        cloudinarySecureUrl: uploaded.secureUrl,
        uploadedById: requester.id,
      },
      include: { uploadedBy: { select: { id: true, displayName: true } } },
    });

    return toAttachmentItem(attachment);
  }

  /** DELETE /kaizens/:id/attachments/:attachmentId — so the Wizard's "remove" control (and any
   * future edit flow) can actually undo an upload instead of just hiding it client-side while the
   * Cloudinary asset and DB row linger forever. */
  async removeAttachment(kaizenId: string, attachmentId: string, requester: Requester): Promise<void> {
    const existing = await prisma.kaizen.findUnique({
      where: { id: kaizenId },
      select: { submitterId: true, status: true },
    });
    assertFound(existing);
    this.assertCanEdit(existing, requester);

    const attachment = await prisma.kaizenAttachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.kaizenId !== kaizenId) {
      throw new ApiError("NOT_FOUND", "Attachment not found.", 404);
    }

    await prisma.kaizenAttachment.delete({ where: { id: attachmentId } });
    await deleteAttachment(attachment.cloudinaryPublicId, cloudinaryResourceType(attachment.fileType));
  }

  /** POST /kaizens/:id/submit — validates the wizard's required fields per the API spec, then
   * transitions DRAFT/NEEDS_CHANGES -> SUBMITTED directly. NOT routed through WorkflowService's
   * transition table — that engine only covers the reviewer-driven edges (see workflow.service.ts's
   * own doc comment); this is a narrow, single-purpose transition scoped to just this one edge,
   * with its own timeline event, matching what already existed for it before that engine existed.
   * The `kaizen.submitted` domain event is emitted directly here (rather than via WorkflowService)
   * for the same reason — Notifications/Gamification (Milestone 9) subscribe to it for the
   * "notify dept manager" + "+10 points" side effects documented since Milestone 4 and deferred
   * until now; see `src/events/handlers/index.ts`.
   */
  async submit(kaizenId: string, requester: Requester): Promise<SubmitKaizenResult> {
    const kaizen = await prisma.kaizen.findUnique({
      where: { id: kaizenId },
      include: KAIZEN_DETAIL_INCLUDE,
    });
    assertFound(kaizen);

    if (kaizen.submitterId !== requester.id) {
      throw new ApiError("FORBIDDEN", "Only the submitter can submit this Kaizen.", 403);
    }
    if (!EDITABLE_STATUSES.includes(kaizen.status as (typeof EDITABLE_STATUSES)[number])) {
      throw new ApiError("CONFLICT", "This Kaizen has already been submitted.", 409);
    }

    const details = this.validateForSubmit(kaizen);
    if (details.length > 0) {
      throw new ApiError("VALIDATION_ERROR", "Kaizen is not ready to submit.", 400, details);
    }

    const submittedAt = new Date();
    const submitted = await prisma.kaizen.update({
      where: { id: kaizenId },
      data: { status: "SUBMITTED", submittedAt },
    });

    await prisma.timelineEvent.create({
      data: {
        kaizenId,
        eventType: "SUBMITTED",
        actorId: requester.id,
        description: "Kaizen submitted for review.",
      },
    });

    void eventBus.emit("kaizen.submitted", { kaizenId, actorId: requester.id });

    return {
      id: submitted.id,
      kaizenNumber: submitted.kaizenNumber,
      status: submitted.status as SubmitKaizenResult["status"],
      submittedAt: submittedAt.toISOString(),
    };
  }

  private validateForSubmit(
    kaizen: Prisma.KaizenGetPayload<{ include: typeof KAIZEN_DETAIL_INCLUDE }>,
  ): Array<{ field: string; message: string }> {
    const details: Array<{ field: string; message: string }> = [];

    if (!kaizen.categoryId) details.push({ field: "categoryId", message: "Category is required." });
    if (!kaizen.problemStatement)
      details.push({ field: "problemStatement", message: "Problem statement is required." });
    if (!kaizen.currentProcess)
      details.push({ field: "currentProcess", message: "Current process is required." });
    if (!kaizen.proposedSolution)
      details.push({ field: "proposedSolution", message: "Proposed solution is required." });

    const fiveW1HFields = kaizen.fiveW1H;
    const fiveW1HComplete =
      fiveW1HFields &&
      fiveW1HFields.what &&
      fiveW1HFields.whereLocation &&
      fiveW1HFields.whenOccurs &&
      fiveW1HFields.who &&
      fiveW1HFields.why &&
      fiveW1HFields.how;
    if (!fiveW1HComplete) {
      details.push({ field: "fiveW1H", message: "All six 5W1H questions must be answered." });
    }

    if (kaizen.fiveWhys.length < 5) {
      details.push({
        field: "fiveWhy",
        message: "All 5 levels of the 5 Why analysis are required.",
      });
    }

    if (kaizen.benefits.length < 1) {
      details.push({ field: "benefits", message: "At least one expected benefit is required." });
    }

    return details;
  }

  private assertCanView(
    kaizen: { submitterId: string; departmentId: string; assignedOwnerId?: string | null },
    requester: Requester,
  ): void {
    if (kaizen.submitterId === requester.id) return;
    if (requester.role === "HR" || requester.role === "CMD" || requester.role === "SUPER_ADMIN")
      return;
    if (requester.role === "DEPARTMENT_MANAGER" && requester.departmentId === kaizen.departmentId) {
      return;
    }
    // Milestone 8: the implementation owner can be assigned from any department (see
    // AssignImplementationSchema), so they need to view the Kaizen even outside every branch
    // above. Purely additive — every previously-valid viewer above is unaffected.
    if (kaizen.assignedOwnerId && kaizen.assignedOwnerId === requester.id) return;
    throw new ApiError("FORBIDDEN", "You cannot view this Kaizen.", 403);
  }

  private assertCanEdit(
    kaizen: { submitterId: string; status: string },
    requester: Requester,
  ): void {
    const isOwner = kaizen.submitterId === requester.id;
    const isSuperAdmin = requester.role === "SUPER_ADMIN";
    if (!isOwner && !isSuperAdmin) {
      throw new ApiError("FORBIDDEN", "You cannot edit this Kaizen.", 403);
    }
    if (!EDITABLE_STATUSES.includes(kaizen.status as (typeof EDITABLE_STATUSES)[number])) {
      throw new ApiError("CONFLICT", "This Kaizen is read-only in its current status.", 409);
    }
  }
}

export const kaizenService = new KaizenService();
