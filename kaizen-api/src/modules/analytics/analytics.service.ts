import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { gamificationService } from "../gamification/gamification.service.js";
import type {
  DateRangeQuerySchema,
  DepartmentAnalyticsQuerySchema,
  TrendsQuerySchema,
} from "./analytics.schema.js";
import type {
  AnalyticsCharts,
  AnalyticsOverview,
  ChartPoint,
  DepartmentAnalyticsItem,
  EmployeeAnalytics,
  KaizenAnalytics,
  LeaderboardPreviewEntry,
  PerformanceMetrics,
  StatusCounts,
  TrendPoint,
} from "./analytics.types.js";
import type { UserRole } from "../../constants/roles.js";

interface Requester {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

const COMPANY_WIDE_ROLES: UserRole[] = ["HR", "CMD", "SUPER_ADMIN"];

/** Every status a Kaizen passes through only after being approved — used for `approvalRate` and
 * as the "reviewed favorably" superset (a Kaizen doesn't stop being "approved" just because it
 * later moved on to implementation). */
const APPROVED_SUPERSET_STATUSES = [
  "APPROVED",
  "IMPLEMENTATION_IN_PROGRESS",
  "IMPLEMENTATION_COMPLETED",
  "BUSINESS_IMPACT_RECORDED",
  "REWARD_ISSUED",
  "ARCHIVED",
  "PUBLISHED_TO_KNOWLEDGE_BASE",
] as const;

function buildDateWhere(
  range: DateRangeQuerySchema,
  field: "createdAt" | "submittedAt" = "createdAt",
): Prisma.KaizenWhereInput {
  if (!range.dateFrom && !range.dateTo) return {};
  return {
    [field]: {
      ...(range.dateFrom ? { gte: range.dateFrom } : {}),
      ...(range.dateTo ? { lte: range.dateTo } : {}),
    },
  };
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastNMonthLabels(n: number): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    labels.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return labels;
}

/** Sums `value` per calendar month across the trailing `months` months (zero-filled). */
function bucketSumByMonth(rows: Array<{ date: Date; value: number }>, months = 12): ChartPoint[] {
  const labels = lastNMonthLabels(months);
  const totals = new Map(labels.map((label) => [label, 0]));
  for (const row of rows) {
    const key = monthKey(row.date);
    if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + row.value);
  }
  return labels.map((label) => ({ label, value: totals.get(label) ?? 0 }));
}

/** Averages `value` per calendar month across the trailing `months` months (zero-filled). */
function bucketAvgByMonth(rows: Array<{ date: Date; value: number }>, months = 12): ChartPoint[] {
  const labels = lastNMonthLabels(months);
  const buckets = new Map(labels.map((label) => [label, [] as number[]]));
  for (const row of rows) {
    const key = monthKey(row.date);
    buckets.get(key)?.push(row.value);
  }
  return labels.map((label) => {
    const values = buckets.get(label) ?? [];
    const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    return { label, value: Math.round(avg * 10) / 10 };
  });
}

type Granularity = "day" | "week" | "month";

function bucketKey(date: Date, granularity: Granularity): string {
  if (granularity === "day") return date.toISOString().slice(0, 10);
  if (granularity === "month") return monthKey(date);

  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function defaultTrendRange(granularity: Granularity): { from: Date; to: Date } {
  const to = new Date();
  if (granularity === "day") return { from: new Date(to.getTime() - 29 * 86_400_000), to };
  if (granularity === "week") return { from: new Date(to.getTime() - 83 * 86_400_000), to };
  return { from: new Date(to.getFullYear(), to.getMonth() - 11, 1), to };
}

/** Backs the API spec's "Analytics" section (`GET /api/v1/analytics/*`) — company-wide,
 * per-department, and per-employee reporting over Kaizen/Evaluation/Implementation/BusinessImpact/
 * Reward/PointsLedger data. Reuses `gamificationService.getLeaderboard` for the employee
 * leaderboard preview rather than re-deriving rankings; every other aggregation here is genuinely
 * new (department-vs-department ranking, review/implementation duration, savings trend) since
 * nothing else in the codebase computes it.
 */
class AnalyticsService {
  async getStatusCounts(where: Prisma.KaizenWhereInput): Promise<StatusCounts> {
    const rows = await prisma.kaizen.groupBy({ by: ["status"], where, _count: { _all: true } });
    const map = new Map(rows.map((row) => [row.status, row._count._all]));
    const total = rows.reduce((sum, row) => sum + row._count._all, 0);

    return {
      total,
      draft: map.get("DRAFT") ?? 0,
      submitted: map.get("SUBMITTED") ?? 0,
      underReview: map.get("UNDER_REVIEW") ?? 0,
      needsChanges: map.get("NEEDS_CHANGES") ?? 0,
      approved: map.get("APPROVED") ?? 0,
      rejected: map.get("REJECTED") ?? 0,
      implementationPending: map.get("IMPLEMENTATION_IN_PROGRESS") ?? 0,
      implementationComplete: map.get("IMPLEMENTATION_COMPLETED") ?? 0,
      businessImpactRecorded: map.get("BUSINESS_IMPACT_RECORDED") ?? 0,
      rewardsIssued: map.get("REWARD_ISSUED") ?? 0,
      archived: map.get("ARCHIVED") ?? 0,
      publishedToKnowledgeBase: map.get("PUBLISHED_TO_KNOWLEDGE_BASE") ?? 0,
    };
  }

  computeApprovalRate(statusCounts: StatusCounts): { approvalRate: number; rejectionRate: number } {
    const approvedSuperset =
      statusCounts.approved +
      statusCounts.implementationPending +
      statusCounts.implementationComplete +
      statusCounts.businessImpactRecorded +
      statusCounts.rewardsIssued +
      statusCounts.archived +
      statusCounts.publishedToKnowledgeBase;
    const decided = approvedSuperset + statusCounts.rejected;
    if (decided === 0) return { approvalRate: 0, rejectionRate: 0 };
    return {
      approvalRate: Math.round((approvedSuperset / decided) * 1000) / 10,
      rejectionRate: Math.round((statusCounts.rejected / decided) * 1000) / 10,
    };
  }

  /** Average hours from `SUBMITTED` to the first `APPROVED`/`REJECTED` timeline event — derived
   * from `timeline_events` (immutable audit trail) rather than a dedicated column, since only
   * `approvedAt` exists on `Kaizen` and rejections have no equivalent column. */
  private async getAvgReviewTimeHours(where: Prisma.KaizenWhereInput): Promise<number | null> {
    const kaizens = await prisma.kaizen.findMany({
      where: { ...where, status: { in: [...APPROVED_SUPERSET_STATUSES, "REJECTED"] } },
      select: { id: true, submittedAt: true },
    });
    if (kaizens.length === 0) return null;

    const decisionEvents = await prisma.timelineEvent.findMany({
      where: { kaizenId: { in: kaizens.map((k) => k.id) }, eventType: { in: ["APPROVED", "REJECTED"] } },
      select: { kaizenId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    const firstDecisionByKaizen = new Map<string, Date>();
    for (const event of decisionEvents) {
      if (!firstDecisionByKaizen.has(event.kaizenId)) firstDecisionByKaizen.set(event.kaizenId, event.createdAt);
    }

    const hours: number[] = [];
    for (const kaizen of kaizens) {
      const decisionAt = firstDecisionByKaizen.get(kaizen.id);
      if (!kaizen.submittedAt || !decisionAt) continue;
      hours.push((decisionAt.getTime() - kaizen.submittedAt.getTime()) / 3_600_000);
    }
    if (hours.length === 0) return null;
    return Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 10) / 10;
  }

  private async getAvgImplementationTimeDays(where: Prisma.KaizenWhereInput): Promise<number | null> {
    const implementations = await prisma.implementation.findMany({
      where: { kaizen: where, startedAt: { not: null }, completedAt: { not: null } },
      select: { startedAt: true, completedAt: true },
    });
    const days = implementations
      .filter((impl): impl is { startedAt: Date; completedAt: Date } => Boolean(impl.startedAt && impl.completedAt))
      .map((impl) => (impl.completedAt.getTime() - impl.startedAt.getTime()) / 86_400_000);
    if (days.length === 0) return null;
    return Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10;
  }

  private async getAvgScore(where: Prisma.KaizenWhereInput): Promise<number | null> {
    const result = await prisma.evaluation.aggregate({
      where: { isSubmitted: true, kaizen: where },
      _avg: { overallRating: true },
    });
    return result._avg.overallRating != null ? Number(result._avg.overallRating) : null;
  }

  private async getAvgBusinessImpact(where: Prisma.KaizenWhereInput): Promise<number | null> {
    const result = await prisma.businessImpact.aggregate({
      where: { kaizen: where },
      _avg: { moneySaved: true },
    });
    return result._avg.moneySaved != null ? Number(result._avg.moneySaved) : null;
  }

  private async getActualSavings(where: Prisma.KaizenWhereInput): Promise<number> {
    const result = await prisma.businessImpact.aggregate({
      where: { kaizen: where },
      _sum: { moneySaved: true },
    });
    return result._sum.moneySaved != null ? Number(result._sum.moneySaved) : 0;
  }

  /** `kaizen_benefits.description` for `benefitType = 'ESTIMATED_SAVINGS'` is free text typed
   * into the wizard (Milestone 4), not a structured number — this can only ever be a count of how
   * many Kaizens recorded one, never a summed amount. See PROJECT_STATUS.md Known Issues. */
  private async getKaizensWithEstimatedSavingsCount(where: Prisma.KaizenWhereInput): Promise<number> {
    return prisma.kaizen.count({
      where: { ...where, benefits: { some: { benefitType: "ESTIMATED_SAVINGS" } } },
    });
  }

  private async getMonthlyKaizenTrend(where: Prisma.KaizenWhereInput): Promise<ChartPoint[]> {
    const kaizens = await prisma.kaizen.findMany({ where, select: { createdAt: true } });
    return bucketSumByMonth(kaizens.map((k) => ({ date: k.createdAt, value: 1 })));
  }

  private async getDepartmentSubmissionsChart(where: Prisma.KaizenWhereInput): Promise<ChartPoint[]> {
    const rows = await prisma.kaizen.groupBy({ by: ["departmentId"], where, _count: { _all: true } });
    if (rows.length === 0) return [];
    const departments = await prisma.department.findMany({
      where: { id: { in: rows.map((r) => r.departmentId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(departments.map((d) => [d.id, d.name]));
    return rows
      .map((row) => ({ label: nameById.get(row.departmentId) ?? "—", value: row._count._all }))
      .sort((a, b) => b.value - a.value);
  }

  private async getSavingsTrendChart(where: Prisma.KaizenWhereInput): Promise<ChartPoint[]> {
    const impacts = await prisma.businessImpact.findMany({
      where: { kaizen: where },
      select: { createdAt: true, moneySaved: true },
    });
    return bucketSumByMonth(
      impacts.map((impact) => ({ date: impact.createdAt, value: Number(impact.moneySaved ?? 0) })),
    );
  }

  private statusDistributionChart(statusCounts: StatusCounts): ChartPoint[] {
    return [
      { label: "Draft", value: statusCounts.draft },
      { label: "Submitted", value: statusCounts.submitted },
      { label: "Under Review", value: statusCounts.underReview },
      { label: "Needs Changes", value: statusCounts.needsChanges },
      { label: "Approved", value: statusCounts.approved },
      { label: "Rejected", value: statusCounts.rejected },
      { label: "Implementation Pending", value: statusCounts.implementationPending },
      { label: "Implementation Complete", value: statusCounts.implementationComplete },
      { label: "Business Impact Recorded", value: statusCounts.businessImpactRecorded },
      { label: "Reward Issued", value: statusCounts.rewardsIssued },
      { label: "Archived", value: statusCounts.archived },
      { label: "Published", value: statusCounts.publishedToKnowledgeBase },
    ].filter((point) => point.value > 0);
  }

  /** Reuses `GamificationService.getLeaderboard` (Milestone 9) rather than re-deriving a parallel
   * "top employees by points" ranking — the same MONTHLY/COMPANY or MONTHLY/DEPARTMENT snapshot
   * the actual `/leaderboard` page shows. */
  private async getTopEmployees(limit: number, departmentId?: string): Promise<LeaderboardPreviewEntry[]> {
    const leaderboard = departmentId
      ? await gamificationService.getLeaderboard("MONTHLY", "DEPARTMENT", departmentId)
      : await gamificationService.getLeaderboard("MONTHLY", "COMPANY");

    return leaderboard.rankings.slice(0, limit).map((entry) => ({
      rank: entry.rank,
      id: entry.userId,
      name: entry.displayName,
      value: entry.totalPoints,
    }));
  }

  private async getLowestParticipation(departmentId: string, limit: number): Promise<LeaderboardPreviewEntry[]> {
    const users = await prisma.user.findMany({
      where: { isActive: true, departmentId },
      select: { id: true, displayName: true, gamification: { select: { ideasSubmitted: true } } },
      orderBy: { gamification: { ideasSubmitted: "asc" } },
      take: limit,
    });
    return users.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.displayName,
      value: user.gamification?.ideasSubmitted ?? 0,
    }));
  }

  /** Departments have no direct points total of their own — ranked by summing their active
   * users' `totalPoints`, the same underlying figure the company-wide employee leaderboard uses. */
  private async getTopDepartments(limit: number): Promise<LeaderboardPreviewEntry[]> {
    const users = await prisma.user.findMany({
      where: { isActive: true, departmentId: { not: null } },
      select: {
        departmentId: true,
        department: { select: { name: true } },
        gamification: { select: { totalPoints: true } },
      },
    });

    const totals = new Map<string, { name: string; points: number }>();
    for (const user of users) {
      if (!user.departmentId) continue;
      const existing = totals.get(user.departmentId) ?? { name: user.department?.name ?? "—", points: 0 };
      existing.points += user.gamification?.totalPoints ?? 0;
      totals.set(user.departmentId, existing);
    }

    return [...totals.entries()]
      .map(([id, value]) => ({ id, name: value.name, value: value.points }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
      .map((entry, index) => ({ rank: index + 1, ...entry }));
  }

  /** GET /api/v1/analytics/overview — HR, CMD, Super Admin. */
  async getOverview(range: DateRangeQuerySchema): Promise<AnalyticsOverview> {
    const kaizenWhere = buildDateWhere(range, "createdAt");

    const [
      statusCounts,
      avgReviewTimeHours,
      avgImplementationTimeDays,
      avgScore,
      avgBusinessImpact,
      kaizensWithEstimatedSavings,
      actualSavings,
      totalRewardPoints,
      activeEmployees,
      activeDepartmentsCount,
      distinctSubmitterCount,
      distinctDepartmentCount,
      monthlyKaizens,
      departmentSubmissions,
      savingsTrend,
      topEmployeesPreview,
      topDepartments,
    ] = await Promise.all([
      this.getStatusCounts(kaizenWhere),
      this.getAvgReviewTimeHours(kaizenWhere),
      this.getAvgImplementationTimeDays(kaizenWhere),
      this.getAvgScore(kaizenWhere),
      this.getAvgBusinessImpact(kaizenWhere),
      this.getKaizensWithEstimatedSavingsCount(kaizenWhere),
      this.getActualSavings(kaizenWhere),
      prisma.reward.aggregate({ where: { kaizen: kaizenWhere }, _sum: { points: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.department.count({ where: { isActive: true } }),
      prisma.kaizen.findMany({ where: kaizenWhere, distinct: ["submitterId"], select: { submitterId: true } }),
      prisma.kaizen.findMany({ where: kaizenWhere, distinct: ["departmentId"], select: { departmentId: true } }),
      this.getMonthlyKaizenTrend(kaizenWhere),
      this.getDepartmentSubmissionsChart(kaizenWhere),
      this.getSavingsTrendChart(kaizenWhere),
      this.getTopEmployees(5),
      this.getTopDepartments(5),
    ]);

    const { approvalRate, rejectionRate } = this.computeApprovalRate(statusCounts);

    const performance: PerformanceMetrics = {
      approvalRate,
      rejectionRate,
      avgReviewTimeHours,
      avgImplementationTimeDays,
      avgScore,
      avgBusinessImpact,
    };

    const charts: AnalyticsCharts = {
      monthlyKaizens,
      departmentSubmissions,
      statusDistribution: this.statusDistributionChart(statusCounts),
      savingsTrend,
    };

    return {
      statusCounts,
      performance,
      business: {
        kaizensWithEstimatedSavings,
        actualSavings,
        totalRewardPoints: totalRewardPoints._sum.points ?? 0,
        employeeParticipationPercent:
          activeEmployees > 0 ? Math.round((distinctSubmitterCount.length / activeEmployees) * 1000) / 10 : 0,
        activeEmployees,
        departmentParticipationPercent:
          activeDepartmentsCount > 0
            ? Math.round((distinctDepartmentCount.length / activeDepartmentsCount) * 1000) / 10
            : 0,
      },
      charts,
      topEmployees: topEmployeesPreview,
      topDepartments,
    };
  }

  /** GET /api/v1/analytics/departments — Dept Manager (own dept), HR, CMD, Super Admin. */
  async getDepartmentAnalytics(
    requester: Requester,
    query: DepartmentAnalyticsQuerySchema,
  ): Promise<DepartmentAnalyticsItem[]> {
    let departmentIds: string[];
    if (requester.role === "DEPARTMENT_MANAGER") {
      if (!requester.departmentId) return [];
      departmentIds = [requester.departmentId];
    } else if (query.departmentId) {
      departmentIds = [query.departmentId];
    } else {
      const departments = await prisma.department.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      departmentIds = departments.map((d) => d.id);
    }

    return Promise.all(departmentIds.map((id) => this.getSingleDepartmentAnalytics(id, query)));
  }

  private async getSingleDepartmentAnalytics(
    departmentId: string,
    range: DateRangeQuerySchema,
  ): Promise<DepartmentAnalyticsItem> {
    const department = await prisma.department.findUniqueOrThrow({
      where: { id: departmentId },
      select: { id: true, name: true },
    });

    const kaizenWhere: Prisma.KaizenWhereInput = { departmentId, ...buildDateWhere(range, "createdAt") };

    const [
      statusCounts,
      avgScore,
      avgImplementationTimeDays,
      kaizensWithEstimatedSavings,
      actualSavings,
      topEmployees,
      lowestParticipation,
      monthlyTrend,
    ] = await Promise.all([
      this.getStatusCounts(kaizenWhere),
      this.getAvgScore(kaizenWhere),
      this.getAvgImplementationTimeDays(kaizenWhere),
      this.getKaizensWithEstimatedSavingsCount(kaizenWhere),
      this.getActualSavings(kaizenWhere),
      this.getTopEmployees(5, departmentId),
      this.getLowestParticipation(departmentId, 5),
      this.getMonthlyKaizenTrend(kaizenWhere),
    ]);

    const { approvalRate } = this.computeApprovalRate(statusCounts);

    return {
      departmentId: department.id,
      departmentName: department.name,
      statusCounts,
      approvalRate,
      avgScore,
      avgImplementationTimeDays,
      pendingReviews: statusCounts.submitted + statusCounts.underReview,
      pendingImplementations: statusCounts.implementationPending,
      kaizensWithEstimatedSavings,
      actualSavings,
      topEmployees,
      lowestParticipation,
      monthlyTrend,
    };
  }

  /** GET /api/v1/analytics/employees — HR, CMD, Super Admin. Company-wide leaderboard-style list,
   * reusing the same points-ranked shape as the overview's preview but not limited to 5. */
  async getEmployeesAnalytics(limit = 50): Promise<LeaderboardPreviewEntry[]> {
    return this.getTopEmployees(limit);
  }

  /** GET /api/v1/analytics/kaizens — "Scoped by role": Employee sees only their own Kaizens,
   * Department Manager their department's, HR/CMD/Super Admin everything — matches every other
   * scoped list endpoint's established RBAC shape in this codebase (e.g. `ReviewService.getQueue`). */
  async getKaizenAnalytics(requester: Requester): Promise<KaizenAnalytics> {
    const where = this.scopeForRequester(requester);
    const [statusCounts, avgScore, avgTimeToApprovalHours] = await Promise.all([
      this.getStatusCounts(where),
      this.getAvgScore(where),
      this.getAvgReviewTimeHours(where),
    ]);
    return { statusCounts, avgScore, avgTimeToApprovalHours };
  }

  private scopeForRequester(requester: Requester): Prisma.KaizenWhereInput {
    if (COMPANY_WIDE_ROLES.includes(requester.role)) return {};
    if (requester.role === "DEPARTMENT_MANAGER") {
      return requester.departmentId ? { departmentId: requester.departmentId } : { id: "" };
    }
    return { submitterId: requester.id };
  }

  /** GET /api/v1/analytics/trends — HR, CMD, Super Admin. */
  async getTrends(query: TrendsQuerySchema): Promise<TrendPoint[]> {
    const range =
      query.dateFrom || query.dateTo
        ? { from: query.dateFrom ?? defaultTrendRange(query.granularity).from, to: query.dateTo ?? new Date() }
        : defaultTrendRange(query.granularity);

    const isDate = (value: Date | null): value is Date => value !== null;

    let dates: Date[];
    if (query.metric === "submissions") {
      const rows = await prisma.kaizen.findMany({
        where: { submittedAt: { gte: range.from, lte: range.to } },
        select: { submittedAt: true },
      });
      dates = rows.map((row) => row.submittedAt).filter(isDate);
    } else if (query.metric === "approvals") {
      const rows = await prisma.kaizen.findMany({
        where: { approvedAt: { gte: range.from, lte: range.to } },
        select: { approvedAt: true },
      });
      dates = rows.map((row) => row.approvedAt).filter(isDate);
    } else {
      const rows = await prisma.implementation.findMany({
        where: { completedAt: { gte: range.from, lte: range.to } },
        select: { completedAt: true },
      });
      dates = rows.map((row) => row.completedAt).filter(isDate);
    }

    const buckets = new Map<string, number>();
    for (const date of dates) {
      const key = bucketKey(date, query.granularity);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([bucket, value]) => ({ bucket, value }));
  }

  /** GET /api/v1/analytics/personal — Required (self only, per the API spec). */
  async getPersonalAnalytics(userId: string): Promise<EmployeeAnalytics> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { displayName: true, gamification: true },
    });

    const kaizenWhere: Prisma.KaizenWhereInput = { submitterId: userId };

    const [
      statusCounts,
      avgScore,
      achievementsCount,
      rewardsTotal,
      kaizensWithEstimatedSavings,
      actualBusinessImpact,
      monthlyActivity,
      scoreTrend,
      pointsTrend,
    ] = await Promise.all([
      this.getStatusCounts(kaizenWhere),
      this.getAvgScore(kaizenWhere),
      prisma.userAchievement.count({ where: { userId } }),
      prisma.reward.aggregate({ where: { userId }, _sum: { points: true } }),
      this.getKaizensWithEstimatedSavingsCount(kaizenWhere),
      this.getActualSavings(kaizenWhere),
      this.getMonthlyKaizenTrend(kaizenWhere),
      this.getScoreTrend(userId),
      this.getPointsTrend(userId),
    ]);

    const { approvalRate } = this.computeApprovalRate(statusCounts);

    return {
      userId,
      displayName: user.displayName,
      ideasSubmitted: user.gamification?.ideasSubmitted ?? statusCounts.total,
      ideasApproved: user.gamification?.ideasApproved ?? 0,
      ideasRejected: statusCounts.rejected,
      approvalRate,
      avgScore,
      points: user.gamification?.totalPoints ?? 0,
      achievementsCount,
      rewardsTotal: rewardsTotal._sum.points ?? 0,
      kaizensWithEstimatedSavings,
      actualBusinessImpact,
      monthlyActivity,
      scoreTrend,
      pointsTrend,
    };
  }

  private async getScoreTrend(userId: string): Promise<ChartPoint[]> {
    const evaluations = await prisma.evaluation.findMany({
      where: { isSubmitted: true, kaizen: { submitterId: userId } },
      select: { overallRating: true, submittedAt: true },
    });
    const rows = evaluations
      .filter((evaluation): evaluation is typeof evaluation & { submittedAt: Date } =>
        Boolean(evaluation.submittedAt),
      )
      .map((evaluation) => ({ date: evaluation.submittedAt, value: Number(evaluation.overallRating) }));
    return bucketAvgByMonth(rows);
  }

  private async getPointsTrend(userId: string): Promise<ChartPoint[]> {
    const ledger = await prisma.pointsLedger.findMany({
      where: { userId },
      select: { amount: true, createdAt: true },
    });
    return bucketSumByMonth(ledger.map((entry) => ({ date: entry.createdAt, value: entry.amount })));
  }
}

export const analyticsService = new AnalyticsService();
