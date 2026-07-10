"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { PRESET_BENEFIT_TYPES } from "@/features/kaizen/constants/benefit-types";
import { DetailSection } from "@/features/kaizen/components/detail/detail-section";
import { KaizenDetailHeader } from "@/features/kaizen/components/detail/kaizen-detail-header";
import { KaizenDetailSkeleton } from "@/features/kaizen/components/detail/kaizen-detail-skeleton";
import { KaizenDetailTimeline } from "@/features/kaizen/components/detail/kaizen-detail-timeline";
import { useKaizenDetail } from "@/features/kaizen/hooks/use-kaizen-detail";
import type { FiveW1H, KaizenDetail } from "@/features/kaizen/types/kaizen";
import { ApiError } from "@/lib/api-client";

const FIVE_W1H_LABELS: Record<keyof FiveW1H, string> = {
  what: "What",
  whereLocation: "Where",
  whenOccurs: "When",
  who: "Who",
  why: "Why",
  how: "How",
};

interface KaizenDetailViewProps {
  id: string;
  /** Rendered directly below the header — e.g. the Review Workspace's action panel. Optional so
   * the plain My Ideas detail page (no actions to take) is unaffected. */
  actionSlot?: (kaizen: KaizenDetail) => React.ReactNode;
  /** Rendered after the timeline — e.g. the Review Workspace's comments panel. */
  extraContent?: (kaizen: KaizenDetail) => React.ReactNode;
}

export function KaizenDetailView({ id, actionSlot, extraContent }: KaizenDetailViewProps) {
  const { data: kaizen, isLoading, isError, error, refetch } = useKaizenDetail(id);

  if (isLoading) {
    return <KaizenDetailSkeleton />;
  }

  if (isError || !kaizen) {
    const message =
      error instanceof ApiError ? error.message : "Something went wrong while loading this Kaizen.";
    return (
      <ErrorState
        title="Couldn't load this Kaizen"
        description={message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <KaizenDetailHeader kaizen={kaizen} />

      {actionSlot?.(kaizen)}

      <DetailSection title="General Information">
        <dl className="space-y-3">
          <div>
            <dt className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
              Problem Statement
            </dt>
            <dd className="whitespace-pre-wrap">{kaizen.problemStatement || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
              Current Process
            </dt>
            <dd className="whitespace-pre-wrap">{kaizen.currentProcess || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
              Proposed Solution
            </dt>
            <dd className="whitespace-pre-wrap">{kaizen.proposedSolution || "—"}</dd>
          </div>
        </dl>
      </DetailSection>

      <DetailSection title="5W1H">
        {kaizen.fiveW1H ? (
          <dl className="space-y-2">
            {(Object.entries(FIVE_W1H_LABELS) as [keyof FiveW1H, string][]).map(
              ([field, label]) => (
                <div key={field} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground shrink-0">{label}</dt>
                  <dd className="text-right">{kaizen.fiveW1H?.[field] || "—"}</dd>
                </div>
              ),
            )}
          </dl>
        ) : (
          <p className="text-muted-foreground">Not provided.</p>
        )}
      </DetailSection>

      <DetailSection title="5 Why Analysis">
        {kaizen.fiveWhy.length > 0 ? (
          <ol className="list-decimal space-y-1 pl-4">
            {kaizen.fiveWhy
              .slice()
              .sort((a, b) => a.level - b.level)
              .map((entry) => (
                <li key={entry.level}>{entry.answer}</li>
              ))}
          </ol>
        ) : (
          <p className="text-muted-foreground">Not provided.</p>
        )}
      </DetailSection>

      <DetailSection title="Benefits">
        {kaizen.benefits.length > 0 ? (
          <ul className="space-y-1">
            {kaizen.benefits.map((benefit) => (
              <li key={benefit.id}>
                <span className="font-medium">
                  {PRESET_BENEFIT_TYPES.find((preset) => preset.value === benefit.benefitType)
                    ?.label ?? benefit.benefitType}
                  :
                </span>{" "}
                {benefit.description}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No benefits recorded.</p>
        )}
      </DetailSection>

      <DetailSection title="Attachments">
        <p className="text-muted-foreground">
          {kaizen.attachments.length > 0
            ? `${kaizen.attachments.length} file(s) attached.`
            : "No attachments."}
        </p>
      </DetailSection>

      <KaizenDetailTimeline kaizenId={kaizen.id} />

      {extraContent?.(kaizen)}
    </div>
  );
}
