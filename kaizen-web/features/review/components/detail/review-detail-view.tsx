"use client";

import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { KaizenDetailView } from "@/features/kaizen/components/detail/kaizen-detail-view";
import { ImplementationAssignPanel } from "@/features/implementation/components/detail/implementation-assign-panel";
import { ReviewActionPanel } from "@/features/review/components/detail/review-action-panel";
import { ReviewCommentsPanel } from "@/features/review/components/detail/review-comments-panel";
import { EvaluationPanel } from "@/features/scoring/components/evaluation-panel";

interface ReviewDetailViewProps {
  id: string;
}

export function ReviewDetailView({ id }: ReviewDetailViewProps) {
  const { data: currentUser } = useCurrentUser();

  return (
    <KaizenDetailView
      id={id}
      actionSlot={(kaizen) => (
        <div className="flex flex-col gap-4">
          <EvaluationPanel kaizen={kaizen} currentUser={currentUser} />
          <ReviewActionPanel kaizen={kaizen} currentUser={currentUser} />
          <ImplementationAssignPanel kaizen={kaizen} currentUser={currentUser} />
        </div>
      )}
      extraContent={(kaizen) => <ReviewCommentsPanel kaizen={kaizen} currentUser={currentUser} />}
    />
  );
}
