"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { canReview } from "@/lib/permissions";

/** "Employee: Cannot access Reports" (Part 12) — same hierarchy floor as Analytics/Review. */
export function ReportsGuard({ children }: { children: React.ReactNode }) {
  const { data: currentUser, isLoading } = useCurrentUser();

  if (isLoading || !currentUser) {
    return <LoadingSkeleton className="h-64 w-full rounded-xl" />;
  }

  if (!canReview(currentUser.role)) {
    return <ErrorState title="Access restricted" description="Reports are only available to Department Managers and above." />;
  }

  return <>{children}</>;
}
