"use client";

import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { BusinessHealthCharts } from "@/components/dashboard/business-health-charts";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DepartmentHealth } from "@/components/dashboard/department-health";
import { ExecutiveHero } from "@/components/dashboard/executive-hero";
import { LeaderboardSpotlight } from "@/components/dashboard/leaderboard-spotlight";
import { MissionCritical } from "@/components/dashboard/mission-critical";
import { PersonalWorkspace } from "@/components/dashboard/personal-workspace";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import { ErrorState } from "@/components/feedback/error-state";
import { FadeIn } from "@/components/feedback/fade-in";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { canReview } from "@/lib/permissions";

/**
 * Milestone 12 — Dashboard Reimagined: an Executive Command Center, not a card grid. Every
 * section fetches only the real, already-existing endpoints (`/analytics/*`, `/leaderboard`,
 * `/notifications`, `/kaizens`, `/implementations`) — no backend/API/schema changes. Business
 * Health and Department Health only render for reviewer roles, since `/analytics/*` is
 * role-gated server-side; Employees get the same Hero/Mission Critical/Activity/Leaderboard/Quick
 * Actions/Workspace sections scoped to their own data instead.
 */
export function DashboardView() {
  const { data: user, isError, refetch } = useCurrentUser();

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load your dashboard"
        description="Something went wrong while fetching your profile. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  if (!user) {
    return <DashboardSkeleton />;
  }

  const isReviewer = canReview(user.role);

  return (
    <div className="flex flex-col gap-8">
      <FadeIn>
        <ExecutiveHero user={user} />
      </FadeIn>

      <FadeIn delay={0.05}>
        <MissionCritical user={user} />
      </FadeIn>

      {isReviewer ? (
        <FadeIn delay={0.1}>
          <BusinessHealthCharts user={user} />
        </FadeIn>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FadeIn delay={0.15} className="lg:col-span-2">
          <ActivityTimeline />
        </FadeIn>
        <FadeIn delay={0.2}>
          <LeaderboardSpotlight />
        </FadeIn>
      </div>

      {isReviewer ? (
        <FadeIn delay={0.25}>
          <DepartmentHealth user={user} />
        </FadeIn>
      ) : null}

      <FadeIn delay={0.3}>
        <QuickActionsGrid user={user} />
      </FadeIn>

      <FadeIn delay={0.35}>
        <PersonalWorkspace user={user} />
      </FadeIn>
    </div>
  );
}
