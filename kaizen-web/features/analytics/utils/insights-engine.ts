import type { AnalyticsOverview, DepartmentAnalyticsItem } from "@/features/analytics/types/analytics";
import { percentChange } from "@/features/analytics/utils/compare-period";

export interface Insight {
  id: string;
  tone: "positive" | "negative" | "neutral" | "warning";
  text: string;
}

/**
 * Deterministic, rule-based observations from data already fetched elsewhere on this page — no
 * AI, no backend call of its own. Every rule is guarded so it only fires when the underlying
 * numbers actually support the claim (e.g. a comparison insight never appears without real
 * previous-period data to compare against); nothing here interpolates or guesses.
 */
export function buildInsights(overview: AnalyticsOverview | undefined, previousOverview: AnalyticsOverview | undefined, departments: DepartmentAnalyticsItem[]): Insight[] {
  const insights: Insight[] = [];
  if (!overview) return insights;

  if (previousOverview) {
    const approvalDelta = percentChange(overview.performance.approvalRate, previousOverview.performance.approvalRate);
    if (approvalDelta !== null && approvalDelta !== 0) {
      insights.push({
        id: "approval-delta",
        tone: approvalDelta > 0 ? "positive" : "negative",
        text: `Approval rate ${approvalDelta > 0 ? "increased" : "decreased"} ${Math.abs(approvalDelta)}% vs. the previous period.`,
      });
    }

    const savingsDelta = percentChange(overview.business.actualSavings, previousOverview.business.actualSavings);
    if (savingsDelta !== null && savingsDelta !== 0) {
      insights.push({
        id: "savings-delta",
        tone: savingsDelta > 0 ? "positive" : "negative",
        text: `Business impact ${savingsDelta > 0 ? "improved" : "declined"} ${Math.abs(savingsDelta)}% vs. the previous period.`,
      });
    }

    const implementedDelta = percentChange(overview.statusCounts.implementationComplete, previousOverview.statusCounts.implementationComplete);
    if (implementedDelta !== null && implementedDelta < 0) {
      insights.push({ id: "implementation-slowdown", tone: "warning", text: `Implementation completions slowed ${Math.abs(implementedDelta)}% vs. the previous period.` });
    }
  }

  if (departments.length > 0) {
    const topSubmitter = [...departments].sort((a, b) => b.statusCounts.total - a.statusCounts.total)[0];
    if (topSubmitter && topSubmitter.statusCounts.total > 0) {
      insights.push({ id: "top-submitter", tone: "neutral", text: `${topSubmitter.departmentName} submitted the most ideas (${topSubmitter.statusCounts.total}).` });
    }

    const topApprover = [...departments].sort((a, b) => b.approvalRate - a.approvalRate)[0];
    if (topApprover) {
      insights.push({ id: "top-approver", tone: "positive", text: `${topApprover.departmentName} has the highest approval rate (${topApprover.approvalRate}%).` });
    }

    const strugglingDepartments = departments.filter((dept) => dept.approvalRate < 50 && dept.statusCounts.total > 0);
    if (strugglingDepartments.length > 0) {
      insights.push({
        id: "low-approval-departments",
        tone: "warning",
        text: `${strugglingDepartments.length} department${strugglingDepartments.length > 1 ? "s have" : " has"} an approval rate below 50%.`,
      });
    }

    const backlogged = departments.filter((dept) => dept.pendingReviews >= 5);
    if (backlogged.length > 0) {
      insights.push({ id: "review-backlog", tone: "warning", text: `${backlogged.length} department${backlogged.length > 1 ? "s have" : " has"} 5 or more Kaizens waiting for review.` });
    }
  }

  const implTotal = overview.statusCounts.implementationPending + overview.statusCounts.implementationComplete;
  if (implTotal > 0) {
    const completionRate = Math.round((overview.statusCounts.implementationComplete / implTotal) * 100);
    insights.push({ id: "completion-rate", tone: completionRate >= 60 ? "positive" : "neutral", text: `${completionRate}% of started implementations have been completed.` });
  }

  const pendingReview = overview.statusCounts.submitted + overview.statusCounts.underReview;
  if (pendingReview > 0) {
    insights.push({ id: "pending-review", tone: pendingReview > 15 ? "warning" : "neutral", text: `${pendingReview} Kaizen${pendingReview > 1 ? "s are" : " is"} currently waiting for review company-wide.` });
  }

  return insights;
}
