"use client";

import { AlertTriangle } from "lucide-react";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { KaizenWizard } from "@/features/kaizen/components/kaizen-wizard";
import { useKaizenDetail } from "@/features/kaizen/hooks/use-kaizen-detail";
import { canEditKaizen } from "@/lib/permissions";
import { ApiError } from "@/lib/api-client";

interface EditKaizenGateProps {
  id: string;
}

/**
 * Checks edit eligibility BEFORE mounting the wizard — the wizard itself assumes it's always in a
 * genuinely editable state once rendered, per KaizenWizard's `mode="edit"`. Mirrors the backend's
 * `assertCanEdit` (kaizen.service.ts) via `canEditKaizen`, but this is only a UI gate: the backend
 * independently rejects any edit attempt on a locked Kaizen regardless of what this shows.
 */
export function EditKaizenGate({ id }: EditKaizenGateProps) {
  const { data: currentUser } = useCurrentUser();
  const { data: kaizen, isLoading, isError, error, refetch } = useKaizenDetail(id);

  if (isLoading || !kaizen || !currentUser) {
    if (isError) {
      const message = error instanceof ApiError ? error.message : "Something went wrong while loading this Kaizen.";
      return <ErrorState title="Couldn't load this Kaizen" description={message} onRetry={() => refetch()} />;
    }
    return <LoadingSkeleton className="mx-auto h-96 w-full max-w-3xl" />;
  }

  if (!canEditKaizen(kaizen, currentUser)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <span className="bg-warning/15 text-warning-foreground flex h-12 w-12 items-center justify-center rounded-full">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <p className="text-lg font-semibold">Editing locked</p>
        <p className="text-muted-foreground">
          This Kaizen can no longer be edited because it has entered the review workflow.
        </p>
      </div>
    );
  }

  return <KaizenWizard mode="edit" kaizenId={id} />;
}
