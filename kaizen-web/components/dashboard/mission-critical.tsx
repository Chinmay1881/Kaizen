"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, FileEdit, HardHat, PauseCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { ROUTES } from "@/constants/routes";
import { useAnalyticsOverview, useDepartmentAnalytics } from "@/features/analytics/hooks/use-analytics";
import type { CurrentUser } from "@/features/auth/types/user";
import { useImplementationList } from "@/features/implementation/hooks/use-implementation-list";
import { useKaizenList } from "@/features/kaizen/hooks/use-kaizen-list";
import { canReview, canViewCompanyAnalytics } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/format";

interface MissionCriticalProps {
  user: CurrentUser;
}

type Severity = "clear" | "info" | "warning" | "critical";

const SEVERITY_STYLE: Record<Severity, { bar: string; icon: string }> = {
  clear: { bar: "bg-success", icon: "bg-success/15 text-success" },
  info: { bar: "bg-info", icon: "bg-info/15 text-info" },
  warning: { bar: "bg-warning", icon: "bg-warning/20 text-warning-foreground" },
  critical: { bar: "bg-destructive", icon: "bg-destructive/15 text-destructive" },
};

interface AttentionItem {
  key: string;
  label: string;
  count: number;
  icon: LucideIcon;
  severity: Severity;
  href: string;
  hint?: string;
}

function AttentionTile({ item }: { item: AttentionItem }) {
  const style = SEVERITY_STYLE[item.severity];

  return (
    <Link
      href={item.href}
      className="interactive-lift group relative flex items-center gap-3 overflow-hidden rounded-xl border bg-card p-4"
    >
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", style.bar)} />
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", style.icon)}>
        <item.icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p data-metric className="text-xl font-semibold tracking-tight">
          {formatNumber(item.count)}
        </p>
        <p className="text-muted-foreground truncate text-xs font-medium">{item.label}</p>
      </div>
    </Link>
  );
}

/** Everything a reviewer/executive needs to act on right now, prioritized and color-coded. Every
 * number here is a real, currently-computable aggregate — nothing like "rejected today" made the
 * cut, since the API has no rejection timestamp separate from `updatedAt`, and filtering by
 * `createdAt` would misrepresent which Kaizens were actually rejected today. */
export function MissionCritical({ user }: MissionCriticalProps) {
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

  // Snapshotted once via a lazy initializer rather than read directly in the render body — an
  // "overdue as of when this page loaded" boundary is what the tile is for; it doesn't need to
  // tick forward live.
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
        label: "Pending Reviews",
        count: pending,
        icon: Clock3,
        severity: pending === 0 ? "clear" : pending > 15 ? "critical" : "warning",
        href: ROUTES.REVIEW,
      });
      items.push({
        key: "needs-changes",
        label: "Awaiting Submitter Changes",
        count: data.statusCounts.needsChanges,
        icon: FileEdit,
        severity: data.statusCounts.needsChanges === 0 ? "clear" : "info",
        href: ROUTES.REVIEW,
      });
      const lowPerforming = (departmentsQuery.data ?? []).filter((dept) => dept.approvalRate < 50).length;
      items.push({
        key: "low-performing-departments",
        label: "Departments Needing Attention",
        count: lowPerforming,
        icon: AlertTriangle,
        severity: lowPerforming === 0 ? "clear" : "critical",
        href: ROUTES.ANALYTICS,
      });
    } else if (departmentsQuery.data?.[0]) {
      const dept = departmentsQuery.data[0];
      items.push({
        key: "pending-reviews",
        label: "Pending Reviews",
        count: dept.pendingReviews,
        icon: Clock3,
        severity: dept.pendingReviews === 0 ? "clear" : dept.pendingReviews > 10 ? "critical" : "warning",
        href: ROUTES.REVIEW,
      });
      items.push({
        key: "needs-changes",
        label: "Awaiting Submitter Changes",
        count: dept.statusCounts.needsChanges,
        icon: FileEdit,
        severity: dept.statusCounts.needsChanges === 0 ? "clear" : "info",
        href: ROUTES.REVIEW,
      });
      items.push({
        key: "pending-implementations",
        label: "Pending Implementation",
        count: dept.pendingImplementations,
        icon: PauseCircle,
        severity: dept.pendingImplementations === 0 ? "clear" : "warning",
        href: ROUTES.IMPLEMENTATION,
      });
    }

    items.push({
      key: "overdue-implementations",
      label: "Overdue Implementations",
      count: overdueCount,
      icon: HardHat,
      severity: overdueCount === 0 ? "clear" : "critical",
      href: ROUTES.IMPLEMENTATION,
      hint: overdueQuery.data && overdueQuery.data.meta.total > overdueQuery.data.items.length ? "among most recent 100" : undefined,
    });
  } else {
    items.push({
      key: "my-needs-changes",
      label: "Ideas Needing Your Changes",
      count: myNeedsChanges.data?.meta.total ?? 0,
      icon: FileEdit,
      severity: (myNeedsChanges.data?.meta.total ?? 0) === 0 ? "clear" : "warning",
      href: `${ROUTES.MY_IDEAS}?status=NEEDS_CHANGES`,
    });
    items.push({
      key: "my-waiting",
      label: "Ideas Awaiting Review",
      count: (mySubmitted.data?.meta.total ?? 0) + (myUnderReview.data?.meta.total ?? 0),
      icon: Clock3,
      severity: "info",
      href: `${ROUTES.MY_IDEAS}?status=SUBMITTED`,
    });
    items.push({
      key: "my-drafts",
      label: "Unfinished Drafts",
      count: myDrafts.data?.meta.total ?? 0,
      icon: CheckCircle2,
      severity: (myDrafts.data?.meta.total ?? 0) === 0 ? "clear" : "info",
      href: `${ROUTES.MY_IDEAS}?status=DRAFT`,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Mission Critical" description="What needs your attention right now" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? [...Array(4)].map((_, index) => <LoadingSkeleton key={index} className="h-[68px] w-full rounded-xl" />)
          : items.map((item) => <AttentionTile key={item.key} item={item} />)}
      </div>
    </div>
  );
}
