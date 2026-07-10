"use client";

import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { KaizenDetailView } from "@/features/kaizen/components/detail/kaizen-detail-view";
import { BusinessImpactPanel } from "@/features/implementation/components/detail/business-impact-panel";
import { ImplementationProgressPanel } from "@/features/implementation/components/detail/implementation-progress-panel";

interface ImplementationDetailViewProps {
  id: string;
}

/** `/implementation/[id]` — reuses KaizenDetailView (Milestone 5) exactly like the Review
 * Workspace does, so the 5W1H/5Why/Benefits/Timeline sections aren't duplicated a third time. */
export function ImplementationDetailView({ id }: ImplementationDetailViewProps) {
  const { data: currentUser } = useCurrentUser();

  return (
    <KaizenDetailView
      id={id}
      actionSlot={(kaizen) => (
        <div className="flex flex-col gap-4">
          <ImplementationProgressPanel kaizen={kaizen} currentUser={currentUser} />
          <BusinessImpactPanel kaizen={kaizen} currentUser={currentUser} />
        </div>
      )}
    />
  );
}
