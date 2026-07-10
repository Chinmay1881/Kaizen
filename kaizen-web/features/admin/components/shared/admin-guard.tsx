"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { canAccessAdmin } from "@/lib/permissions";

/** Client-side gate for every `/admin/*` page — every Admin Portal endpoint is already
 * Super-Admin-only on the backend (403s otherwise), but gating here avoids sending a non-admin
 * into a page full of controls they can't use, and avoids the round-trip failure entirely. */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: currentUser, isLoading } = useCurrentUser();

  if (isLoading || !currentUser) {
    return <LoadingSkeleton className="h-64 w-full rounded-xl" />;
  }

  if (!canAccessAdmin(currentUser.role)) {
    return (
      <ErrorState
        title="Access restricted"
        description="The Administration Portal is only available to Super Admins."
      />
    );
  }

  return <>{children}</>;
}
