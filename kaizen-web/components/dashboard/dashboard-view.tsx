"use client";

import { AnnouncementsCard } from "@/components/dashboard/announcements-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ProfileSummaryCard } from "@/components/dashboard/profile-summary-card";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { ErrorState } from "@/components/feedback/error-state";
import { FadeIn } from "@/components/feedback/fade-in";
import { PersonalAnalyticsSection } from "@/features/analytics/components/personal/personal-analytics-section";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";

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

  // Covers both the initial fetch and the brief window before Clerk resolves the session.
  if (!user) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8">
      <FadeIn>
        <WelcomeHeader firstName={user.firstName} />
      </FadeIn>

      <FadeIn delay={0.05}>
        <StatsCards gamification={user.gamification} />
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-3">
        <FadeIn delay={0.1}>
          <ProfileSummaryCard user={user} />
        </FadeIn>
        <FadeIn delay={0.15}>
          <RecentActivityCard />
        </FadeIn>
        <FadeIn delay={0.2}>
          <AnnouncementsCard />
        </FadeIn>
      </div>

      <FadeIn delay={0.25}>
        <QuickActionsCard />
      </FadeIn>

      <FadeIn delay={0.3}>
        <PersonalAnalyticsSection />
      </FadeIn>
    </div>
  );
}
