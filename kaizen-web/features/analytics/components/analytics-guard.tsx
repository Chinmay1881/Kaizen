"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { canReview } from "@/lib/permissions";

/** "Visible to: Department Manager, HR, CMD, Super Admin" (Milestone 11 Part 1) — the same
 * hierarchy floor `canReview` already uses for Review/Implementation, reused rather than a new
 * one-off role check. */
export function AnalyticsGuard({ children }: { children: React.ReactNode }) {
  const { data: currentUser, isLoading } = useCurrentUser();

  if (isLoading || !currentUser) {
    return <LoadingSkeleton className="h-64 w-full rounded-xl" />;
  }

  if (!canReview(currentUser.role)) {
    return (
      <ErrorState
        title="Access restricted"
        description="Analytics are only available to Department Managers and above."
      />
    );
  }

  return <>{children}</>;
}
