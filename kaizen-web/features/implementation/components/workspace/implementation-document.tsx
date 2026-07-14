"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { Paperclip } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { CurrentUser } from "@/features/auth/types/user";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import { useKaizenTimeline } from "@/features/kaizen/hooks/use-kaizen-timeline";
import { PRESET_BENEFIT_TYPES } from "@/features/kaizen/constants/benefit-types";
import { useBusinessImpact } from "@/features/implementation/hooks/use-business-impact";
import { ImplementationBusinessImpact } from "@/features/implementation/components/workspace/implementation-business-impact";
import { ImplementationMilestones } from "@/features/implementation/components/workspace/implementation-milestones";
import { ImplementationOverview } from "@/features/implementation/components/workspace/implementation-overview";
import type { Implementation } from "@/features/implementation/types/implementation";
// Reused directly from the Review Workspace (Milestone 13) — both are lifecycle-wide primitives
// (comments/timeline apply to a Kaizen at any stage, not just during review) built on hooks that
// were never review-specific in the first place. Importing them here rather than forking a copy
// satisfies "do not duplicate existing functionality"; neither file is modified, so the Review
// Workspace is completely unaffected.
import { ReviewCommentsThread, type ReviewCommentsThreadHandle } from "@/features/review/components/workspace/review-comments-thread";
import { ReviewTimeline } from "@/features/review/components/workspace/review-timeline";
import { formatCurrency, getInitialsFromName } from "@/utils/format";

function DocumentSection({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="border-t pt-8 first:border-t-0 first:pt-0">
      <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">{eyebrow}</h2>
      {children}
    </section>
  );
}

interface ImplementationDocumentProps {
  kaizen: KaizenDetail;
  implementation: Implementation;
  currentUser: CurrentUser | undefined;
}

export type ImplementationDocumentHandle = ReviewCommentsThreadHandle;

/** The center panel — the implementation as a live project, reading top to bottom. Not built on
 * the old shared `KaizenDetailView` (deleted in Milestone 15 once My Ideas built its own
 * presentation too) — an Implementation-exclusive rendering of `KaizenDetail` + `Implementation`
 * fields. */
export const ImplementationDocument = forwardRef<ImplementationDocumentHandle, ImplementationDocumentProps>(function ImplementationDocument(
  { kaizen, implementation, currentUser },
  ref,
) {
  const timelineQuery = useKaizenTimeline(kaizen.id);
  const businessImpactQuery = useBusinessImpact(kaizen.id);
  const hasBusinessImpact = Boolean(businessImpactQuery.data);

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-8 py-8">
      <ImplementationOverview kaizen={kaizen} implementation={implementation} timeline={timelineQuery.data} hasBusinessImpact={hasBusinessImpact} />

      <DocumentSection eyebrow="Original Kaizen">
        <div className="flex flex-col gap-2 rounded-xl border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs">{kaizen.kaizenNumber}</p>
              <p className="font-semibold">{kaizen.title}</p>
            </div>
            <Link href={`/kaizen/${kaizen.id}`} className="text-primary shrink-0 text-sm font-medium hover:underline">
              View full Kaizen →
            </Link>
          </div>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">{kaizen.problemStatement || "No problem statement recorded."}</p>
        </div>
      </DocumentSection>

      <DocumentSection eyebrow="Objectives">
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
          <p className="text-muted-foreground text-sm">No objectives recorded.</p>
        )}
      </DocumentSection>

      <DocumentSection eyebrow="Implementation Plan">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{implementation.description || kaizen.proposedSolution || "Not provided."}</p>
      </DocumentSection>

      <DocumentSection eyebrow="Current Progress">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-xs">Estimated Cost</p>
            <p className="font-medium">{implementation.estimatedCost != null ? formatCurrency(implementation.estimatedCost) : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Actual Cost</p>
            <p className="font-medium">{implementation.actualCost != null ? formatCurrency(implementation.actualCost) : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Time Taken</p>
            <p className="font-medium">{implementation.timeTakenDays != null ? `${implementation.timeTakenDays} days` : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Verification</p>
            <Badge variant={implementation.verificationStatus === "VERIFIED" ? "success" : implementation.verificationStatus === "REJECTED" ? "destructive" : "outline"}>
              {implementation.verificationStatus}
            </Badge>
          </div>
        </div>
        {implementation.completionNotes ? (
          <p className="text-muted-foreground mt-3 text-sm whitespace-pre-wrap">
            <span className="text-foreground font-medium">Completion notes: </span>
            {implementation.completionNotes}
          </p>
        ) : null}
      </DocumentSection>

      <DocumentSection eyebrow="Milestones">
        <ImplementationMilestones kaizen={kaizen} implementation={implementation} timeline={timelineQuery.data} hasBusinessImpact={hasBusinessImpact} variant="full" />
      </DocumentSection>

      <DocumentSection eyebrow="Assigned People">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2.5">
            <Avatar alt={implementation.owner.displayName} fallback={getInitialsFromName(implementation.owner.displayName)} className="h-9 w-9 text-xs" />
            <div>
              <p className="text-sm font-medium">{implementation.owner.displayName}</p>
              <p className="text-muted-foreground text-xs">Implementation Owner</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Avatar alt={kaizen.submitter.displayName} fallback={getInitialsFromName(kaizen.submitter.displayName)} className="h-9 w-9 text-xs" />
            <div>
              <p className="text-sm font-medium">{kaizen.submitter.displayName}</p>
              <p className="text-muted-foreground text-xs">Original Submitter</p>
            </div>
          </div>
        </div>
      </DocumentSection>

      <DocumentSection eyebrow="Attachments">
        {implementation.attachments.length > 0 ? (
          <ul className="flex flex-col gap-1.5 text-sm">
            {implementation.attachments.map((attachment) => (
              <li key={attachment.id} className="flex items-center gap-1.5">
                <Paperclip className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                <a href={attachment.cloudinarySecureUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {attachment.fileName}
                </a>
                <span className="text-muted-foreground">— uploaded by {attachment.uploadedBy.displayName}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Paperclip className="h-3.5 w-3.5" />
            No attachments.
          </p>
        )}
      </DocumentSection>

      <DocumentSection eyebrow="Business Impact">
        <ImplementationBusinessImpact kaizen={kaizen} businessImpact={businessImpactQuery.data} />
      </DocumentSection>

      <DocumentSection eyebrow="Comments">
        <ReviewCommentsThread ref={ref} kaizen={kaizen} currentUser={currentUser} />
      </DocumentSection>

      <DocumentSection eyebrow="Activity Timeline">
        <ReviewTimeline kaizenId={kaizen.id} />
      </DocumentSection>
    </article>
  );
});
