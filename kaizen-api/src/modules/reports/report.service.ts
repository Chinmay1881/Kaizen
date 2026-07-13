import type { KaizenStatus, Prisma, ReportType } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { buildPaginationMeta, getSkipTake } from "../../utils/pagination.js";
import { analyticsService } from "../analytics/analytics.service.js";
import { auditService } from "../audit/audit.service.js";
import type { AnalyticsOverview, StatusCounts } from "../analytics/analytics.types.js";
import { gamificationService } from "../gamification/gamification.service.js";
import type { GenerateReportSchema, ReportHistoryQuerySchema } from "./report.schema.js";
import type { ComparisonMetric, KpiCard, ReportChart, ReportResult, ReportHistoryItem } from "./report.types.js";
import type { UserRole } from "../../constants/roles.js";

interface Requester {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

const COMPANY_WIDE_ROLES: UserRole[] = ["HR", "CMD", "SUPER_ADMIN"];

/** Statuses at or past IMPLEMENTATION_COMPLETED in the Kaizen lifecycle — see `buildImplementationReport`. */
const IMPLEMENTATION_COMPLETE_OR_LATER: KaizenStatus[] = [
  "IMPLEMENTATION_COMPLETED",
  "BUSINESS_IMPACT_RECORDED",
  "REWARD_ISSUED",
  "ARCHIVED",
  "PUBLISHED_TO_KNOWLEDGE_BASE",
];

function fmtHours(value: number | null): string {
  return value != null ? `${value}h` : "—";
}
function fmtDays(value: number | null): string {
  return value != null ? `${value}d` : "—";
}
function fmtScore(value: number | null): string {
  return value != null ? value.toFixed(1) : "—";
}
function fmtMoney(value: number | null): string {
  return value != null ? `₹${Math.round(value).toLocaleString("en-IN")}` : "—";
}

function metric(label: string, current: number, previous: number): ComparisonMetric {
  const difference = current - previous;
  const percentChange = previous === 0 ? null : Math.round((difference / previous) * 1000) / 10;
  return { label, currentValue: current, previousValue: previous, difference, percentChange };
}

/** Part 8 — Comparison. Returns the [start, end) window for `period`, `offset` windows back
 * (0 = current, 1 = previous). */
function periodRange(period: "MONTH" | "QUARTER" | "YEAR", offset: number): { from: Date; to: Date } {
  const now = new Date();
  if (period === "MONTH") {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - offset, 1),
      to: new Date(now.getFullYear(), now.getMonth() - offset + 1, 1),
    };
  }
  if (period === "QUARTER") {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const totalQuarters = now.getFullYear() * 4 + currentQuarter - offset;
    const year = Math.floor(totalQuarters / 4);
    const quarter = ((totalQuarters % 4) + 4) % 4;
    return { from: new Date(year, quarter * 3, 1), to: new Date(year, quarter * 3 + 3, 1) };
  }
  return { from: new Date(now.getFullYear() - offset, 0, 1), to: new Date(now.getFullYear() - offset + 1, 0, 1) };
}

const PERIOD_LABEL: Record<string, string> = {
  MONTH: "Month over Month",
  QUARTER: "Quarter over Quarter",
  YEAR: "Year over Year",
};

/** Backs the Enterprise Reporting Engine (Milestone 11 Chunk 3A). Every report type is built by
 * composing `AnalyticsService`/`GamificationService`'s already-verified aggregations (Chunk 1;
 * Milestone 9) rather than re-querying the same data a second way — the only genuinely new
 * aggregations here are ones nothing else in the codebase computes yet (reviewer workload,
 * overdue implementations, improvement-type breakdown, reward distribution by department). */
class ReportService {
  /** `detailRowLimit` defaults to the live Preview's own 100-row cap; the Export Engine (Chunk
   * 3B) passes a much larger cap for CSV/Excel so a single call serves both the report data and
   * the export's own history/audit bookkeeping — no second, duplicate aggregation query per
   * export (Part 14's "no duplicate queries"). */
  async generateReport(
    requester: Requester,
    input: GenerateReportSchema,
    detailRowLimit = 100,
  ): Promise<ReportResult> {
    this.assertCanGenerate(requester, input.reportType);

    const start = Date.now();
    const result = await this.buildReport(requester, input, detailRowLimit);
    const durationMs = Date.now() - start;

    const generation = await prisma.reportGeneration.create({
      data: {
        userId: requester.id,
        reportType: input.reportType,
        filters: input as unknown as Prisma.InputJsonValue,
        durationMs,
      },
    });

    // Part 12 (Chunk 3B) — "Report generated" must be audited. Additive: this call site already
    // exists (Chunk 3A); only the one `auditService.record` line is new.
    await auditService.record({
      userId: requester.id,
      userRole: requester.role,
      action: "report.generated",
      entityType: "ReportGeneration",
      entityId: generation.id,
      newValue: { reportType: input.reportType },
    });

    return result;
  }

  /** Public delegate to `assertCanGenerate` — lets the Schedule/Template modules (Chunk 3B)
   * validate a `reportType` up front (e.g. rejecting a Department Manager's attempt to schedule
   * an Executive Summary) without duplicating this rule a second time. */
  assertCanGenerateReportType(requester: Requester, reportType: ReportType): void {
    this.assertCanGenerate(requester, reportType);
  }

  /** "Department Manager: Only Department reports" (Part 12) — read literally: a Department
   * Manager may only generate the DEPARTMENT report type (always auto-scoped to their own
   * department by `buildKaizenWhere`/`AnalyticsService.getDepartmentAnalytics`), not every other
   * report type filtered down to their department. */
  private assertCanGenerate(requester: Requester, reportType: ReportType): void {
    if (requester.role === "EMPLOYEE") {
      throw new ApiError("FORBIDDEN", "Employees cannot access Reports.", 403);
    }
    if (requester.role === "DEPARTMENT_MANAGER" && reportType !== "DEPARTMENT") {
      throw new ApiError(
        "FORBIDDEN",
        "Department Managers can only generate the Department report.",
        403,
      );
    }
  }

  /** `detailRowLimit` (default 100, matching the live Preview's cap) lets `generateReport`'s own
   * caller (the Export Engine, Chunk 3B) ask for the same report with a much larger detail-table
   * cap — reusing every per-report-type builder and its own already-correct `where` clause
   * verbatim, rather than re-deriving each report type's filter logic a second time in the export
   * module. */
  private async buildReport(
    requester: Requester,
    input: GenerateReportSchema,
    detailRowLimit = 100,
  ): Promise<ReportResult> {
    switch (input.reportType) {
      case "EXECUTIVE_SUMMARY":
        return this.buildOverviewStyleReport(requester, input, "Executive Summary", detailRowLimit);
      case "MONTHLY":
        return this.buildMonthlyReport(requester, input, detailRowLimit);
      case "DEPARTMENT":
        return this.buildDepartmentReport(requester, input, detailRowLimit);
      case "EMPLOYEE_PERFORMANCE":
        return this.buildEmployeePerformanceReport(requester, input);
      case "KAIZEN_PERFORMANCE":
        return this.buildKaizenPerformanceReport(requester, input, detailRowLimit);
      case "REVIEW_PERFORMANCE":
        return this.buildReviewPerformanceReport(requester, input, detailRowLimit);
      case "IMPLEMENTATION":
        return this.buildImplementationReport(requester, input, detailRowLimit);
      case "BUSINESS_IMPACT":
        return this.buildBusinessImpactReport(requester, input, detailRowLimit);
      case "REWARD":
        return this.buildRewardReport(requester, input);
      case "LEADERBOARD":
        return this.buildLeaderboardReport(requester, input);
    }
  }

  // ---------------------------------------------------------------------
  // Shared building blocks
  // ---------------------------------------------------------------------

  /** Mirrors Chunk 2's filter vocabulary exactly (`dateFrom`/`dateTo`, `departmentId`,
   * `categoryId`, `priority`, `status`, `submitterId`/`employeeId`, `assignedReviewerId`/
   * `reviewerId`, `assignedOwnerId`/`implementationOwnerId`) rather than a second filter shape —
   * "No duplicate filtering code" (Part 9). Not extracted into a shared cross-module utility since
   * doing so would mean editing `review.service.ts`/`kaizen.service.ts` (already-completed,
   * working modules) purely for this new module's benefit. */
  private buildKaizenWhere(requester: Requester, filters: GenerateReportSchema): Prisma.KaizenWhereInput {
    const conditions: Prisma.KaizenWhereInput[] = [analyticsService.scopeForRequester(requester)];

    if (requester.role === "DEPARTMENT_MANAGER" && requester.departmentId) {
      conditions.push({ departmentId: requester.departmentId });
    } else if (filters.departmentId) {
      conditions.push({ departmentId: filters.departmentId });
    }
    if (filters.categoryId) conditions.push({ categoryId: filters.categoryId });
    if (filters.priority) conditions.push({ priority: filters.priority });
    if (filters.status) conditions.push({ status: filters.status as never });
    if (filters.employeeId) conditions.push({ submitterId: filters.employeeId });
    if (filters.reviewerId) conditions.push({ assignedReviewerId: filters.reviewerId });
    if (filters.implementationOwnerId) conditions.push({ assignedOwnerId: filters.implementationOwnerId });
    if (filters.rewardStatus === "ISSUED") conditions.push({ status: "REWARD_ISSUED" });
    if (filters.rewardStatus === "NOT_ISSUED") conditions.push({ status: { not: "REWARD_ISSUED" } });
    if (filters.businessImpactStatus === "RECORDED") conditions.push({ businessImpact: { isNot: null } });
    if (filters.businessImpactStatus === "NOT_RECORDED") conditions.push({ businessImpact: null });
    if (filters.dateFrom || filters.dateTo) {
      conditions.push({
        createdAt: {
          ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
          ...(filters.dateTo ? { lte: filters.dateTo } : {}),
        },
      });
    }

    return { AND: conditions };
  }

  private kpisFromStatusCounts(
    statusCounts: StatusCounts,
    avgReviewTimeHours: number | null,
    avgScore: number | null,
    avgSavings: number | null,
    extra: Array<[string, string]>,
  ): KpiCard[] {
    return [
      { label: "Total Kaizens", value: String(statusCounts.total) },
      { label: "Approved", value: String(statusCounts.approved) },
      { label: "Rejected", value: String(statusCounts.rejected) },
      { label: "Implementation Complete", value: String(statusCounts.implementationComplete) },
      { label: "Avg Review Time", value: fmtHours(avgReviewTimeHours) },
      { label: "Avg Score", value: fmtScore(avgScore) },
      { label: "Avg Savings", value: fmtMoney(avgSavings) },
      ...extra.map(([label, value]) => ({ label, value })),
    ];
  }

  private statusDistributionChart(statusCounts: StatusCounts): ReportChart {
    return {
      title: "Status Distribution",
      type: "pie",
      data: [
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
      ].filter((point) => point.value > 0),
    };
  }

  private async kaizenDetailTable(where: Prisma.KaizenWhereInput, take = 100) {
    const rows = await prisma.kaizen.findMany({
      where,
      select: {
        kaizenNumber: true,
        title: true,
        status: true,
        priority: true,
        department: { select: { name: true } },
        submitter: { select: { displayName: true } },
        createdAt: true,
        evaluations: { where: { isSubmitted: true }, select: { overallRating: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take,
    });
    return {
      columns: [
        { key: "kaizenNumber", label: "Kaizen #" },
        { key: "title", label: "Title" },
        { key: "department", label: "Department" },
        { key: "submitter", label: "Submitter" },
        { key: "status", label: "Status" },
        { key: "priority", label: "Priority" },
        { key: "score", label: "Score" },
        { key: "createdAt", label: "Created" },
      ],
      rows: rows.map((row) => ({
        kaizenNumber: row.kaizenNumber,
        title: row.title,
        department: row.department.name,
        submitter: row.submitter.displayName,
        status: row.status,
        priority: row.priority,
        score: row.evaluations[0] ? Number(row.evaluations[0].overallRating) : "—",
        createdAt: row.createdAt.toISOString().slice(0, 10),
      })),
    };
  }

  private generateRecommendations(
    statusCounts: StatusCounts,
    approvalRate: number,
    avgReviewTimeHours: number | null,
    comparison: { periodLabel: string; metrics: ComparisonMetric[] } | null,
  ): string[] {
    const recommendations: string[] = [];

    if (statusCounts.total > 0 && approvalRate > 0 && approvalRate < 40) {
      recommendations.push(
        `Approval rate is ${approvalRate}%, below the 40% baseline — review criteria may need clarification or additional reviewer guidance.`,
      );
    }
    if (statusCounts.implementationPending >= 3 && statusCounts.implementationPending > statusCounts.implementationComplete * 1.5) {
      recommendations.push(
        `${statusCounts.implementationPending} implementations are pending against ${statusCounts.implementationComplete} completed — implementation capacity may be a bottleneck (high implementation backlog).`,
      );
    }
    if (avgReviewTimeHours != null && avgReviewTimeHours > 72) {
      recommendations.push(
        `Average review time is ${Math.round(avgReviewTimeHours)}h (over 3 days) — consider redistributing reviewer workload.`,
      );
    }
    if (comparison) {
      const participation = comparison.metrics.find((m) => m.label === "Total Kaizens");
      if (participation && participation.percentChange !== null && participation.percentChange < -15) {
        recommendations.push(
          `Submission volume declined ${Math.abs(participation.percentChange)}% versus the comparison period — participation may be declining.`,
        );
      }
    }
    if (recommendations.length === 0) {
      recommendations.push("No significant issues detected in this period based on the available data.");
    }
    return recommendations;
  }

  private async buildComparison(
    requester: Requester,
    filters: GenerateReportSchema,
  ): Promise<{ periodLabel: string; metrics: ComparisonMetric[] } | null> {
    if (!filters.comparisonPeriod || filters.comparisonPeriod === "NONE") return null;

    const baseConditions = this.buildKaizenWhere(requester, { ...filters, dateFrom: undefined, dateTo: undefined });
    const current = periodRange(filters.comparisonPeriod, 0);
    const previous = periodRange(filters.comparisonPeriod, 1);

    const [currentCounts, previousCounts] = await Promise.all([
      analyticsService.getStatusCounts({
        AND: [baseConditions, { createdAt: { gte: current.from, lt: current.to } }],
      }),
      analyticsService.getStatusCounts({
        AND: [baseConditions, { createdAt: { gte: previous.from, lt: previous.to } }],
      }),
    ]);

    return {
      periodLabel: PERIOD_LABEL[filters.comparisonPeriod] ?? filters.comparisonPeriod,
      metrics: [
        metric("Total Kaizens", currentCounts.total, previousCounts.total),
        metric("Approved", currentCounts.approved, previousCounts.approved),
        metric("Rejected", currentCounts.rejected, previousCounts.rejected),
        metric("Implementation Complete", currentCounts.implementationComplete, previousCounts.implementationComplete),
      ],
    };
  }

  // ---------------------------------------------------------------------
  // Report builders
  // ---------------------------------------------------------------------

  /** Executive Summary — company-wide (HR/CMD/Super Admin only, enforced by the route). */
  private async buildOverviewStyleReport(
    requester: Requester,
    input: GenerateReportSchema,
    title: string,
    detailRowLimit: number,
  ): Promise<ReportResult> {
    const [overview, comparison] = await Promise.all([
      analyticsService.getOverview({ dateFrom: input.dateFrom, dateTo: input.dateTo }),
      this.buildComparison(requester, input),
    ]);
    return this.fromOverview(input, title, overview, comparison, detailRowLimit);
  }

  private async fromOverview(
    input: GenerateReportSchema,
    title: string,
    overview: AnalyticsOverview,
    comparison: { periodLabel: string; metrics: ComparisonMetric[] } | null,
    detailRowLimit: number,
  ): Promise<ReportResult> {
    const where = this.buildKaizenWhere({ id: "", role: "SUPER_ADMIN", departmentId: null }, input);
    const table = await this.kaizenDetailTable(where, detailRowLimit);
    const { approvalRate } = analyticsService.computeApprovalRate(overview.statusCounts);

    return {
      reportType: input.reportType,
      title,
      generatedAt: new Date().toISOString(),
      dateFrom: input.dateFrom?.toISOString() ?? null,
      dateTo: input.dateTo?.toISOString() ?? null,
      kpis: this.kpisFromStatusCounts(
        overview.statusCounts,
        overview.performance.avgReviewTimeHours,
        overview.performance.avgScore,
        overview.performance.avgBusinessImpact,
        [
          ["Top Department", overview.topDepartments[0]?.name ?? "—"],
          ["Top Employee", overview.topEmployees[0]?.name ?? "—"],
          ["Participation %", `${overview.business.employeeParticipationPercent}%`],
        ],
      ),
      charts: [
        { title: "Monthly Kaizens", type: "line", data: overview.charts.monthlyKaizens },
        { title: "Department Submissions", type: "bar", data: overview.charts.departmentSubmissions },
        this.statusDistributionChart(overview.statusCounts),
        { title: "Savings Trend", type: "area", data: overview.charts.savingsTrend },
      ],
      table,
      summary: [
        `${overview.statusCounts.total} Kaizens total, ${overview.statusCounts.approved} approved and ${overview.statusCounts.rejected} rejected.`,
        `${overview.statusCounts.implementationComplete} implementations completed; ${overview.statusCounts.implementationPending} in progress.`,
        `${overview.business.activeEmployees} active employees, ${overview.business.employeeParticipationPercent}% have submitted at least one Kaizen.`,
      ],
      recommendations: this.generateRecommendations(
        overview.statusCounts,
        approvalRate,
        overview.performance.avgReviewTimeHours,
        comparison,
      ),
      comparison,
    };
  }

  /** Monthly Report — same shape as Executive Summary, scoped to the current calendar month
   * (or the given `dateFrom`/`dateTo` if provided) with month-over-month comparison forced on. */
  private async buildMonthlyReport(
    requester: Requester,
    input: GenerateReportSchema,
    detailRowLimit: number,
  ): Promise<ReportResult> {
    const now = new Date();
    const monthInput: GenerateReportSchema = {
      ...input,
      dateFrom: input.dateFrom ?? new Date(now.getFullYear(), now.getMonth(), 1),
      dateTo: input.dateTo ?? new Date(now.getFullYear(), now.getMonth() + 1, 1),
      comparisonPeriod: "MONTH",
    };
    const [overview, comparison] = await Promise.all([
      analyticsService.getOverview({ dateFrom: monthInput.dateFrom, dateTo: monthInput.dateTo }),
      this.buildComparison(requester, monthInput),
    ]);
    return this.fromOverview(monthInput, "Monthly Report", overview, comparison, detailRowLimit);
  }

  /** Department Report — Department Manager is always forced to their own department by
   * `AnalyticsService.getDepartmentAnalytics`'s own existing RBAC (Chunk 1); HR/CMD/Super Admin
   * may pick one via `departmentId`, or omit it to get every department. */
  private async buildDepartmentReport(
    requester: Requester,
    input: GenerateReportSchema,
    detailRowLimit: number,
  ): Promise<ReportResult> {
    const departments = await analyticsService.getDepartmentAnalytics(requester, {
      departmentId: input.departmentId,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    });
    const comparison = await this.buildComparison(requester, input);

    const combined = departments.reduce<StatusCounts>(
      (sum, dept) => ({
        total: sum.total + dept.statusCounts.total,
        draft: sum.draft + dept.statusCounts.draft,
        submitted: sum.submitted + dept.statusCounts.submitted,
        underReview: sum.underReview + dept.statusCounts.underReview,
        needsChanges: sum.needsChanges + dept.statusCounts.needsChanges,
        approved: sum.approved + dept.statusCounts.approved,
        rejected: sum.rejected + dept.statusCounts.rejected,
        implementationPending: sum.implementationPending + dept.statusCounts.implementationPending,
        implementationComplete: sum.implementationComplete + dept.statusCounts.implementationComplete,
        businessImpactRecorded: sum.businessImpactRecorded + dept.statusCounts.businessImpactRecorded,
        rewardsIssued: sum.rewardsIssued + dept.statusCounts.rewardsIssued,
        archived: sum.archived + dept.statusCounts.archived,
        publishedToKnowledgeBase: sum.publishedToKnowledgeBase + dept.statusCounts.publishedToKnowledgeBase,
      }),
      {
        total: 0, draft: 0, submitted: 0, underReview: 0, needsChanges: 0, approved: 0, rejected: 0,
        implementationPending: 0, implementationComplete: 0, businessImpactRecorded: 0, rewardsIssued: 0,
        archived: 0, publishedToKnowledgeBase: 0,
      },
    );
    const { approvalRate } = analyticsService.computeApprovalRate(combined);
    const avgReviewTimes = departments.map((d) => d.avgReviewTimeHours).filter((v): v is number => v != null);
    const avgScores = departments.map((d) => d.avgScore).filter((v): v is number => v != null);

    const where = this.buildKaizenWhere(requester, input);
    const table = await this.kaizenDetailTable(where, detailRowLimit);

    return {
      reportType: "DEPARTMENT",
      title: departments.length === 1 && departments[0] ? `Department Report — ${departments[0].departmentName}` : "Department Report",
      generatedAt: new Date().toISOString(),
      dateFrom: input.dateFrom?.toISOString() ?? null,
      dateTo: input.dateTo?.toISOString() ?? null,
      kpis: this.kpisFromStatusCounts(
        combined,
        avgReviewTimes.length > 0 ? Math.round((avgReviewTimes.reduce((a, b) => a + b, 0) / avgReviewTimes.length) * 10) / 10 : null,
        avgScores.length > 0 ? Math.round((avgScores.reduce((a, b) => a + b, 0) / avgScores.length) * 10) / 10 : null,
        departments.length > 0 ? departments.reduce((sum, d) => sum + d.actualSavings, 0) / departments.length : null,
        [
          ["Departments", String(departments.length)],
          ["Top Employee", departments[0]?.topEmployees[0]?.name ?? "—"],
          ["Approval Rate", `${approvalRate}%`],
        ],
      ),
      charts: [
        {
          title: "Submissions by Department",
          type: "bar",
          data: departments.map((d) => ({ label: d.departmentName, value: d.statusCounts.total })),
        },
        {
          title: "Actual Savings by Department",
          type: "bar",
          data: departments.map((d) => ({ label: d.departmentName, value: d.actualSavings })),
        },
        this.statusDistributionChart(combined),
      ],
      table,
      summary: departments.map(
        (d) =>
          `${d.departmentName}: ${d.statusCounts.total} Kaizens, ${d.approvalRate}% approval rate, ${fmtMoney(d.actualSavings)} in recorded savings.`,
      ),
      recommendations: this.generateRecommendations(combined, approvalRate, avgReviewTimes[0] ?? null, comparison),
      comparison,
    };
  }

  /** Employee Performance Report — a specific `employeeId` gets `AnalyticsService.getPersonalAnalytics`
   * (reused directly, bypassing the self-only HTTP route since this module has its own broader
   * RBAC); no `employeeId` gets the department's/company's ranked employee list. */
  private async buildEmployeePerformanceReport(
    requester: Requester,
    input: GenerateReportSchema,
  ): Promise<ReportResult> {
    if (input.employeeId) {
      await this.assertCanViewEmployee(requester, input.employeeId);
      const employee = await analyticsService.getPersonalAnalytics(input.employeeId);
      const { approvalRate } = { approvalRate: employee.approvalRate };

      return {
        reportType: "EMPLOYEE_PERFORMANCE",
        title: `Employee Performance — ${employee.displayName}`,
        generatedAt: new Date().toISOString(),
        dateFrom: input.dateFrom?.toISOString() ?? null,
        dateTo: input.dateTo?.toISOString() ?? null,
        kpis: [
          { label: "Ideas Submitted", value: String(employee.ideasSubmitted) },
          { label: "Ideas Approved", value: String(employee.ideasApproved) },
          { label: "Ideas Rejected", value: String(employee.ideasRejected) },
          { label: "Approval Rate", value: `${employee.approvalRate}%` },
          { label: "Avg Score", value: fmtScore(employee.avgScore) },
          { label: "Points", value: String(employee.points) },
          { label: "Achievements", value: String(employee.achievementsCount) },
          { label: "Rewards", value: String(employee.rewardsTotal) },
          { label: "Business Impact", value: fmtMoney(employee.actualBusinessImpact) },
        ],
        charts: [
          { title: "Monthly Activity", type: "line", data: employee.monthlyActivity },
          { title: "Score Trend", type: "line", data: employee.scoreTrend },
          { title: "Points Trend", type: "area", data: employee.pointsTrend },
        ],
        table: { columns: [], rows: [] },
        summary: [
          `${employee.displayName} submitted ${employee.ideasSubmitted} Kaizens with a ${approvalRate}% approval rate.`,
          `${employee.achievementsCount} achievements unlocked, ${employee.points} total points.`,
        ],
        recommendations:
          employee.ideasSubmitted > 0 && employee.approvalRate < 40
            ? [`${employee.displayName}'s approval rate is ${employee.approvalRate}%, below the 40% baseline.`]
            : ["No significant issues detected in this period based on the available data."],
        comparison: null,
      };
    }

    const departmentScopedId = requester.role === "DEPARTMENT_MANAGER" ? requester.departmentId : input.departmentId;
    const employees = departmentScopedId
      ? (await analyticsService.getDepartmentAnalytics(requester, { departmentId: departmentScopedId })).flatMap(
          (d) => d.topEmployees,
        )
      : await analyticsService.getEmployeesAnalytics(50);

    return {
      reportType: "EMPLOYEE_PERFORMANCE",
      title: "Employee Performance Report",
      generatedAt: new Date().toISOString(),
      dateFrom: input.dateFrom?.toISOString() ?? null,
      dateTo: input.dateTo?.toISOString() ?? null,
      kpis: [
        { label: "Employees Ranked", value: String(employees.length) },
        { label: "Top Employee", value: employees[0]?.name ?? "—" },
        { label: "Top Points", value: employees[0] ? String(employees[0].value) : "—" },
      ],
      charts: [{ title: "Points by Employee", type: "bar", data: employees.map((e) => ({ label: e.name, value: e.value })) }],
      table: {
        columns: [
          { key: "rank", label: "Rank" },
          { key: "name", label: "Employee" },
          { key: "points", label: "Points" },
        ],
        rows: employees.map((e) => ({ rank: e.rank, name: e.name, points: e.value })),
      },
      summary: [`${employees.length} employees ranked by points this month.`],
      recommendations: ["No significant issues detected in this period based on the available data."],
      comparison: null,
    };
  }

  private async assertCanViewEmployee(requester: Requester, employeeId: string): Promise<void> {
    if (COMPANY_WIDE_ROLES.includes(requester.role)) return;
    if (requester.role === "DEPARTMENT_MANAGER") {
      const target = await prisma.user.findUnique({ where: { id: employeeId }, select: { departmentId: true } });
      if (target?.departmentId && target.departmentId === requester.departmentId) return;
    }
    throw new ApiError("FORBIDDEN", "You cannot view this employee's performance.", 403);
  }

  /** Kaizen Performance Report — reuses `AnalyticsService.getKaizenAnalytics` (already role-scoped)
   * for the KPI/chart summary, plus a filtered detail table built from the same filter engine
   * every other report type uses. */
  private async buildKaizenPerformanceReport(
    requester: Requester,
    input: GenerateReportSchema,
    detailRowLimit: number,
  ): Promise<ReportResult> {
    const where = this.buildKaizenWhere(requester, input);
    const [statusCounts, avgScore, avgReviewTimeHours, table] = await Promise.all([
      analyticsService.getStatusCounts(where),
      analyticsService.getAvgScore(where),
      analyticsService.getAvgReviewTimeHours(where),
      this.kaizenDetailTable(where, detailRowLimit),
    ]);
    const { approvalRate } = analyticsService.computeApprovalRate(statusCounts);
    const comparison = await this.buildComparison(requester, input);

    return {
      reportType: "KAIZEN_PERFORMANCE",
      title: "Kaizen Performance Report",
      generatedAt: new Date().toISOString(),
      dateFrom: input.dateFrom?.toISOString() ?? null,
      dateTo: input.dateTo?.toISOString() ?? null,
      kpis: this.kpisFromStatusCounts(statusCounts, avgReviewTimeHours, avgScore, null, [
        ["Approval Rate", `${approvalRate}%`],
      ]),
      charts: [this.statusDistributionChart(statusCounts), { title: "Kaizens by Priority", type: "donut", data: await this.priorityBreakdown(where) }],
      table,
      summary: [`${statusCounts.total} Kaizens matched the selected filters, ${approvalRate}% approval rate.`],
      recommendations: this.generateRecommendations(statusCounts, approvalRate, avgReviewTimeHours, comparison),
      comparison,
    };
  }

  private async priorityBreakdown(where: Prisma.KaizenWhereInput) {
    const rows = await prisma.kaizen.groupBy({ by: ["priority"], where, _count: { _all: true } });
    return rows.map((row) => ({ label: row.priority, value: row._count._all }));
  }

  /** Review Performance Report — reviewer workload (Ideas per Reviewer) is genuinely new
   * aggregation; everything else reuses `AnalyticsService`. */
  private async buildReviewPerformanceReport(
    requester: Requester,
    input: GenerateReportSchema,
    detailRowLimit: number,
  ): Promise<ReportResult> {
    const where = this.buildKaizenWhere(requester, input);
    const reviewedWhere: Prisma.KaizenWhereInput = { AND: [where, { assignedReviewerId: { not: null } }] };

    const [statusCounts, avgReviewTimeHours, avgScore, reviewerRows] = await Promise.all([
      analyticsService.getStatusCounts(where),
      analyticsService.getAvgReviewTimeHours(where),
      analyticsService.getAvgScore(where),
      prisma.kaizen.groupBy({ by: ["assignedReviewerId"], where: reviewedWhere, _count: { _all: true } }),
    ]);

    const reviewers = await prisma.user.findMany({
      where: { id: { in: reviewerRows.map((r) => r.assignedReviewerId).filter((id): id is string => Boolean(id)) } },
      select: { id: true, displayName: true },
    });
    const reviewerNameById = new Map(reviewers.map((r) => [r.id, r.displayName]));
    const workload = reviewerRows
      .filter((row): row is typeof row & { assignedReviewerId: string } => Boolean(row.assignedReviewerId))
      .map((row) => ({ label: reviewerNameById.get(row.assignedReviewerId) ?? "—", value: row._count._all }))
      .sort((a, b) => b.value - a.value);

    const { approvalRate } = analyticsService.computeApprovalRate(statusCounts);
    const pendingReviews = statusCounts.submitted + statusCounts.underReview;
    const completionRate =
      statusCounts.total > 0 ? Math.round(((statusCounts.total - pendingReviews) / statusCounts.total) * 1000) / 10 : 0;
    const comparison = await this.buildComparison(requester, input);
    const table = await this.kaizenDetailTable({ AND: [where, { status: { not: "DRAFT" } }] }, detailRowLimit);

    return {
      reportType: "REVIEW_PERFORMANCE",
      title: "Review Performance Report",
      generatedAt: new Date().toISOString(),
      dateFrom: input.dateFrom?.toISOString() ?? null,
      dateTo: input.dateTo?.toISOString() ?? null,
      kpis: [
        { label: "Pending Reviews", value: String(pendingReviews) },
        { label: "Avg Review Time", value: fmtHours(avgReviewTimeHours) },
        { label: "Reviewers", value: String(workload.length) },
        { label: "Ideas per Reviewer (Top)", value: workload[0] ? String(workload[0].value) : "—" },
        { label: "Review Completion Rate", value: `${completionRate}%` },
        { label: "Avg Review Score", value: fmtScore(avgScore) },
        { label: "Approval Rate", value: `${approvalRate}%` },
      ],
      charts: [
        { title: "Ideas per Reviewer", type: "bar", data: workload },
        this.statusDistributionChart(statusCounts),
      ],
      table,
      summary: [
        `${pendingReviews} Kaizens awaiting review, ${completionRate}% review completion rate.`,
        `${workload.length} active reviewers this period.`,
      ],
      recommendations: this.generateRecommendations(statusCounts, approvalRate, avgReviewTimeHours, comparison),
      comparison,
    };
  }

  /** Implementation Report — "Overdue" = still IMPLEMENTATION_IN_PROGRESS past its due date;
   * "Department Workload" reuses the same groupBy shape as Analytics' department-submissions
   * chart, scoped to implementations instead of raw Kaizens.
   *
   * Unlike the generic `kpisFromStatusCounts` KPIs reused elsewhere (which intentionally read
   * `Kaizen.status` as a live pipeline-stage snapshot, matching the already-shipped Analytics
   * Dashboard), this report's own subject is "did the implementation get completed" — a Kaizen
   * that has since moved on to BUSINESS_IMPACT_RECORDED/REWARD_ISSUED/ARCHIVED/PUBLISHED did
   * complete its implementation and must still count here, so completion is measured against
   * IMPLEMENTATION_COMPLETE_OR_LATER rather than the exact current status. */
  private async buildImplementationReport(
    requester: Requester,
    input: GenerateReportSchema,
    detailRowLimit: number,
  ): Promise<ReportResult> {
    const where = this.buildKaizenWhere(requester, input);
    const [statusCounts, completedCount, avgImplementationTimeDays, overdueCount, departmentWorkloadRows] = await Promise.all([
      analyticsService.getStatusCounts(where),
      prisma.kaizen.count({ where: { AND: [where, { status: { in: IMPLEMENTATION_COMPLETE_OR_LATER } }] } }),
      analyticsService.getAvgImplementationTimeDays(where),
      prisma.kaizen.count({
        where: { AND: [where, { status: "IMPLEMENTATION_IN_PROGRESS", implementationDueDate: { lt: new Date() } }] },
      }),
      prisma.implementation.groupBy({ by: ["assignedDepartmentId"], where: { kaizen: where }, _count: { _all: true } }),
    ]);

    const departments = await prisma.department.findMany({
      where: { id: { in: departmentWorkloadRows.map((r) => r.assignedDepartmentId) } },
      select: { id: true, name: true },
    });
    const deptNameById = new Map(departments.map((d) => [d.id, d.name]));
    const departmentWorkload = departmentWorkloadRows
      .map((row) => ({ label: deptNameById.get(row.assignedDepartmentId) ?? "—", value: row._count._all }))
      .sort((a, b) => b.value - a.value);

    const successRate =
      completedCount + statusCounts.implementationPending > 0
        ? Math.round((completedCount / (completedCount + statusCounts.implementationPending)) * 1000) / 10
        : 0;
    const comparison = await this.buildComparison(requester, input);
    const table = await this.kaizenDetailTable(
      { AND: [where, { status: { in: ["IMPLEMENTATION_IN_PROGRESS", ...IMPLEMENTATION_COMPLETE_OR_LATER] } }] },
      detailRowLimit,
    );

    return {
      reportType: "IMPLEMENTATION",
      title: "Implementation Report",
      generatedAt: new Date().toISOString(),
      dateFrom: input.dateFrom?.toISOString() ?? null,
      dateTo: input.dateTo?.toISOString() ?? null,
      kpis: [
        { label: "Ideas Assigned", value: String(statusCounts.implementationPending + completedCount) },
        { label: "In Progress", value: String(statusCounts.implementationPending) },
        { label: "Completed", value: String(completedCount) },
        { label: "Overdue", value: String(overdueCount) },
        { label: "Avg Completion Time", value: fmtDays(avgImplementationTimeDays) },
        { label: "Success Rate", value: `${successRate}%` },
        { label: "Departments Involved", value: String(departmentWorkload.length) },
      ],
      charts: [{ title: "Department Workload", type: "bar", data: departmentWorkload }],
      table,
      summary: [
        `${completedCount} implementations completed, ${statusCounts.implementationPending} in progress, ${overdueCount} overdue.`,
      ],
      recommendations: this.generateRecommendations(statusCounts, 0, null, comparison).filter(
        (r) => !r.includes("Approval rate"),
      ).concat(
        overdueCount > 0
          ? [`${overdueCount} implementation(s) are past their due date and still in progress.`]
          : [],
      ),
      comparison,
    };
  }

  /** Business Impact Report — improvement-type breakdown is genuinely new aggregation (nothing
   * else counts these flags); savings figures reuse `AnalyticsService`. */
  private async buildBusinessImpactReport(
    requester: Requester,
    input: GenerateReportSchema,
    detailRowLimit: number,
  ): Promise<ReportResult> {
    const where = this.buildKaizenWhere(requester, input);
    const [actualSavings, avgBusinessImpact, impacts] = await Promise.all([
      analyticsService.getActualSavings(where),
      analyticsService.getAvgBusinessImpact(where),
      prisma.businessImpact.findMany({
        where: { kaizen: where },
        select: {
          hoursSaved: true,
          employeesBenefited: true,
          customersBenefited: true,
          processImprovement: true,
          qualityImprovement: true,
          safetyImprovement: true,
          productivityImprovement: true,
          customerSatisfactionImprovement: true,
        },
      }),
    ]);

    const totals = impacts.reduce(
      (sum, impact) => ({
        hoursSaved: sum.hoursSaved + Number(impact.hoursSaved ?? 0),
        employeesBenefited: sum.employeesBenefited + (impact.employeesBenefited ?? 0),
        customersBenefited: sum.customersBenefited + (impact.customersBenefited ?? 0),
        process: sum.process + (impact.processImprovement ? 1 : 0),
        quality: sum.quality + (impact.qualityImprovement ? 1 : 0),
        safety: sum.safety + (impact.safetyImprovement ? 1 : 0),
        productivity: sum.productivity + (impact.productivityImprovement ? 1 : 0),
        customerSatisfaction: sum.customerSatisfaction + (impact.customerSatisfactionImprovement ? 1 : 0),
      }),
      { hoursSaved: 0, employeesBenefited: 0, customersBenefited: 0, process: 0, quality: 0, safety: 0, productivity: 0, customerSatisfaction: 0 },
    );

    const comparison = await this.buildComparison(requester, input);
    const table = await this.kaizenDetailTable({ AND: [where, { businessImpact: { isNot: null } }] }, detailRowLimit);

    return {
      reportType: "BUSINESS_IMPACT",
      title: "Business Impact Report",
      generatedAt: new Date().toISOString(),
      dateFrom: input.dateFrom?.toISOString() ?? null,
      dateTo: input.dateTo?.toISOString() ?? null,
      kpis: [
        { label: "Business Impacts Recorded", value: String(impacts.length) },
        { label: "Total Money Saved", value: fmtMoney(actualSavings) },
        { label: "Avg Money Saved", value: fmtMoney(avgBusinessImpact) },
        { label: "Total Hours Saved", value: String(Math.round(totals.hoursSaved)) },
        { label: "Employees Benefited", value: String(totals.employeesBenefited) },
        { label: "Customers Benefited", value: String(totals.customersBenefited) },
      ],
      charts: [
        {
          title: "Improvement Types",
          type: "donut",
          data: [
            { label: "Process", value: totals.process },
            { label: "Quality", value: totals.quality },
            { label: "Safety", value: totals.safety },
            { label: "Productivity", value: totals.productivity },
            { label: "Customer Satisfaction", value: totals.customerSatisfaction },
          ].filter((point) => point.value > 0),
        },
        { title: "Savings Trend", type: "area", data: (await analyticsService.getSavingsTrendChart(where)) },
      ],
      table,
      summary: [
        `${impacts.length} Kaizens have recorded business impact, totalling ${fmtMoney(actualSavings)} and ${Math.round(totals.hoursSaved)} hours saved.`,
      ],
      recommendations:
        impacts.length === 0
          ? ["No business impact has been recorded for the selected filters yet."]
          : ["No significant issues detected in this period based on the available data."],
      comparison,
    };
  }

  /** Reward Report — points/achievements/rewards distribution, reusing `GamificationService`'s
   * leaderboard for "Top Performers" rather than re-deriving a ranking. */
  private async buildRewardReport(requester: Requester, input: GenerateReportSchema): Promise<ReportResult> {
    const where = this.buildKaizenWhere(requester, input);
    const [rewardAgg, pointsAgg, achievementsCount, leaderboard, rewards] = await Promise.all([
      prisma.reward.aggregate({ where: { kaizen: where }, _sum: { points: true }, _count: { _all: true } }),
      prisma.pointsLedger.aggregate({ where: { kaizen: where }, _sum: { amount: true } }),
      prisma.userAchievement.count({ where: { user: { submittedKaizens: { some: where } } } }),
      gamificationService.getLeaderboard(
        "MONTHLY",
        requester.role === "DEPARTMENT_MANAGER" && requester.departmentId ? "DEPARTMENT" : "COMPANY",
        requester.role === "DEPARTMENT_MANAGER" ? (requester.departmentId ?? undefined) : undefined,
      ),
      prisma.reward.findMany({
        where: { kaizen: where },
        select: {
          points: true,
          reason: true,
          createdAt: true,
          user: { select: { displayName: true } },
          kaizen: { select: { kaizenNumber: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    const comparison = await this.buildComparison(requester, input);

    return {
      reportType: "REWARD",
      title: "Reward Report",
      generatedAt: new Date().toISOString(),
      dateFrom: input.dateFrom?.toISOString() ?? null,
      dateTo: input.dateTo?.toISOString() ?? null,
      kpis: [
        { label: "Rewards Issued", value: String(rewardAgg._count._all) },
        { label: "Points Distributed (Rewards)", value: String(rewardAgg._sum.points ?? 0) },
        { label: "Total Points Ledger", value: String(pointsAgg._sum.amount ?? 0) },
        { label: "Achievements Awarded", value: String(achievementsCount) },
        { label: "Top Performer", value: leaderboard.rankings[0]?.displayName ?? "—" },
      ],
      charts: [
        {
          title: "Top Performers (Points)",
          type: "bar",
          data: leaderboard.rankings.slice(0, 10).map((r) => ({ label: r.displayName, value: r.totalPoints })),
        },
      ],
      table: {
        columns: [
          { key: "kaizenNumber", label: "Kaizen #" },
          { key: "title", label: "Title" },
          { key: "recipient", label: "Recipient" },
          { key: "points", label: "Points" },
          { key: "createdAt", label: "Issued" },
        ],
        rows: rewards.map((r) => ({
          kaizenNumber: r.kaizen.kaizenNumber,
          title: r.kaizen.title,
          recipient: r.user.displayName,
          points: r.points,
          createdAt: r.createdAt.toISOString().slice(0, 10),
        })),
      },
      summary: [`${rewardAgg._count._all} rewards issued totalling ${rewardAgg._sum.points ?? 0} points.`],
      recommendations: ["No significant issues detected in this period based on the available data."],
      comparison,
    };
  }

  /** Leaderboard Report — a formatted snapshot of `GamificationService.getLeaderboard` across all
   * 4 periods for the requester's scope, not a re-derived ranking. */
  private async buildLeaderboardReport(requester: Requester, input: GenerateReportSchema): Promise<ReportResult> {
    const scope = requester.role === "DEPARTMENT_MANAGER" ? "DEPARTMENT" : input.departmentId ? "DEPARTMENT" : "COMPANY";
    const departmentId = requester.role === "DEPARTMENT_MANAGER" ? (requester.departmentId ?? undefined) : input.departmentId;

    const [monthly, quarterly, yearly, allTime] = await Promise.all([
      gamificationService.getLeaderboard("MONTHLY", scope, departmentId),
      gamificationService.getLeaderboard("QUARTERLY", scope, departmentId),
      gamificationService.getLeaderboard("YEARLY", scope, departmentId),
      gamificationService.getLeaderboard("ALL_TIME", scope, departmentId),
    ]);

    return {
      reportType: "LEADERBOARD",
      title: "Leaderboard Report",
      generatedAt: new Date().toISOString(),
      dateFrom: input.dateFrom?.toISOString() ?? null,
      dateTo: input.dateTo?.toISOString() ?? null,
      kpis: [
        { label: "#1 This Month", value: monthly.rankings[0]?.displayName ?? "—" },
        { label: "#1 This Quarter", value: quarterly.rankings[0]?.displayName ?? "—" },
        { label: "#1 This Year", value: yearly.rankings[0]?.displayName ?? "—" },
        { label: "#1 All Time", value: allTime.rankings[0]?.displayName ?? "—" },
        { label: "Ranked Participants", value: String(allTime.rankings.length) },
      ],
      charts: [
        { title: "Monthly Leaderboard", type: "bar", data: monthly.rankings.slice(0, 10).map((r) => ({ label: r.displayName, value: r.totalPoints })) },
        { title: "All-Time Leaderboard", type: "bar", data: allTime.rankings.slice(0, 10).map((r) => ({ label: r.displayName, value: r.totalPoints })) },
      ],
      table: {
        columns: [
          { key: "rank", label: "Rank" },
          { key: "name", label: "Employee" },
          { key: "department", label: "Department" },
          { key: "points", label: "Points" },
          { key: "achievements", label: "Achievements" },
        ],
        rows: allTime.rankings.map((r) => ({
          rank: r.rank,
          name: r.displayName,
          department: r.departmentName ?? "—",
          points: r.totalPoints,
          achievements: r.achievementCount,
        })),
      },
      summary: [`${allTime.rankings.length} employees ranked, led by ${allTime.rankings[0]?.displayName ?? "no one yet"}.`],
      recommendations: ["No significant issues detected in this period based on the available data."],
      comparison: null,
    };
  }

  // ---------------------------------------------------------------------
  // History (Part 10)
  // ---------------------------------------------------------------------

  async getHistory(requester: Requester, query: ReportHistoryQuerySchema) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
    const { skip, take } = getSkipTake({ page, pageSize });

    const where: Prisma.ReportGenerationWhereInput = requester.role === "SUPER_ADMIN" ? {} : { userId: requester.id };

    const [rows, total] = await Promise.all([
      prisma.reportGeneration.findMany({
        where,
        include: { user: { select: { id: true, displayName: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.reportGeneration.count({ where }),
    ]);

    const items: ReportHistoryItem[] = rows.map((row) => ({
      id: row.id,
      reportType: row.reportType,
      filters: (row.filters as Record<string, unknown>) ?? {},
      durationMs: row.durationMs,
      generatedBy: row.user,
      createdAt: row.createdAt.toISOString(),
    }));

    return { items, meta: buildPaginationMeta({ page, pageSize }, total) };
  }
}

export const reportService = new ReportService();
