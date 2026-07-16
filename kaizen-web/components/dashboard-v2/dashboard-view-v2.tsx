"use client";

import { FadeIn } from "@/components/feedback/fade-in";
import { ErrorState } from "@/components/feedback/error-state";
import { GreetingHeader } from "@/components/v2/greeting-header";
import { PageContainer } from "@/components/v2/page-container";
import { DashboardSkeletonV2 } from "@/components/dashboard-v2/dashboard-skeleton-v2";
import { FocusSection } from "@/components/dashboard-v2/focus-section";
import { IdeasSummarySection } from "@/components/dashboard-v2/ideas-summary-section";
import { PerformanceSection } from "@/components/dashboard-v2/performance-section";
import { QuickActionsSection } from "@/components/dashboard-v2/quick-actions-section";
import { useAttentionItems } from "@/components/dashboard-v2/use-attention-items";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import type { CurrentUser } from "@/features/auth/types/user";

function attentionSubtitle(count: number): string {
  if (count === 0) return "You're all caught up — nothing needs your attention right now.";
  if (count === 1) return "You have 1 item that needs your attention today.";
  return `You have ${count} items that need your attention today.`;
}

/**
 * Dashboard V2 — matches the finalized Stitch design: narrative greeting, a pill row of quick
 * actions, a two-column Focus/Performance split, then Ideas Summary. Every section reuses the
 * exact hooks the V1 dashboard (`components/dashboard/dashboard-view.tsx`) already called —
 * `useCurrentUser`, `useAnalyticsOverview`/`useDepartmentAnalytics`, `useImplementationList`,
 * `useKaizenList`, `usePersonalAnalytics`, `useUserAchievements` — nothing here fetches anything
 * new. What changed is layout, typography, and which of the four questions (attention / my ideas
 * / next action / recently earned) each section answers.
 */
export function DashboardViewV2() {
  const { data: user, isError, refetch } = useCurrentUser();

  if (isError) {
    return (
      <PageContainer size="wide">
        <ErrorState
          title="Couldn't load your dashboard"
          description="Something went wrong while fetching your profile. Please try again."
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer size="wide">
        <DashboardSkeletonV2 />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide">
      <DashboardBody user={user} />
    </PageContainer>
  );
}

/** Split out so `useAttentionItems` (and the role-gated hooks it calls) only ever mounts once a
 * real `user` exists — keeps every hook call unconditional within this component, rather than
 * calling `useAttentionItems` in the parent with a non-null-asserted `user` that might not be
 * loaded yet. */
function DashboardBody({ user }: { user: CurrentUser }) {
  const attention = useAttentionItems(user);
  const attentionCount = attention.items.filter((item) => item.count > 0).length;

  return (
    <>
      <FadeIn>
        <GreetingHeader
          name={user.firstName}
          subtitle={attention.isLoading ? undefined : attentionSubtitle(attentionCount)}
        />
      </FadeIn>

      <FadeIn delay={0.05}>
        <QuickActionsSection user={user} />
      </FadeIn>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FadeIn delay={0.1} className="lg:col-span-2">
          <FocusSection items={attention.items} isLoading={attention.isLoading} />
        </FadeIn>

        <FadeIn delay={0.15}>
          <PerformanceSection user={user} />
        </FadeIn>
      </div>

      <FadeIn delay={0.2}>
        <IdeasSummarySection user={user} />
      </FadeIn>
    </>
  );
}
