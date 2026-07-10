import type { Prisma, TimelineEventType } from "@prisma/client";

import { eventBus } from "../../events/event-bus.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { auditService } from "../audit/audit.service.js";
import type { UserRole } from "../../constants/roles.js";

/**
 * States a transition can move a Kaizen INTO. DRAFT/NEEDS_CHANGES -> SUBMITTED (the submitter's
 * own action) is intentionally NOT part of this table — that transition already lives in
 * `KaizenService.submit` (Milestone 4), predates this service, and is out of scope to migrate
 * here (see docs/PROJECT_STATUS.md Technical Debt). Extended in Milestone 8 (Implementation &
 * Business Impact) with 3 lifecycle edges, and again in Milestone 9 (Notifications &
 * Gamification) with `REWARD_ISSUED`, per PROJECT_STATUS.md's own Technical Debt note
 * anticipating exactly this: "later milestones... will need to extend this table rather than
 * build a second, parallel transition mechanism."
 */
type TransitionableStatus =
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_CHANGES"
  | "IMPLEMENTATION_IN_PROGRESS"
  | "IMPLEMENTATION_COMPLETED"
  | "BUSINESS_IMPACT_RECORDED"
  | "REWARD_ISSUED";

const STATUS_TRANSITIONS: Record<
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "IMPLEMENTATION_IN_PROGRESS"
  | "IMPLEMENTATION_COMPLETED"
  | "BUSINESS_IMPACT_RECORDED",
  TransitionableStatus[]
> = {
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "NEEDS_CHANGES"],
  APPROVED: ["IMPLEMENTATION_IN_PROGRESS"],
  IMPLEMENTATION_IN_PROGRESS: ["IMPLEMENTATION_COMPLETED"],
  IMPLEMENTATION_COMPLETED: ["BUSINESS_IMPACT_RECORDED"],
  BUSINESS_IMPACT_RECORDED: ["REWARD_ISSUED"],
};

const TRANSITION_EVENT_TYPE: Record<TransitionableStatus, TimelineEventType> = {
  UNDER_REVIEW: "REVIEW_STARTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  NEEDS_CHANGES: "NEEDS_CHANGES",
  IMPLEMENTATION_IN_PROGRESS: "IMPLEMENTATION_ASSIGNED",
  IMPLEMENTATION_COMPLETED: "IMPLEMENTATION_COMPLETED",
  BUSINESS_IMPACT_RECORDED: "BUSINESS_IMPACT_RECORDED",
  REWARD_ISSUED: "REWARD_ISSUED",
};

/** Matches docs/engineering/02_API_SPECIFICATION.md's "Domain Events" table. Notification and
 * Gamification subscribers for these are registered in `src/events/handlers/index.ts` as of
 * Milestone 9 — previously all no-ops. Assign (→ IMPLEMENTATION_IN_PROGRESS) has no documented
 * domain event, so none is emitted for it. */
const DOMAIN_EVENT: Partial<Record<TransitionableStatus, string>> = {
  APPROVED: "kaizen.approved",
  REJECTED: "kaizen.rejected",
  NEEDS_CHANGES: "kaizen.needs_changes",
  IMPLEMENTATION_COMPLETED: "implementation.completed",
  BUSINESS_IMPACT_RECORDED: "business_impact.recorded",
  REWARD_ISSUED: "reward.issued",
};

interface TransitionParams {
  kaizenId: string;
  toStatus: TransitionableStatus;
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
      STATUS_TRANSITIONS[kaizen.status as keyof typeof STATUS_TRANSITIONS] ?? [];

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
