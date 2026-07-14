import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { buildPaginationMeta, getSkipTake } from "../../utils/pagination.js";
import { kaizenService } from "../kaizens/kaizen.service.js";
import { KAIZEN_LIST_SELECT, toListItem } from "../kaizens/kaizen.mapper.js";
import type { PaginatedKaizens } from "../kaizens/kaizen.types.js";
import { workflowService } from "../workflow/workflow.service.js";
import type { CreateCommentSchema, ReviewQueueQuerySchema } from "./review.schema.js";
import type { ReviewActionResult, ReviewCommentItem } from "./review.types.js";
import type { UserRole } from "../../constants/roles.js";
import { KAIZEN_STATUSES, type KaizenStatus } from "../../constants/kaizen-status.js";

interface Requester {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

const REVIEWER_ROLES: UserRole[] = ["DEPARTMENT_MANAGER", "HR", "CMD", "SUPER_ADMIN"];
const COMPANY_WIDE_ROLES: UserRole[] = ["HR", "CMD", "SUPER_ADMIN"];

function toCommentItem(comment: {
  id: string;
  kaizenId: string;
  parentId: string | null;
  body: string;
  isResolved: boolean;
  author: { id: string; displayName: string; role: string };
  createdAt: Date;
  updatedAt: Date;
}): ReviewCommentItem {
  return {
    id: comment.id,
    kaizenId: comment.kaizenId,
    parentId: comment.parentId,
    body: comment.body,
    isResolved: comment.isResolved,
    author: comment.author,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

class ReviewService {
  /** GET /reviews/queue — reuses the exact same list select/mapper/pagination helpers as
   * KaizenService.list (Milestone 5), scoped per the RBAC table instead of self-only: Department
   * Manager sees their own department, HR/CMD/Super Admin see everything. Route-level
   * `requireRole("DEPARTMENT_MANAGER")` already keeps Employees out before this ever runs. */
  async getQueue(requester: Requester, query: ReviewQueueQuerySchema): Promise<PaginatedKaizens> {
    if (requester.role === "DEPARTMENT_MANAGER" && !requester.departmentId) {
      const page = Math.max(1, query.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
      return { items: [], meta: buildPaginationMeta({ page, pageSize }, 0) };
    }

    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
    const { skip, take } = getSkipTake({ page, pageSize });

    const statusList = query.status
      ?.split(",")
      .map((value) => value.trim().toUpperCase())
      .filter((value): value is KaizenStatus =>
        (KAIZEN_STATUSES as readonly string[]).includes(value),
      );

    const isCompanyWide = COMPANY_WIDE_ROLES.includes(requester.role);

    const where: Prisma.KaizenWhereInput = {
      ...(statusList && statusList.length > 0
        ? { status: { in: statusList } }
        : { status: { not: "DRAFT" } }),
      ...(isCompanyWide
        ? query.departmentId
          ? { departmentId: query.departmentId }
          : {}
        : { departmentId: requester.departmentId as string }),
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
            submittedAt: {
              ...(query.dateFrom ? { gte: query.dateFrom } : {}),
              ...(query.dateTo ? { lte: query.dateTo } : {}),
            },
          }
        : {}),
      ...(query.submitterId ? { submitterId: query.submitterId } : {}),
      ...(query.assignedReviewerId ? { assignedReviewerId: query.assignedReviewerId } : {}),
      ...(query.recommendation || query.scoreMin !== undefined || query.scoreMax !== undefined
        ? {
            evaluations: {
              some: {
                isSubmitted: true,
                ...(query.recommendation ? { recommendation: query.recommendation } : {}),
                ...(query.scoreMin !== undefined || query.scoreMax !== undefined
                  ? {
                      overallRating: {
                        ...(query.scoreMin !== undefined ? { gte: query.scoreMin } : {}),
                        ...(query.scoreMax !== undefined ? { lte: query.scoreMax } : {}),
                      },
                    }
                  : {}),
              },
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

  /** POST /kaizens/:id/review/start — SUBMITTED -> UNDER_REVIEW, assigns the acting manager as
   * the Kaizen's reviewer. */
  async startReview(kaizenId: string, requester: Requester): Promise<ReviewActionResult> {
    const kaizen = await kaizenService.getById(kaizenId, requester);
    this.assertCanManage(kaizen, requester);

    const updated = await workflowService.transition({
      kaizenId,
      toStatus: "UNDER_REVIEW",
      actor: requester,
      description: "Review started.",
      extraData: { assignedReviewerId: requester.id },
    });

    return {
      id: updated.id,
      kaizenNumber: updated.kaizenNumber,
      status: updated.status as ReviewActionResult["status"],
    };
  }

  /** POST /kaizens/:id/review/approve — UNDER_REVIEW -> APPROVED.
   * Precondition (per the API spec, enforced since Milestone 7 / Scoring Engine): the acting
   * manager must have a submitted Evaluation on this Kaizen recommending APPROVE. */
  async approve(
    kaizenId: string,
    requester: Requester,
    notes: string | undefined,
  ): Promise<ReviewActionResult> {
    const kaizen = await kaizenService.getById(kaizenId, requester);
    this.assertCanManage(kaizen, requester);
    await this.assertEvaluationRecommends(kaizenId, requester, "APPROVE");

    const updated = await workflowService.transition({
      kaizenId,
      toStatus: "APPROVED",
      actor: requester,
      description: notes ? `Kaizen approved. ${notes}` : "Kaizen approved.",
      extraData: { approvedAt: new Date() },
      metadata: notes ? { notes } : undefined,
    });

    return {
      id: updated.id,
      kaizenNumber: updated.kaizenNumber,
      status: updated.status as ReviewActionResult["status"],
    };
  }

  /** POST /kaizens/:id/review/reject — UNDER_REVIEW -> REJECTED. Same evaluation precondition as
   * `approve`, requiring a submitted Evaluation recommending REJECT. */
  async reject(
    kaizenId: string,
    requester: Requester,
    notes: string | undefined,
  ): Promise<ReviewActionResult> {
    const kaizen = await kaizenService.getById(kaizenId, requester);
    this.assertCanManage(kaizen, requester);
    await this.assertEvaluationRecommends(kaizenId, requester, "REJECT");

    const updated = await workflowService.transition({
      kaizenId,
      toStatus: "REJECTED",
      actor: requester,
      description: notes ? `Kaizen rejected. ${notes}` : "Kaizen rejected.",
      metadata: notes ? { notes } : undefined,
    });

    return {
      id: updated.id,
      kaizenNumber: updated.kaizenNumber,
      status: updated.status as ReviewActionResult["status"],
    };
  }

  /** POST /kaizens/:id/review/needs-changes — UNDER_REVIEW -> NEEDS_CHANGES. */
  async requestChanges(
    kaizenId: string,
    requester: Requester,
    notes: string | undefined,
  ): Promise<ReviewActionResult> {
    const kaizen = await kaizenService.getById(kaizenId, requester);
    this.assertCanManage(kaizen, requester);

    const updated = await workflowService.transition({
      kaizenId,
      toStatus: "NEEDS_CHANGES",
      actor: requester,
      description: notes ? `Changes requested. ${notes}` : "Changes requested.",
      metadata: notes ? { notes } : undefined,
    });

    return {
      id: updated.id,
      kaizenNumber: updated.kaizenNumber,
      status: updated.status as ReviewActionResult["status"],
    };
  }

  /** GET /kaizens/:id/comments — reuses KaizenService.getById purely for its view-permission
   * check (submitter, or reviewer scoped by department/role); the detail payload itself is
   * discarded. */
  async listComments(kaizenId: string, requester: Requester): Promise<ReviewCommentItem[]> {
    await kaizenService.getById(kaizenId, requester);

    const comments = await prisma.reviewComment.findMany({
      where: { kaizenId },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { id: true, displayName: true, role: true } } },
    });

    return comments.map(toCommentItem);
  }

  /** POST /kaizens/:id/comments — "Reviewers + submitter (on needs_changes)" per the API spec. */
  async addComment(
    kaizenId: string,
    requester: Requester,
    input: CreateCommentSchema,
  ): Promise<ReviewCommentItem> {
    const kaizen = await kaizenService.getById(kaizenId, requester);
    this.assertCanComment(kaizen, requester);

    if (input.parentId) {
      const parent = await prisma.reviewComment.findUnique({ where: { id: input.parentId } });
      if (!parent || parent.kaizenId !== kaizenId) {
        throw new ApiError("VALIDATION_ERROR", "Parent comment not found.", 400, [
          { field: "parentId", message: "Parent comment not found." },
        ]);
      }
    }

    const comment = await prisma.reviewComment.create({
      data: {
        kaizenId,
        authorId: requester.id,
        parentId: input.parentId ?? null,
        body: input.body,
      },
      include: { author: { select: { id: true, displayName: true, role: true } } },
    });

    await prisma.timelineEvent.create({
      data: {
        kaizenId,
        eventType: "COMMENT_ADDED",
        actorId: requester.id,
        description: "Comment added.",
      },
    });

    return toCommentItem(comment);
  }

  /** PATCH /kaizens/:id/comments/:commentId/resolve — Department Manager (same department) only,
   * per the API spec. */
  async resolveComment(
    kaizenId: string,
    commentId: string,
    requester: Requester,
  ): Promise<ReviewCommentItem> {
    const kaizen = await kaizenService.getById(kaizenId, requester);
    this.assertCanManage(kaizen, requester);

    const comment = await prisma.reviewComment.findUnique({ where: { id: commentId } });
    if (!comment || comment.kaizenId !== kaizenId) {
      throw new ApiError("NOT_FOUND", "Comment not found.", 404);
    }

    const updated = await prisma.reviewComment.update({
      where: { id: commentId },
      data: { isResolved: true },
      include: { author: { select: { id: true, displayName: true, role: true } } },
    });

    return toCommentItem(updated);
  }

  /** Review actions (start/approve/reject/needs-changes/resolve) are scoped to "Department
   * Manager (same department)", with CMD and Super Admin as enterprise-wide overrides that can
   * act on any Kaizen regardless of department — not the broader reviewer set that can merely
   * view or comment (HR included there is deliberately excluded here; HR can view/comment but
   * cannot take review actions). Milestone 20 — restores this after the Milestone 13 Review
   * Workspace rebuild regressed it to Department-Manager-only, silently locking out CMD/Super
   * Admin. */
  private assertCanManage(kaizen: { department: { id: string } }, requester: Requester): void {
    if (requester.role === "SUPER_ADMIN" || requester.role === "CMD") return;
    if (requester.role === "DEPARTMENT_MANAGER" && requester.departmentId === kaizen.department.id) {
      return;
    }
    throw new ApiError(
      "FORBIDDEN",
      "Only the department manager for this Kaizen — or CMD/Super Admin — can perform review actions.",
      403,
    );
  }

  /** Precondition on Approve/Reject per docs/engineering/02_API_SPECIFICATION.md: "Evaluation
   * submitted with recommendation: APPROVE/REJECT". Deliberately not enforced by Milestone 6 (the
   * Scoring Engine didn't exist yet — see PROJECT_STATUS.md Known Limitations); enforced now that
   * it does (Milestone 7). Checks the acting manager's own evaluation, matching the
   * `(kaizenId, reviewerId)` uniqueness the schema already models. */
  private async assertEvaluationRecommends(
    kaizenId: string,
    requester: Requester,
    recommendation: "APPROVE" | "REJECT",
  ): Promise<void> {
    const evaluation = await prisma.evaluation.findUnique({
      where: { kaizenId_reviewerId: { kaizenId, reviewerId: requester.id } },
      select: { isSubmitted: true, recommendation: true },
    });

    if (!evaluation?.isSubmitted || evaluation.recommendation !== recommendation) {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        `Submit an evaluation with recommendation ${recommendation} before ${recommendation === "APPROVE" ? "approving" : "rejecting"} this Kaizen.`,
        409,
      );
    }
  }

  private assertCanComment(
    kaizen: { status: KaizenStatus; department: { id: string }; submitter: { id: string } },
    requester: Requester,
  ): void {
    const isReviewer =
      REVIEWER_ROLES.includes(requester.role) &&
      (requester.role !== "DEPARTMENT_MANAGER" || requester.departmentId === kaizen.department.id);
    if (isReviewer) return;

    if (kaizen.submitter.id === requester.id && kaizen.status === "NEEDS_CHANGES") return;

    throw new ApiError("FORBIDDEN", "You cannot comment on this Kaizen.", 403);
  }
}

export const reviewService = new ReviewService();
