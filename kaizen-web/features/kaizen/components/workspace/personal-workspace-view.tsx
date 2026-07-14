"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { FadeIn } from "@/components/feedback/fade-in";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { InnovationJourney } from "@/features/kaizen/components/workspace/innovation-journey";
import { MyProgressSection } from "@/features/kaizen/components/workspace/my-progress-section";
import { PersonalAnalyticsCharts } from "@/features/kaizen/components/workspace/personal-analytics-charts";
import { PersonalInsightsPanel } from "@/features/kaizen/components/workspace/personal-insights-panel";
import { PersonalProfileCard } from "@/features/kaizen/components/workspace/personal-profile-card";
import { PersonalWorkspaceSkeleton } from "@/features/kaizen/components/workspace/personal-workspace-skeleton";
import { QuickActionsTiles } from "@/features/kaizen/components/workspace/quick-actions-tiles";
import { TrophyCabinet } from "@/features/kaizen/components/workspace/trophy-cabinet";

/**
 * Milestone 15 — Personal Innovation Workspace. Three columns (Profile | Innovation Journey |
 * Insights) up top, then full-width Progress/Trophy Cabinet/Analytics sections below — the
 * three-column brief is the structural anchor, but cramming a level bar, a contribution graph,
 * a full achievement grid, and multiple trend charts into a narrow sidebar would work against
 * "excellent whitespace" from the same brief. Every section reuses hooks already used elsewhere
 * in this app (`useCurrentUser`, `usePersonalAnalytics`, `useKaizenList`, `useLeaderboard`,
 * `useAchievements`) — nothing new was added to the API surface.
 */
export function PersonalWorkspaceView() {
  const { data: user, isError, refetch } = useCurrentUser();

  if (isError) {
    return <ErrorState title="Couldn't load your workspace" description="Something went wrong while fetching your profile. Please try again." onRetry={() => refetch()} />;
  }

  if (!user) {
    return <PersonalWorkspaceSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8">
      <FadeIn>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr_320px]">
          <div className="flex flex-col gap-4">
            <PersonalProfileCard user={user} />
            <QuickActionsTiles role={user.role} />
          </div>

          <InnovationJourney />

          <PersonalInsightsPanel user={user} />
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <MyProgressSection user={user} />
      </FadeIn>

      <FadeIn delay={0.1}>
        <div id="trophy-cabinet" className="flex flex-col gap-4 scroll-mt-20">
          <SectionHeading title="Trophy Cabinet" description="Badges earned and waiting to be unlocked" action={{ label: "Full Leaderboard", href: "/leaderboard" }} />
          <TrophyCabinet />
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <PersonalAnalyticsCharts />
      </FadeIn>
    </div>
  );
}
