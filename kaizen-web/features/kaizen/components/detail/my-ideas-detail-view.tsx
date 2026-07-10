"use client";

import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { KaizenDetailView } from "@/features/kaizen/components/detail/kaizen-detail-view";
import { BusinessImpactPanel } from "@/features/implementation/components/detail/business-impact-panel";
import { ImplementationProgressPanel } from "@/features/implementation/components/detail/implementation-progress-panel";
import { ReviewCommentsPanel } from "@/features/review/components/detail/review-comments-panel";
import { ScoreSummarySection } from "@/features/scoring/components/score-summary-section";

interface MyIdeasDetailViewProps {
  id: string;
}

/**
 * My Ideas' read-only Kaizen detail page, extended to also show the reviewer discussion, the
 * evaluation score, and implementation/business-impact progress — reuses ReviewCommentsPanel
 * (readOnly), ScoreSummarySection, ImplementationProgressPanel, and BusinessImpactPanel rather
 * than duplicating any of them. The latter two already self-gate their write controls to
 * owner/manager/HR-CMD-SuperAdmin and render read-only (or nothing, before an implementation
 * exists) for a plain submitter — no separate "summary" variant needed. No actionSlot is passed:
 * employees never get review, evaluation, or assignment actions here.
 */
export function MyIdeasDetailView({ id }: MyIdeasDetailViewProps) {
  const { data: currentUser } = useCurrentUser();

  return (
    <KaizenDetailView
      id={id}
      extraContent={(kaizen) => (
        <>
          <ScoreSummarySection kaizenId={kaizen.id} />
          <ImplementationProgressPanel kaizen={kaizen} currentUser={currentUser} />
          <BusinessImpactPanel kaizen={kaizen} currentUser={currentUser} />
          <ReviewCommentsPanel kaizen={kaizen} currentUser={currentUser} readOnly />
        </>
      )}
    />
  );
}
