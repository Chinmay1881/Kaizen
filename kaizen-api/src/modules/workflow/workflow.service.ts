import type { Prisma, TimelineEventType } from "@prisma/client";

import { eventBus } from "../../events/event-bus.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { auditService } from "../audit/audit.service.js";
import type { UserRole } from "../../constants/roles.js";

/**
 * States a review-workspace transition can move a Kaizen INTO. DRAFT/NEEDS_CHANGES -> SUBMITTED
 * (the submitter's own action) is intentionally NOT part of this table — that transition already
 * lives in `KaizenService.submit` (Milestone 4), predates this service, and is out of scope to
 * migrate here (see docs/PROJECT_STATUS.md Technical Debt).
 */
type ReviewableStatus = "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "NEEDS_CHANGES";

const REVIEW_TRANSITIONS: Record<"SUBMITTED" | "UNDER_REVIEW", ReviewableStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "NEEDS_CHANGES"],
};

const TRANSITION_EVENT_TYPE: Record<ReviewableStatus, TimelineEventType> = {
  UNDER_REVIEW: "REVIEW_STARTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  NEEDS_CHANGES: "NEEDS_CHANGES",
};

/** Matches docs/engineering/02_API_SPECIFICATION.md's "Domain Events" table — only these three
 * review-workspace transitions have documented subscribers (Notifications/Gamification, neither
 * built yet, so `eventBus.emit` is currently a no-op — see event-bus.ts). */
const DOMAIN_EVENT: Partial<Record<ReviewableStatus, string>> = {
  APPROVED: "kaizen.approved",
  REJECTED: "kaizen.rejected",
  NEEDS_CHANGES: "kaizen.needs_changes",
};

interface TransitionParams {
  kaizenId: string;
  toStatus: ReviewableStatus;
  actor: { id: string; role: UserRole };
  description: string;
  extraData?: Prisma.KaizenUncheckedUpdateInput;
  metadata?: Record<string, unknown>;
}

/**
 * Central status-transition engine, per docs/engineering/02_API_SPECIFICATION.md's "Workflow
 * Service (Internal)" section: validates the transition, updates `kaizens.status`, writes a
 * `timeline_events` row, writes an `audit_logs` row, and emits a domain event — all in one
 * transaction. "Direct status updates in controllers are prohibited" per that doc; `ReviewService`
 * calls this rather than updating `kaizen.status` itself.
 */
class WorkflowService {
  async transition(params: TransitionParams) {
    const { kaizenId, toStatus, actor, description, extraData, metadata } = params;

    const kaizen = await prisma.kaizen.findUnique({
      where: { id: kaizenId },
      select: { id: true, status: true },
    });

    if (!kaizen) {
      throw new ApiError("NOT_FOUND", "Kaizen not found.", 404);
    }

    const allowedTargets =
      REVIEW_TRANSITIONS[kaizen.status as keyof typeof REVIEW_TRANSITIONS] ?? [];

    if (!allowedTargets.includes(toStatus)) {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        `Cannot move a Kaizen from ${kaizen.status} to ${toStatus}.`,
        409,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.kaizen.update({
        where: { id: kaizenId },
        data: { status: toStatus, ...extraData },
      });

      await tx.timelineEvent.create({
        data: {
          kaizenId,
          eventType: TRANSITION_EVENT_TYPE[toStatus],
          actorId: actor.id,
          description,
          metadata: metadata as Prisma.InputJsonValue | undefined,
        },
      });

      await auditService.record(
        {
          userId: actor.id,
          userRole: actor.role,
          action: `kaizen.${toStatus.toLowerCase()}`,
          entityType: "Kaizen",
          entityId: kaizenId,
          previousValue: { status: kaizen.status },
          newValue: { status: toStatus },
        },
        tx,
      );

      return result;
    });

    const domainEvent = DOMAIN_EVENT[toStatus];
    if (domainEvent) {
      void eventBus.emit(domainEvent, { kaizenId, actorId: actor.id });
    }

    return updated;
  }
}

export const workflowService = new WorkflowService();
