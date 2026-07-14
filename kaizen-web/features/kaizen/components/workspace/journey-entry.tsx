"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown, IndianRupee, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { ProgressRing } from "@/features/implementation/components/workspace/progress-ring";
import { useImplementation } from "@/features/implementation/hooks/use-implementation";
import { useBusinessImpact } from "@/features/implementation/hooks/use-business-impact";
import { KaizenStatusBadge } from "@/features/kaizen/components/kaizen-status-badge";
import type { KaizenListItem } from "@/features/kaizen/types/kaizen";
import { useKaizenScore } from "@/features/scoring/hooks/use-kaizen-score";
import { IMPACT_BADGE_VARIANT, IMPACT_LABELS, PRIORITY_BADGE_VARIANT } from "@/features/review/utils/badge-tones";
import { fadeInUpVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/utils/format";

const ENRICHED_STATUSES = new Set(["IMPLEMENTATION_IN_PROGRESS", "IMPLEMENTATION_COMPLETED", "BUSINESS_IMPACT_RECORDED", "REWARD_ISSUED"]);

interface JourneyEntryProps {
  kaizen: KaizenListItem;
  isLast: boolean;
  index: number;
}

/**
 * One portfolio piece — collapsed shows exactly what `KaizenListItem` (the list response) already
 * has; expanding lazy-fetches the richer, per-Kaizen data (`useKaizenScore`, `useImplementation`,
 * `useBusinessImpact` — all cheap, all `enabled` only while expanded) rather than fetching it for
 * every visible row up front. "Open full case study" links to `/kaizen/:id` for the complete
 * document (comments, full timeline, attachments).
 */
export function JourneyEntry({ kaizen, isLast, index }: JourneyEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const canEnrich = ENRICHED_STATUSES.has(kaizen.status);

  const scoreQuery = useKaizenScore(expanded ? kaizen.id : "");
  const implementationQuery = useImplementation(expanded && canEnrich ? kaizen.id : "");
  const businessImpactQuery = useBusinessImpact(expanded && canEnrich ? kaizen.id : "");

  return (
    <motion.li initial="hidden" animate="visible" variants={fadeInUpVariants} transition={{ delay: Math.min(index, 8) * 0.04 }} className="relative flex gap-4 pb-8 last:pb-0">
      {!isLast ? <span className="bg-border absolute top-10 left-[19px] w-px" style={{ bottom: 0 }} aria-hidden="true" /> : null}
      <span className="border-primary/30 bg-card relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2">
        <span className="bg-primary h-2.5 w-2.5 rounded-full" />
      </span>

      <div className="min-w-0 flex-1 rounded-xl border bg-card p-4">
        <button type="button" onClick={() => setExpanded((prev) => !prev)} className="flex w-full flex-col gap-2 text-left" aria-expanded={expanded}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">{kaizen.kaizenNumber}</p>
              <p className="truncate font-semibold">{kaizen.title}</p>
            </div>
            <ChevronDown className={cn("text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200", expanded && "rotate-180")} />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <KaizenStatusBadge status={kaizen.status} />
            <Badge variant={PRIORITY_BADGE_VARIANT[kaizen.priority]}>{kaizen.priority}</Badge>
            <Badge variant={IMPACT_BADGE_VARIANT[kaizen.estimatedImpact]}>{IMPACT_LABELS[kaizen.estimatedImpact]}</Badge>
            <Badge variant="outline">{kaizen.category?.name ?? "Uncategorized"}</Badge>
          </div>

          <p className="text-muted-foreground text-xs">
            {kaizen.department.name} · Submitted {kaizen.submittedAt ? formatDate(kaizen.submittedAt) : "not yet"}
          </p>
        </button>

        {expanded ? (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-3">
            <div className="flex items-center gap-2.5">
              <span className="bg-rewards/15 text-rewards flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <Star className="h-4 w-4" />
              </span>
              <div>
                <p className="text-muted-foreground text-xs">Review Score</p>
                {scoreQuery.isLoading ? <LoadingSkeleton className="h-5 w-12" /> : <p className="text-sm font-semibold">{scoreQuery.data && scoreQuery.data.evaluations.length > 0 ? `${scoreQuery.data.overallRating.toFixed(1)} / 10` : "Not yet scored"}</p>}
              </div>
            </div>

            {canEnrich ? (
              <div className="flex items-center gap-2.5">
                <ProgressRing value={implementationQuery.data?.progressPercent ?? 0} size={36} strokeWidth={4} />
                <div>
                  <p className="text-muted-foreground text-xs">Implementation</p>
                  {implementationQuery.isLoading ? <LoadingSkeleton className="h-5 w-16" /> : <p className="text-sm font-semibold">{implementationQuery.data ? `${implementationQuery.data.progressPercent}% complete` : "—"}</p>}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-medium">—</span>
                <div>
                  <p className="text-muted-foreground text-xs">Implementation</p>
                  <p className="text-sm font-semibold">Not started</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <span className="bg-business-impact/15 text-business-impact flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <IndianRupee className="h-4 w-4" />
              </span>
              <div>
                <p className="text-muted-foreground text-xs">Business Impact</p>
                {businessImpactQuery.isLoading && canEnrich ? (
                  <LoadingSkeleton className="h-5 w-16" />
                ) : (
                  <p className="text-sm font-semibold">{businessImpactQuery.data?.moneySaved != null ? `${formatCurrency(businessImpactQuery.data.moneySaved)} saved` : `${IMPACT_LABELS[kaizen.estimatedImpact]} (est.)`}</p>
                )}
              </div>
            </div>

            <Link href={`/kaizen/${kaizen.id}`} className="text-primary col-span-full text-sm font-medium hover:underline">
              Open full case study →
            </Link>
          </div>
        ) : null}
      </div>
    </motion.li>
  );
}
