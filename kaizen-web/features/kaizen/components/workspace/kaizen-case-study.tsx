"use client";

import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { AttachmentGallery } from "@/features/kaizen/components/attachment-gallery";
import { KaizenStatusBadge } from "@/features/kaizen/components/kaizen-status-badge";
import { PRESET_BENEFIT_TYPES } from "@/features/kaizen/constants/benefit-types";
import { useKaizenDetail } from "@/features/kaizen/hooks/use-kaizen-detail";
import { useKaizenTimeline } from "@/features/kaizen/hooks/use-kaizen-timeline";
import type { FiveW1H } from "@/features/kaizen/types/kaizen";
import { useBusinessImpact } from "@/features/implementation/hooks/use-business-impact";
import { useImplementation } from "@/features/implementation/hooks/use-implementation";
import { ImplementationBusinessImpact } from "@/features/implementation/components/workspace/implementation-business-impact";
import { ImplementationMilestones } from "@/features/implementation/components/workspace/implementation-milestones";
import { ProgressRing } from "@/features/implementation/components/workspace/progress-ring";
// Reused directly from the Review/Implementation Workspaces (Milestones 13–14) — lifecycle-wide
// primitives, not review- or implementation-specific. Neither file is modified.
import { ReviewCommentsThread } from "@/features/review/components/workspace/review-comments-thread";
import { ReviewTimeline } from "@/features/review/components/workspace/review-timeline";
import { IMPACT_BADGE_VARIANT, IMPACT_LABELS, PRIORITY_BADGE_VARIANT } from "@/features/review/utils/badge-tones";
import { useKaizenScore } from "@/features/scoring/hooks/use-kaizen-score";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/utils/format";

const FIVE_W1H_LABELS: Record<keyof FiveW1H, string> = {
  what: "What",
  whereLocation: "Where",
  whenOccurs: "When",
  who: "Who",
  why: "Why",
  how: "How",
};

const HAS_IMPLEMENTATION_STATUSES = new Set(["IMPLEMENTATION_IN_PROGRESS", "IMPLEMENTATION_COMPLETED", "BUSINESS_IMPACT_RECORDED", "REWARD_ISSUED"]);

function DocumentSection({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="border-t pt-8 first:border-t-0 first:pt-0">
      <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">{eyebrow}</h2>
      {children}
    </section>
  );
}

interface KaizenCaseStudyProps {
  id: string;
}

/**
 * Replaces the old `MyIdeasDetailView`/`KaizenDetailView` stack (deleted — nothing else imported
 * them once Review/Implementation built their own document views in Milestones 13–14). A "read
 * your own idea like a portfolio case study" page: same fields, same hooks, fresh document-style
 * presentation matching the Review/Implementation Workspaces' visual language.
 */
export function KaizenCaseStudy({ id }: KaizenCaseStudyProps) {
  const { data: currentUser } = useCurrentUser();
  const { data: kaizen, isLoading, isError, error, refetch } = useKaizenDetail(id);
  const timelineQuery = useKaizenTimeline(id);
  const scoreQuery = useKaizenScore(id);
  const implementationQuery = useImplementation(kaizen && HAS_IMPLEMENTATION_STATUSES.has(kaizen.status) ? id : "");
  const businessImpactQuery = useBusinessImpact(kaizen && HAS_IMPLEMENTATION_STATUSES.has(kaizen.status) ? id : "");

  if (isLoading || !kaizen) {
    if (isError) {
      const message = error instanceof ApiError ? error.message : "Something went wrong while loading this Kaizen.";
      return <ErrorState title="Couldn't load this Kaizen" description={message} onRetry={() => refetch()} />;
    }
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-8 py-8">
        <LoadingSkeleton className="h-8 w-2/3" />
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-24 w-full" />
      </div>
    );
  }

  const implementation = implementationQuery.data;

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:px-8">
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
          {kaizen.department.name}
          {kaizen.submittedAt ? ` · Submitted ${formatDate(kaizen.submittedAt)}` : ""}
        </p>
      </header>

      {implementation ? (
        <div className="flex items-center gap-4 rounded-xl border p-4">
          <ProgressRing value={implementation.progressPercent} size={56} strokeWidth={5} tone={implementation.completedAt ? "success" : "default"} />
          <div className="min-w-0 flex-1">
            <ImplementationMilestones kaizen={kaizen} implementation={implementation} timeline={timelineQuery.data} hasBusinessImpact={Boolean(businessImpactQuery.data)} variant="compact" />
          </div>
        </div>
      ) : null}

      <DocumentSection eyebrow="Problem Statement">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{kaizen.problemStatement || "Not provided."}</p>
      </DocumentSection>

      <DocumentSection eyebrow="Current Process">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{kaizen.currentProcess || "Not provided."}</p>
      </DocumentSection>

      <DocumentSection eyebrow="Proposed Solution">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{kaizen.proposedSolution || "Not provided."}</p>
      </DocumentSection>

      {kaizen.fiveW1H || kaizen.fiveWhy.length > 0 ? (
        <DocumentSection eyebrow="Root Cause Analysis">
          {kaizen.fiveWhy.length > 0 ? (
            <ol className="mb-4 flex flex-col gap-2">
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
          ) : null}
          {kaizen.fiveW1H ? (
            <dl className="grid grid-cols-2 gap-2 border-t pt-4 text-sm sm:grid-cols-3">
              {(Object.entries(FIVE_W1H_LABELS) as [keyof FiveW1H, string][]).map(([field, label]) => (
                <div key={field}>
                  <dt className="text-muted-foreground text-xs">{label}</dt>
                  <dd>{kaizen.fiveW1H?.[field] || "—"}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </DocumentSection>
      ) : null}

      <DocumentSection eyebrow="Expected Benefits">
        {kaizen.benefits.length > 0 ? (
          <ul className="flex flex-col gap-1.5 text-sm">
            {kaizen.benefits.map((benefit) => (
              <li key={benefit.id}>
                <span className="font-medium">{PRESET_BENEFIT_TYPES.find((preset) => preset.value === benefit.benefitType)?.label ?? benefit.benefitType}:</span> {benefit.description}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No benefits recorded.</p>
        )}
      </DocumentSection>

      <DocumentSection eyebrow="Attachments">
        <AttachmentGallery attachments={kaizen.attachments} />
      </DocumentSection>

      {scoreQuery.data && scoreQuery.data.evaluations.length > 0 ? (
        <DocumentSection eyebrow="Evaluation Score">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="bg-rewards/15 text-rewards flex h-10 w-10 items-center justify-center rounded-full">
                <Star className="h-5 w-5" />
              </span>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium">
                <span>Total Score: {scoreQuery.data.totalScore} / 50</span>
                <span>Overall Rating: {scoreQuery.data.overallRating.toFixed(1)} / 10</span>
              </div>
            </div>
            {scoreQuery.data.evaluations.map((evaluation, index) => (
              <div key={index} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{evaluation.reviewer.displayName}</p>
                  <p className="text-muted-foreground text-xs">{evaluation.submittedAt ? formatDate(evaluation.submittedAt) : "—"}</p>
                </div>
                <ul className="text-muted-foreground mt-1 flex flex-col gap-0.5">
                  {evaluation.scores.map((entry) => (
                    <li key={entry.parameter}>
                      {entry.parameter}: <span className="text-foreground font-medium">{entry.score}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DocumentSection>
      ) : null}

      <DocumentSection eyebrow="Business Impact">
        <ImplementationBusinessImpact kaizen={kaizen} businessImpact={businessImpactQuery.data} />
      </DocumentSection>

      <DocumentSection eyebrow="Comments">
        <ReviewCommentsThread kaizen={kaizen} currentUser={currentUser} />
      </DocumentSection>

      <DocumentSection eyebrow="Timeline">
        <ReviewTimeline kaizenId={kaizen.id} />
      </DocumentSection>
    </article>
  );
}
