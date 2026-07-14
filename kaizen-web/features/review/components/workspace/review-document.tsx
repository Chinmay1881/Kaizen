"use client";

import { forwardRef } from "react";
import { Paperclip } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { KaizenStatusBadge } from "@/features/kaizen/components/kaizen-status-badge";
import { PRESET_BENEFIT_TYPES } from "@/features/kaizen/constants/benefit-types";
import type { CurrentUser } from "@/features/auth/types/user";
import type { FiveW1H, KaizenDetail } from "@/features/kaizen/types/kaizen";
import { useKaizenTimeline } from "@/features/kaizen/hooks/use-kaizen-timeline";
import { ReviewCommentsThread, type ReviewCommentsThreadHandle } from "@/features/review/components/workspace/review-comments-thread";
import { ReviewScoringCards } from "@/features/review/components/workspace/review-scoring-cards";
import { ReviewTimeline } from "@/features/review/components/workspace/review-timeline";
import { IMPACT_BADGE_VARIANT, IMPACT_LABELS, PRIORITY_BADGE_VARIANT } from "@/features/review/utils/badge-tones";
import { formatDate } from "@/utils/format";

const FIVE_W1H_LABELS: Record<keyof FiveW1H, string> = {
  what: "What",
  whereLocation: "Where",
  whenOccurs: "When",
  who: "Who",
  why: "Why",
  how: "How",
};

const DECISION_EVENT_TYPES = new Set(["APPROVED", "REJECTED", "NEEDS_CHANGES"]);

function DocumentSection({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="border-t pt-8 first:border-t-0 first:pt-0">
      <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">{eyebrow}</h2>
      {children}
    </section>
  );
}

interface ReviewDocumentProps {
  kaizen: KaizenDetail;
  currentUser: CurrentUser | undefined;
}

export type ReviewDocumentHandle = ReviewCommentsThreadHandle;

/**
 * The center panel — the Kaizen as a document, reading top to bottom like a proposal. Deliberately
 * not built on the old shared `KaizenDetailView`/`DetailSection` (deleted in Milestone 15 once My
 * Ideas built its own case-study presentation too) — a Review-exclusive rendering of the same
 * `KaizenDetail` fields, plus the Review-exclusive scoring/comments/timeline pieces.
 */
export const ReviewDocument = forwardRef<ReviewDocumentHandle, ReviewDocumentProps>(function ReviewDocument(
  { kaizen, currentUser },
  ref,
) {
  const timelineQuery = useKaizenTimeline(kaizen.id);
  const latestDecision = [...(timelineQuery.data ?? [])].reverse().find((event) => DECISION_EVENT_TYPES.has(event.eventType));

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-8 py-8">
      <header className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">{kaizen.kaizenNumber}</p>
        <h1 className="text-2xl font-bold tracking-tight text-balance">{kaizen.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <KaizenStatusBadge status={kaizen.status} />
          <Badge variant={PRIORITY_BADGE_VARIANT[kaizen.priority]}>{kaizen.priority}</Badge>
          <Badge variant={IMPACT_BADGE_VARIANT[kaizen.estimatedImpact]}>{IMPACT_LABELS[kaizen.estimatedImpact]}</Badge>
          <Badge variant="outline">{kaizen.category?.name ?? "Uncategorized"}</Badge>
        </div>
        <p className="text-muted-foreground text-xs">
          Submitted by {kaizen.submitter.displayName} · {kaizen.department.name}
          {kaizen.submittedAt ? ` · ${formatDate(kaizen.submittedAt)}` : ""}
        </p>
      </header>

      <DocumentSection eyebrow="Problem Statement">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{kaizen.problemStatement || "Not provided."}</p>
      </DocumentSection>

      <DocumentSection eyebrow="Current Process">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{kaizen.currentProcess || "Not provided."}</p>
      </DocumentSection>

      <DocumentSection eyebrow="Proposed Improvement">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{kaizen.proposedSolution || "Not provided."}</p>
      </DocumentSection>

      <DocumentSection eyebrow="Root Cause (5 Whys)">
        {kaizen.fiveWhy.length > 0 ? (
          <ol className="flex flex-col gap-2">
            {kaizen.fiveWhy
              .slice()
              .sort((a, b) => a.level - b.level)
              .map((entry) => (
                <li key={entry.level} className="flex gap-2 text-sm leading-relaxed">
                  <span className="text-muted-foreground shrink-0 font-medium">Why {entry.level}.</span>
                  <span>{entry.answer}</span>
                </li>
              ))}
          </ol>
        ) : (
          <p className="text-muted-foreground text-sm">Not provided.</p>
        )}
        {kaizen.fiveW1H ? (
          <dl className="mt-4 grid grid-cols-2 gap-2 border-t pt-4 text-sm sm:grid-cols-3">
            {(Object.entries(FIVE_W1H_LABELS) as [keyof FiveW1H, string][]).map(([field, label]) => (
              <div key={field}>
                <dt className="text-muted-foreground text-xs">{label}</dt>
                <dd>{kaizen.fiveW1H?.[field] || "—"}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </DocumentSection>

      <DocumentSection eyebrow="Expected Benefits">
        {kaizen.benefits.length > 0 ? (
          <ul className="flex flex-col gap-1.5 text-sm">
            {kaizen.benefits.map((benefit) => (
              <li key={benefit.id}>
                <span className="font-medium">{PRESET_BENEFIT_TYPES.find((preset) => preset.value === benefit.benefitType)?.label ?? benefit.benefitType}:</span>{" "}
                {benefit.description}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No benefits recorded.</p>
        )}
      </DocumentSection>

      <DocumentSection eyebrow="Attachments">
        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <Paperclip className="h-3.5 w-3.5" />
          {kaizen.attachments.length > 0 ? `${kaizen.attachments.length} file(s) attached.` : "No attachments."}
        </p>
      </DocumentSection>

      <DocumentSection eyebrow="Evaluation">
        <ReviewScoringCards kaizen={kaizen} currentUser={currentUser} />
      </DocumentSection>

      {latestDecision ? (
        <DocumentSection eyebrow="Reviewer Notes">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{latestDecision.description}</p>
          <p className="text-muted-foreground mt-1 text-xs">{formatDate(latestDecision.createdAt)}{latestDecision.actor ? ` · ${latestDecision.actor.displayName}` : ""}</p>
        </DocumentSection>
      ) : null}

      <DocumentSection eyebrow="Comments">
        <ReviewCommentsThread ref={ref} kaizen={kaizen} currentUser={currentUser} />
      </DocumentSection>

      <DocumentSection eyebrow="Timeline">
        <ReviewTimeline kaizenId={kaizen.id} />
      </DocumentSection>
    </article>
  );
});
