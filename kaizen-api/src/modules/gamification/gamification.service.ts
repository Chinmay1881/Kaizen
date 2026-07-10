import type { LeaderboardPeriod, LeaderboardScope, Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { buildPaginationMeta, getSkipTake } from "../../utils/pagination.js";
import { notificationService } from "../notifications/notification.service.js";
import type { UserRole } from "../../constants/roles.js";
import type {
  AchievementDefinitionItem,
  LeaderboardEntry,
  LeaderboardResult,
  PaginatedPointsLedger,
  UserAchievementItem,
} from "./gamification.types.js";

interface Requester {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

const COMPANY_WIDE_ROLES: UserRole[] = ["HR", "CMD", "SUPER_ADMIN"];

type StatField = "ideasSubmitted" | "ideasApproved" | "ideasImplemented";

interface AwardPointsInput {
  userId: string;
  amount: number;
  reason: string;
  kaizenId?: string;
  issuedById?: string;
  statField?: StatField;
}

const LEADERBOARD_PERIODS: LeaderboardPeriod[] = ["MONTHLY", "QUARTERLY", "YEARLY", "ALL_TIME"];

/** Start of the current window for a given period, or `null` for ALL_TIME (no lower bound). Used
 * to sum `points_ledger` (append-only, timestamped) rather than reading the all-time
 * `user_gamification.total_points` cache, so MONTHLY/QUARTERLY/YEARLY are genuinely time-windowed
 * per docs/engineering/01_DATABASE_SCHEMA.md's 4 distinct `LeaderboardPeriod` values. */
function periodStart(period: LeaderboardPeriod): Date | null {
  const now = new Date();
  switch (period) {
    case "MONTHLY":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "QUARTERLY":
      return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    case "YEARLY":
      return new Date(now.getFullYear(), 0, 1);
    case "ALL_TIME":
      return null;
  }
}

function toAchievementDefinitionItem(achievement: {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementDefinitionItem["rarity"];
  pointsAwarded: number;
  isActive: boolean;
}): AchievementDefinitionItem {
  return {
    id: achievement.id,
    code: achievement.code,
    name: achievement.name,
    description: achievement.description,
    icon: achievement.icon,
    rarity: achievement.rarity,
    pointsAwarded: achievement.pointsAwarded,
    isActive: achievement.isActive,
  };
}

/** Backs docs/engineering/02_API_SPECIFICATION.md's "Gamification" and "Rewards" sections'
 * read/write surface for points, achievements, and leaderboards. `platform_settings` (`points.*`
 * keys) are the single source of truth for point values — never hardcoded here — matching
 * SCORE-001's precedent of DB-seeded, not code-constant, tunable values. */
class GamificationService {
  /** Writes a points_ledger row, updates the cached `user_gamification` totals/stat counter, then
   * recomputes the two leaderboards that matter for this user (MONTHLY/COMPANY for
   * `currentRank` + TOP_CONTRIBUTOR, MONTHLY/DEPARTMENT for DEPARTMENT_HERO) so achievement checks
   * that follow have fresh rank data. Full recompute across every period/scope is the leaderboard
   * job's job (`recomputeAllLeaderboards`), not this hot path. */
  async awardPointsAndRecompute(input: AwardPointsInput): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.pointsLedger.create({
        data: {
          userId: input.userId,
          amount: input.amount,
          reason: input.reason,
          kaizenId: input.kaizenId,
          issuedById: input.issuedById,
        },
      });

      await tx.userGamification.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          totalPoints: input.amount,
          ...(input.statField ? { [input.statField]: 1 } : {}),
        },
        update: {
          totalPoints: { increment: input.amount },
          ...(input.statField ? { [input.statField]: { increment: 1 } } : {}),
        },
      });
    });

    await this.recomputeForUser(input.userId);
  }

  /** Recomputes MONTHLY/COMPANY and, if the user belongs to a department, MONTHLY/DEPARTMENT —
   * then syncs `currentRank` for *only* the triggering user (a single O(1) write). Earlier this
   * bulk-updated every ranked company user in one transaction on every points-award event — O(N)
   * writes per action, found to be slow enough under concurrent event handling to lose a race
   * against a since-deleted user during verification. Other users' `currentRank` catches up the
   * next time *their own* event fires; `getLeaderboard` never reads this cached field (it always
   * recomputes fresh), so the only consumer of staleness here is each user's own `/me` display. */
  private async recomputeForUser(
    userId: string,
  ): Promise<{ companyRank: number | null; departmentRank: number | null }> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true } });

    const companyRankings = await this.recomputeLeaderboard("MONTHLY", "COMPANY");
    const companyRank = companyRankings.find((entry) => entry.userId === userId)?.rank ?? null;
    if (companyRank !== null) {
      await prisma.userGamification.update({ where: { userId }, data: { currentRank: companyRank } });
    }

    let departmentRank: number | null = null;
    if (user?.departmentId) {
      const departmentRankings = await this.recomputeLeaderboard(
        "MONTHLY",
        "DEPARTMENT",
        user.departmentId,
      );
      departmentRank = departmentRankings.find((entry) => entry.userId === userId)?.rank ?? null;
    }

    return { companyRank, departmentRank };
  }

  /** GET /leaderboard — always recomputes fresh rather than trusting a possibly-stale snapshot:
   * no cron scheduler is wired up in this codebase (see `startBackgroundJobs`), so reading a
   * merely-cached snapshot could silently go stale forever. Correctness over a genuine
   * precomputed-cache optimization, matching MVP scope. */
  async getLeaderboard(
    period: LeaderboardPeriod,
    scope: LeaderboardScope,
    departmentId?: string,
  ): Promise<LeaderboardResult> {
    if (scope === "DEPARTMENT" && !departmentId) {
      throw new ApiError("VALIDATION_ERROR", "departmentId is required when scope=DEPARTMENT.", 400, [
        { field: "departmentId", message: "Required when scope=DEPARTMENT." },
      ]);
    }

    const rankings = await this.recomputeLeaderboard(period, scope, departmentId);
    return {
      period,
      scope,
      departmentId: departmentId ?? null,
      rankings,
      computedAt: new Date().toISOString(),
    };
  }

  async recomputeLeaderboard(
    period: LeaderboardPeriod,
    scope: LeaderboardScope,
    departmentId?: string,
  ): Promise<LeaderboardEntry[]> {
    const start = periodStart(period);

    const userWhere: Prisma.UserWhereInput = {
      isActive: true,
      deletedAt: null,
      ...(scope === "DEPARTMENT" && departmentId ? { departmentId } : {}),
    };

    const users = await prisma.user.findMany({
      where: userWhere,
      select: { id: true, displayName: true, department: { select: { name: true } } },
    });
    const userIds = users.map((user) => user.id);

    const [pointsSums, gamificationRows, achievementCounts] = await Promise.all([
      userIds.length > 0
        ? prisma.pointsLedger.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds }, ...(start ? { createdAt: { gte: start } } : {}) },
            _sum: { amount: true },
          })
        : Promise.resolve([]),
      userIds.length > 0
        ? prisma.userGamification.findMany({
            where: { userId: { in: userIds } },
            select: { userId: true, ideasApproved: true },
          })
        : Promise.resolve([]),
      userIds.length > 0
        ? prisma.userAchievement.groupBy({
            by: ["userId"],
            where: { userId: { in: userIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ]);

    const pointsMap = new Map(pointsSums.map((row) => [row.userId, row._sum.amount ?? 0]));
    const approvedMap = new Map(gamificationRows.map((row) => [row.userId, row.ideasApproved]));
    const achievementMap = new Map(achievementCounts.map((row) => [row.userId, row._count._all]));

    const rankings: LeaderboardEntry[] = users
      .map((user) => ({
        userId: user.id,
        displayName: user.displayName,
        departmentName: user.department?.name ?? null,
        totalPoints: pointsMap.get(user.id) ?? 0,
        ideasApproved: approvedMap.get(user.id) ?? 0,
        achievementCount: achievementMap.get(user.id) ?? 0,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, index) => ({ rank: index + 1, ...entry }));

    // Compound-unique upsert on a nullable field (`departmentId`) has awkward Prisma typing for
    // the COMPANY case (departmentId: null), so find-then-create/update explicitly instead.
    const existingSnapshot = await prisma.leaderboardSnapshot.findFirst({
      where: { period, scope, departmentId: departmentId ?? null },
      select: { id: true },
    });
    if (existingSnapshot) {
      await prisma.leaderboardSnapshot.update({
        where: { id: existingSnapshot.id },
        data: { rankings: rankings as unknown as Prisma.InputJsonValue, computedAt: new Date() },
      });
    } else {
      await prisma.leaderboardSnapshot.create({
        data: {
          period,
          scope,
          departmentId: departmentId ?? null,
          rankings: rankings as unknown as Prisma.InputJsonValue,
          computedAt: new Date(),
        },
      });
    }

    return rankings;
  }

  /** Called by the (unscheduled — no cron library installed) leaderboard-refresh job body, and
   * available for a future scheduler to call directly. `getLeaderboard`/`awardPointsAndRecompute`
   * don't depend on this running — they recompute what they need inline — so its absence from an
   * actual cron schedule does not leave any read stale. */
  async recomputeAllLeaderboards(): Promise<void> {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const period of LEADERBOARD_PERIODS) {
      await this.recomputeLeaderboard(period, "COMPANY");
      for (const department of departments) {
        await this.recomputeLeaderboard(period, "DEPARTMENT", department.id);
      }
    }
  }

  /** GET /achievements — all active achievement definitions. */
  async getAchievements(): Promise<AchievementDefinitionItem[]> {
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    return achievements.map(toAchievementDefinitionItem);
  }

  /** GET /users/:id/achievements — "Self, HR, CMD, Super Admin". Earned achievements, most
   * recent first. */
  async getUserAchievements(userId: string, requester: Requester): Promise<UserAchievementItem[]> {
    this.assertCanViewUser(userId, requester);

    const rows = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      earnedAt: row.earnedAt.toISOString(),
      achievement: toAchievementDefinitionItem(row.achievement),
    }));
  }

  /** GET /users/:id/points — "Self, HR, CMD, Super Admin". Points ledger history, most recent
   * first. */
  async getUserPoints(
    userId: string,
    requester: Requester,
    pagination: { page?: number; pageSize?: number },
  ): Promise<PaginatedPointsLedger> {
    this.assertCanViewUser(userId, requester);

    const page = Math.max(1, pagination.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, pagination.pageSize ?? 25));
    const { skip, take } = getSkipTake({ page, pageSize });

    const where = { userId };
    const [rows, total] = await Promise.all([
      prisma.pointsLedger.findMany({
        where,
        include: { issuedBy: { select: { id: true, displayName: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.pointsLedger.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        amount: row.amount,
        reason: row.reason,
        kaizenId: row.kaizenId,
        issuedBy: row.issuedBy,
        createdAt: row.createdAt.toISOString(),
      })),
      meta: buildPaginationMeta({ page, pageSize }, total),
    };
  }

  /** Evaluates every active achievement not yet earned by `userId` against its `criteria` JSON,
   * awards any newly-qualifying ones (points, notification), and returns them. Rank-based criteria
   * (LEADERBOARD_RANK, DEPARTMENT_TOP_RANK) use the fresh ranks from `recomputeForUser`, so this
   * should be called after `awardPointsAndRecompute` (or independently — it recomputes itself). */
  async checkAndAwardAchievements(userId: string): Promise<AchievementDefinitionItem[]> {
    const { companyRank, departmentRank } = await this.recomputeForUser(userId);

    const [gamification, achievements, earned, businessImpactCount, evaluationStats] =
      await Promise.all([
        prisma.userGamification.findUnique({ where: { userId } }),
        prisma.achievement.findMany({ where: { isActive: true } }),
        prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
        prisma.businessImpact.count({ where: { kaizen: { submitterId: userId } } }),
        prisma.evaluation.aggregate({
          where: {
            isSubmitted: true,
            kaizen: {
              submitterId: userId,
              status: {
                in: [
                  "APPROVED",
                  "IMPLEMENTATION_IN_PROGRESS",
                  "IMPLEMENTATION_COMPLETED",
                  "BUSINESS_IMPACT_RECORDED",
                  "REWARD_ISSUED",
                  "ARCHIVED",
                  "PUBLISHED_TO_KNOWLEDGE_BASE",
                ],
              },
            },
          },
          _avg: { overallRating: true },
          _count: { _all: true },
        }),
      ]);

    if (!gamification) return [];

    const earnedIds = new Set(earned.map((row) => row.achievementId));
    const avgScore = evaluationStats._avg.overallRating ? Number(evaluationStats._avg.overallRating) : 0;
    const evaluatedApprovedCount = evaluationStats._count._all;

    const newlyUnlocked: typeof achievements = [];

    for (const achievement of achievements) {
      if (earnedIds.has(achievement.id)) continue;

      const criteria = achievement.criteria as Record<string, unknown>;
      const meets = this.meetsCriteria(criteria, {
        ideasSubmitted: gamification.ideasSubmitted,
        ideasApproved: gamification.ideasApproved,
        ideasImplemented: gamification.ideasImplemented,
        businessImpactCount,
        companyRank,
        departmentRank,
        avgScore,
        evaluatedApprovedCount,
      });

      if (meets) newlyUnlocked.push(achievement);
    }

    for (const achievement of newlyUnlocked) {
      await prisma.$transaction(async (tx) => {
        await tx.userAchievement.create({ data: { userId, achievementId: achievement.id } });
        await tx.pointsLedger.create({
          data: { userId, amount: achievement.pointsAwarded, reason: "ACHIEVEMENT_UNLOCKED" },
        });
        await tx.userGamification.update({
          where: { userId },
          data: { totalPoints: { increment: achievement.pointsAwarded } },
        });
      });

      await notificationService.create({
        userId,
        type: "ACHIEVEMENT_UNLOCKED",
        title: "Achievement unlocked!",
        body: `You unlocked "${achievement.name}" (+${achievement.pointsAwarded} points).`,
        entityType: "Achievement",
        entityId: achievement.id,
      });
    }

    return newlyUnlocked.map(toAchievementDefinitionItem);
  }

  private meetsCriteria(
    criteria: Record<string, unknown>,
    stats: {
      ideasSubmitted: number;
      ideasApproved: number;
      ideasImplemented: number;
      businessImpactCount: number;
      companyRank: number | null;
      departmentRank: number | null;
      avgScore: number;
      evaluatedApprovedCount: number;
    },
  ): boolean {
    switch (criteria.type) {
      case "IDEAS_SUBMITTED":
        return stats.ideasSubmitted >= Number(criteria.threshold);
      case "IDEAS_APPROVED":
        return stats.ideasApproved >= Number(criteria.threshold);
      case "IDEAS_IMPLEMENTED":
        return stats.ideasImplemented >= Number(criteria.threshold);
      case "BUSINESS_IMPACT_COUNT":
        return stats.businessImpactCount >= Number(criteria.threshold);
      case "LEADERBOARD_RANK":
        return stats.companyRank !== null && stats.companyRank <= Number(criteria.maxRank);
      case "DEPARTMENT_TOP_RANK":
        return stats.departmentRank === 1;
      case "AVG_EVALUATION_SCORE":
        return (
          stats.evaluatedApprovedCount >= Number(criteria.minCount) &&
          stats.avgScore >= Number(criteria.minScore)
        );
      default:
        return false;
    }
  }

  /** `platform_settings.points.*` values, MVP point amounts per docs/engineering/01_DATABASE_SCHEMA.md
   * — the single source of truth for these, never hardcoded at call sites. `fallback` only
   * covers the case where seeding hasn't run yet. */
  async getPointsSetting(key: string, fallback: number): Promise<number> {
    const setting = await prisma.platformSetting.findUnique({ where: { key } });
    if (!setting) return fallback;
    const value = Number(setting.value);
    return Number.isFinite(value) ? value : fallback;
  }

  /** Matches ImplementationService/BusinessImpactService's own local `assertCanView`-style
   * predicates — "Self, HR, CMD, Super Admin" per the API spec for every `/users/:id/...`
   * gamification sub-route. */
  private assertCanViewUser(targetUserId: string, requester: Requester): void {
    if (requester.id === targetUserId) return;
    if (COMPANY_WIDE_ROLES.includes(requester.role)) return;
    throw new ApiError("FORBIDDEN", "You cannot view this user's gamification data.", 403);
  }
}

export const gamificationService = new GamificationService();
