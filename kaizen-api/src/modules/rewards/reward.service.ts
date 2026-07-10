import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { buildPaginationMeta, getSkipTake } from "../../utils/pagination.js";
import { gamificationService } from "../gamification/gamification.service.js";
import { workflowService } from "../workflow/workflow.service.js";
import type { PaginatedRewards, RewardItem } from "./reward.types.js";
import type { UserRole } from "../../constants/roles.js";

interface Requester {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

const COMPANY_WIDE_ROLES: UserRole[] = ["HR", "CMD", "SUPER_ADMIN"];

const REWARD_INCLUDE = {
  kaizen: { select: { id: true, kaizenNumber: true, title: true } },
  issuedBy: { select: { id: true, displayName: true } },
} as const;

function toRewardItem(reward: {
  id: string;
  kaizenId: string;
  kaizen: { id: string; kaizenNumber: string; title: string };
  points: number;
  reason: string;
  issuedBy: { id: string; displayName: string } | null;
  createdAt: Date;
}): RewardItem {
  return {
    id: reward.id,
    kaizenId: reward.kaizenId,
    kaizen: reward.kaizen,
    points: reward.points,
    reason: reward.reason,
    issuedBy: reward.issuedBy,
    createdAt: reward.createdAt.toISOString(),
  };
}

/** Backs the API spec's "Rewards" section: `BUSINESS_IMPACT_RECORDED -> REWARD_ISSUED`. Points
 * ledger + achievement checks + leaderboard recompute + notification for the reward itself are
 * handled by the `reward.issued` domain event subscriber in `src/events/handlers/index.ts` — this
 * service's job is only the transition and the historical `Reward` record, matching the
 * decoupled "Workflow emits, feature modules subscribe" architecture established since Milestone
 * 6/8's `WorkflowService`. */
class RewardService {
  /** POST /kaizens/:id/rewards/issue — "Auth: System (internal) or Super Admin". This is the
   * Super-Admin-callable manual-retry path (route-guarded to SUPER_ADMIN); the "System (internal)"
   * path is `autoIssue`, called directly from the `business_impact.recorded` event handler,
   * bypassing HTTP/auth entirely by design. */
  async issue(kaizenId: string, requester: Requester): Promise<RewardItem> {
    return this.performIssue(kaizenId, requester);
  }

  /** Internal — called from the `business_impact.recorded` event handler. `actorId` is whoever
   * recorded the business impact (from the emitted event payload); looked up here for its role
   * since `WorkflowService.transition` needs `{id, role}`, not just an id. */
  async autoIssue(kaizenId: string, actorId: string): Promise<RewardItem | null> {
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { id: true, role: true },
    });
    if (!actor) return null;
    return this.performIssue(kaizenId, actor);
  }

  /** GET /users/:id/rewards — "Self, HR, CMD, Super Admin". Reward history, most recent first. */
  async getHistory(
    userId: string,
    requester: Requester,
    pagination: { page?: number; pageSize?: number },
  ): Promise<PaginatedRewards> {
    this.assertCanViewUser(userId, requester);

    const page = Math.max(1, pagination.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, pagination.pageSize ?? 25));
    const { skip, take } = getSkipTake({ page, pageSize });

    const where = { userId };
    const [rows, total] = await Promise.all([
      prisma.reward.findMany({
        where,
        include: REWARD_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.reward.count({ where }),
    ]);

    return {
      items: rows.map(toRewardItem),
      meta: buildPaginationMeta({ page, pageSize }, total),
    };
  }

  private async performIssue(
    kaizenId: string,
    actor: { id: string; role: UserRole },
  ): Promise<RewardItem> {
    const kaizen = await prisma.kaizen.findUnique({
      where: { id: kaizenId },
      select: { id: true, submitterId: true },
    });
    if (!kaizen) {
      throw new ApiError("NOT_FOUND", "Kaizen not found.", 404);
    }

    const existing = await prisma.reward.findFirst({ where: { kaizenId } });
    if (existing) {
      throw new ApiError("CONFLICT", "A reward has already been issued for this Kaizen.", 409);
    }

    const points = await gamificationService.getPointsSetting("points.business_impact_verified", 150);

    const reward = await prisma.reward.create({
      data: {
        userId: kaizen.submitterId,
        kaizenId,
        points,
        reason: "Business impact verified.",
        issuedById: actor.id,
      },
      include: REWARD_INCLUDE,
    });

    // Also validates the current state actually allows this transition (409 if not
    // BUSINESS_IMPACT_RECORDED) and emits "reward.issued" — see workflow.service.ts's DOMAIN_EVENT map.
    await workflowService.transition({
      kaizenId,
      toStatus: "REWARD_ISSUED",
      actor,
      description: "Reward issued.",
    });

    return toRewardItem(reward);
  }

  private assertCanViewUser(targetUserId: string, requester: Requester): void {
    if (requester.id === targetUserId) return;
    if (COMPANY_WIDE_ROLES.includes(requester.role)) return;
    throw new ApiError("FORBIDDEN", "You cannot view this user's rewards.", 403);
  }
}

export const rewardService = new RewardService();
