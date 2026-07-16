"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, FileEdit, HardHat, PauseCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { StatusTone } from "@/components/v2/status-badge";
import { ROUTES } from "@/constants/routes";
import { useAnalyticsOverview, useDepartmentAnalytics } from "@/features/analytics/hooks/use-analytics";
import type { CurrentUser } from "@/features/auth/types/user";
import { useImplementationList } from "@/features/implementation/hooks/use-implementation-list";
import { useKaizenList } from "@/features/kaizen/hooks/use-kaizen-list";
import { canReview, canViewCompanyAnalytics } from "@/lib/permissions";

export interface AttentionItem {
  key: string;
  icon: LucideIcon;
  tone: StatusTone;
  count: number;
  title: string;
  href: string;
  ctaLabel: string;
  meta?: string;
}

/** Q1 ("what requires my attention today?") for both `GreetingHeader`'s subtitle and
 * `FocusSection`, computed once so the two don't run two independently-drifting copies of the same
 * rules. This is the exact data source and severity thresholds `components/dashboard/mission-critical.tsx`
 * already computes — reused via the same hooks, not a new query — just carrying narrative copy
 * instead of a bare label, and a `tone` instead of a bar color, for the V2 primitives to render. */
export function useAttentionItems(user: CurrentUser) {
  const isCompanyWide = canViewCompanyAnalytics(user.role);
  const isReviewer = canReview(user.role);

  const overviewQuery = useAnalyticsOverview({}, isCompanyWide);
  const departmentsQuery = useDepartmentAnalytics(isCompanyWide ? undefined : user.department?.id, isReviewer);

  const overdueQuery = useImplementationList({
    kaizenStatus: "IMPLEMENTATION_IN_PROGRESS",
    pageSize: 100,
    departmentId: isCompanyWide ? undefined : user.department?.id,
  });

  const myNeedsChanges = useKaizenList({ status: "NEEDS_CHANGES", pageSize: 1 });
  const myDrafts = useKaizenList({ status: "DRAFT", pageSize: 1 });
  const mySubmitted = useKaizenList({ status: "SUBMITTED", pageSize: 1 });
  const myUnderReview = useKaizenList({ status: "UNDER_REVIEW", pageSize: 1 });

  // Same SSR-safe "snapshot once" pattern as `mission-critical.tsx` — an "overdue as of page load"
  // boundary doesn't need to tick forward live.
  const [now] = useState(() => Date.now());
  const overdueCount =
    overdueQuery.data?.items.filter((item) => item.dueDate && new Date(item.dueDate).getTime() < now).length ?? 0;

  const isLoading = isReviewer
    ? isCompanyWide
      ? overviewQuery.isLoading || !overviewQuery.data
      : departmentsQuery.isLoading || !departmentsQuery.data
    : myNeedsChanges.isLoading || myDrafts.isLoading || mySubmitted.isLoading || myUnderReview.isLoading;

  const items: AttentionItem[] = [];

  if (isReviewer) {
    if (isCompanyWide && overviewQuery.data) {
      const data = overviewQuery.data;
      const pending = data.statusCounts.submitted + data.statusCounts.underReview;
      items.push({
        key: "pending-reviews",
        icon: Clock3,
        tone: pending === 0 ? "success" : pending > 15 ? "critical" : "warning",
        count: pending,
        title: `${pending} ${pending === 1 ? "idea is" : "ideas are"} waiting for your review`,
        href: ROUTES.REVIEW,
        ctaLabel: "Open Review Queue",
      });
      items.push({
        key: "needs-changes",
        icon: FileEdit,
        tone: data.statusCounts.needsChanges === 0 ? "success" : "info",
        count: data.statusCounts.needsChanges,
        title: `${data.statusCounts.needsChanges} ${data.statusCounts.needsChanges === 1 ? "idea needs" : "ideas need"} changes from their submitters`,
        href: ROUTES.REVIEW,
        ctaLabel: "View in Review Queue",
      });
      const lowPerforming = (departmentsQuery.data ?? []).filter((dept) => dept.approvalRate < 50).length;
      items.push({
        key: "low-performing-departments",
        icon: AlertTriangle,
        tone: lowPerforming === 0 ? "success" : "critical",
        count: lowPerforming,
        title: `${lowPerforming} ${lowPerforming === 1 ? "department has" : "departments have"} an approval rate below 50%`,
        href: ROUTES.ANALYTICS,
        ctaLabel: "Open Analytics",
      });
    } else if (departmentsQuery.data?.[0]) {
      const dept = departmentsQuery.data[0];
      items.push({
        key: "pending-reviews",
        icon: Clock3,
        tone: dept.pendingReviews === 0 ? "success" : dept.pendingReviews > 10 ? "critical" : "warning",
        count: dept.pendingReviews,
        title: `${dept.pendingReviews} ${dept.pendingReviews === 1 ? "idea is" : "ideas are"} waiting for your review`,
        href: ROUTES.REVIEW,
        ctaLabel: "Open Review Queue",
      });
      items.push({
        key: "needs-changes",
        icon: FileEdit,
        tone: dept.statusCounts.needsChanges === 0 ? "success" : "info",
        count: dept.statusCounts.needsChanges,
        title: `${dept.statusCounts.needsChanges} ${dept.statusCounts.needsChanges === 1 ? "idea needs" : "ideas need"} changes from their submitters`,
        href: ROUTES.REVIEW,
        ctaLabel: "View in Review Queue",
      });
      items.push({
        key: "pending-implementations",
        icon: PauseCircle,
        tone: dept.pendingImplementations === 0 ? "success" : "warning",
        count: dept.pendingImplementations,
        title: `${dept.pendingImplementations} approved ${dept.pendingImplementations === 1 ? "idea is" : "ideas are"} waiting to start implementation`,
        href: ROUTES.IMPLEMENTATION,
        ctaLabel: "Open Implementation",
      });
    }

    items.push({
      key: "overdue-implementations",
      icon: HardHat,
      tone: overdueCount === 0 ? "success" : "critical",
      count: overdueCount,
      title: `${overdueCount} ${overdueCount === 1 ? "implementation is" : "implementations are"} overdue`,
      href: ROUTES.IMPLEMENTATION,
      ctaLabel: "Open Implementation",
      meta:
        overdueQuery.data && overdueQuery.data.meta.total > overdueQuery.data.items.length
          ? "Among the 100 most recently started"
          : undefined,
    });
  } else {
    const needsChangesCount = myNeedsChanges.data?.meta.total ?? 0;
    items.push({
      key: "my-needs-changes",
      icon: FileEdit,
      tone: needsChangesCount === 0 ? "success" : "warning",
      count: needsChangesCount,
      title: `${needsChangesCount} of your ideas ${needsChangesCount === 1 ? "needs" : "need"} changes before you can resubmit`,
      href: `${ROUTES.MY_IDEAS}?status=NEEDS_CHANGES`,
      ctaLabel: "Review Feedback",
    });

    const waitingCount = (mySubmitted.data?.meta.total ?? 0) + (myUnderReview.data?.meta.total ?? 0);
    items.push({
      key: "my-waiting",
      icon: Clock3,
      tone: "info",
      count: waitingCount,
      title: `${waitingCount} of your ideas ${waitingCount === 1 ? "is" : "are"} awaiting review`,
      href: `${ROUTES.MY_IDEAS}?status=SUBMITTED`,
      ctaLabel: "View My Ideas",
    });

    const draftsCount = myDrafts.data?.meta.total ?? 0;
    items.push({
      key: "my-drafts",
      icon: CheckCircle2,
      tone: draftsCount === 0 ? "success" : "info",
      count: draftsCount,
      title: `${draftsCount} unfinished ${draftsCount === 1 ? "draft is" : "drafts are"} ready to submit`,
      href: `${ROUTES.MY_IDEAS}?status=DRAFT`,
      ctaLabel: "Continue Draft",
    });
  }

  return { items, isLoading };
}
