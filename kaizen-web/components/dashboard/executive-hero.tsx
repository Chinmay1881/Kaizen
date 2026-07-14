"use client";

import { useState } from "react";
import Link from "next/link";
import { HardHat, IndianRupee, Medal, Sparkles, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { ROLE_LABELS } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { useAnalyticsOverview, useDepartmentAnalytics, usePersonalAnalytics } from "@/features/analytics/hooks/use-analytics";
import type { StatusCounts } from "@/features/analytics/types/analytics";
import type { CurrentUser } from "@/features/auth/types/user";
import { canReview, canViewCompanyAnalytics } from "@/lib/permissions";
import { useCountUp } from "@/hooks/use-count-up";
import { formatCurrency, formatNumber } from "@/utils/format";

interface ExecutiveHeroProps {
  user: CurrentUser;
}

type StatusLevel = "excellent" | "good" | "attention" | "critical";

const STATUS_COPY: Record<StatusLevel, { label: string; className: string }> = {
  excellent: { label: "Excellent", className: "bg-success/15 text-success" },
  good: { label: "Good", className: "bg-info/15 text-info" },
  attention: { label: "Needs Attention", className: "bg-warning/20 text-warning-foreground" },
  critical: { label: "Critical", className: "bg-destructive/15 text-destructive" },
};

/** Deterministic from `performance.approvalRate` alone — thresholds are 70/50/30, documented here
 * rather than buried, since this is the one qualitative judgment call on the whole dashboard. */
function statusFromApprovalRate(approvalRate: number): StatusLevel {
  if (approvalRate >= 70) return "excellent";
  if (approvalRate >= 50) return "good";
  if (approvalRate >= 30) return "attention";
  return "critical";
}

function implementationProgress(statusCounts: StatusCounts): number | null {
  const total = statusCounts.implementationPending + statusCounts.implementationComplete;
  if (total === 0) return null;
  return Math.round((statusCounts.implementationComplete / total) * 100);
}

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface HeroStat {
  label: string;
  value: number;
  icon: LucideIcon;
  format: (value: number) => string;
}

function HeroStatItem({ stat }: { stat: HeroStat }) {
  const animated = useCountUp(stat.value);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <stat.icon className="text-muted-foreground h-4 w-4" />
        <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
      </div>
      <p data-metric className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {stat.format(animated)}
      </p>
    </div>
  );
}

export function ExecutiveHero({ user }: ExecutiveHeroProps) {
  const isCompanyWide = canViewCompanyAnalytics(user.role);
  const isReviewer = canReview(user.role);

  const overviewQuery = useAnalyticsOverview({}, isCompanyWide);
  const departmentQuery = useDepartmentAnalytics(user.department?.id, isReviewer && !isCompanyWide);
  const personalQuery = usePersonalAnalytics();

  // Captured once via a lazy initializer (same SSR-safe pattern as `mission-critical.tsx`'s
  // `useState(() => Date.now())`) rather than calling `new Date()` fresh on every render. The hour
  // is read via an explicit `Asia/Kolkata` `Intl` formatter rather than `Date.getHours()` (which
  // reads the *runtime's* local timezone) — a Node server typically runs in UTC, so `getHours()`
  // would both mismatch the client on hydration and greet an IST audience with the wrong time of
  // day; formatting in a fixed timezone makes server and client agree regardless of where either
  // one is actually running.
  const [{ greeting, today }] = useState(() => {
    const now = new Date();
    const istHour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(now));
    return {
      greeting: greetingForHour(istHour),
      today: now.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", timeZone: "Asia/Kolkata" }),
    };
  });

  let stats: HeroStat[] = [];
  let status: StatusLevel | null = null;
  let isLoading = false;

  if (isCompanyWide) {
    isLoading = overviewQuery.isLoading || !overviewQuery.data;
    if (overviewQuery.data) {
      const data = overviewQuery.data;
      status = statusFromApprovalRate(data.performance.approvalRate);
      const progress = implementationProgress(data.statusCounts);
      stats = [
        { label: "Estimated Savings", value: data.business.actualSavings, icon: IndianRupee, format: formatCurrency },
        {
          label: "Pending Reviews",
          value: data.statusCounts.submitted + data.statusCounts.underReview,
          icon: TrendingUp,
          format: formatNumber,
        },
        {
          label: "Implementation Progress",
          value: progress ?? 0,
          icon: HardHat,
          format: (v) => (progress === null ? "—" : `${Math.round(v)}%`),
        },
        {
          label: "Business Impact Recorded",
          value: data.statusCounts.businessImpactRecorded,
          icon: Sparkles,
          format: formatNumber,
        },
      ];
    }
  } else if (isReviewer) {
    const dept = departmentQuery.data?.[0];
    isLoading = departmentQuery.isLoading || !dept;
    if (dept) {
      status = statusFromApprovalRate(dept.approvalRate);
      const progress = implementationProgress(dept.statusCounts);
      stats = [
        { label: "Estimated Savings", value: dept.actualSavings, icon: IndianRupee, format: formatCurrency },
        { label: "Pending Reviews", value: dept.pendingReviews, icon: TrendingUp, format: formatNumber },
        {
          label: "Implementation Progress",
          value: progress ?? 0,
          icon: HardHat,
          format: (v) => (progress === null ? "—" : `${Math.round(v)}%`),
        },
        {
          label: "Business Impact Recorded",
          value: dept.statusCounts.businessImpactRecorded,
          icon: Sparkles,
          format: formatNumber,
        },
      ];
    }
  } else {
    isLoading = personalQuery.isLoading || !personalQuery.data;
    if (personalQuery.data) {
      const data = personalQuery.data;
      stats = [
        { label: "Total Points", value: user.gamification.totalPoints, icon: Sparkles, format: formatNumber },
        {
          label: "Current Rank",
          value: user.gamification.currentRank ?? 0,
          icon: Medal,
          format: (v) => (user.gamification.currentRank === null ? "Unranked" : `#${Math.round(v)}`),
        },
        { label: "Ideas Submitted", value: user.gamification.ideasSubmitted, icon: TrendingUp, format: formatNumber },
        { label: "My Approval Rate", value: data.approvalRate, icon: HardHat, format: (v) => `${Math.round(v)}%` },
      ];
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top right, color-mix(in oklch, var(--color-primary) 8%, transparent), transparent 60%)",
        }}
      />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-muted-foreground text-sm">{today}</p>
              <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
              {status ? <Badge className={STATUS_COPY[status].className}>{STATUS_COPY[status].label}</Badge> : null}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting}, {user.firstName}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={ROUTES.NEW_KAIZEN}>Submit New Idea</Link>
            </Button>
            {isReviewer ? (
              <Button asChild variant="outline">
                <Link href={ROUTES.REVIEW}>Review Queue</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href={ROUTES.MY_IDEAS}>My Ideas</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {isLoading
            ? [...Array(4)].map((_, index) => <LoadingSkeleton key={index} className="h-16 w-full" />)
            : stats.map((stat) => <HeroStatItem key={stat.label} stat={stat} />)}
        </div>
      </div>
    </div>
  );
}
