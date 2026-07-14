"use client";

import { forwardRef, useState } from "react";
import { AlertTriangle, Building2, Calendar, HardHat, IndianRupee, TrendingUp, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { KaizenStatusBadge } from "@/features/kaizen/components/kaizen-status-badge";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import type { CurrentUser } from "@/features/auth/types/user";
import { AssignImplementationDialog } from "@/features/review/components/workspace/assign-implementation-dialog";
import { ReviewActionBar, type ReviewActionBarHandle } from "@/features/review/components/workspace/review-action-bar";
import { IMPACT_LABELS } from "@/features/review/utils/badge-tones";
import { RISK_LEVEL_LABEL, RISK_LEVEL_TONE } from "@/features/review/utils/risk-level";
import { useDepartmentAnalytics } from "@/features/analytics/hooks/use-analytics";
import { useBusinessImpact } from "@/features/implementation/hooks/use-business-impact";
import { useImplementation } from "@/features/implementation/hooks/use-implementation";
import { useEvaluation } from "@/features/scoring/hooks/use-evaluation";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

const IMPLEMENTATION_STAGE = new Set([
  "IMPLEMENTATION_IN_PROGRESS",
  "IMPLEMENTATION_COMPLETED",
  "BUSINESS_IMPACT_RECORDED",
  "REWARD_ISSUED",
]);
const IMPACT_RECORDED_STAGE = new Set(["BUSINESS_IMPACT_RECORDED", "REWARD_ISSUED"]);

interface FactRowProps {
  icon: typeof User;
  label: string;
  value: React.ReactNode;
}

function FactRow({ icon: Icon, label, value }: FactRowProps) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function implementationReadiness(kaizen: KaizenDetail, progressPercent: number | undefined): string {
  if (kaizen.status === "APPROVED") return "Ready to assign";
  if (kaizen.status === "IMPLEMENTATION_IN_PROGRESS") return `${progressPercent ?? 0}% in progress`;
  if (IMPLEMENTATION_STAGE.has(kaizen.status)) return "Completed";
  return "Not yet approved";
}

interface DecisionCenterProps {
  kaizen: KaizenDetail;
  currentUser: CurrentUser;
}

/**
 * The right panel — sticky (positioned by the workspace root), scrollable facts on top, the
 * action bar pinned to the bottom. "Owner" is deliberately not a field here before an
 * implementation exists — `KaizenDetail` only has a `submitter`, so that's what's shown; once
 * assigned, `Implementation.owner` (a different, real field) takes over via `useImplementation`.
 */
export const DecisionCenter = forwardRef<ReviewActionBarHandle, DecisionCenterProps>(function DecisionCenter(
  { kaizen, currentUser },
  actionBarRef,
) {
  const [assignOpen, setAssignOpen] = useState(false);
  const evaluationQuery = useEvaluation(kaizen.id);
  const implementationQuery = useImplementation(kaizen.id);
  const businessImpactQuery = useBusinessImpact(kaizen.id);
  const departmentQuery = useDepartmentAnalytics(kaizen.department.id, true);

  const evaluation = evaluationQuery.data;
  const implementation = implementationQuery.data;
  const businessImpact = IMPACT_RECORDED_STAGE.has(kaizen.status) ? businessImpactQuery.data : null;
  const dept = departmentQuery.data?.[0];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-muted-foreground text-xs">Current Score</p>
            {evaluation?.isSubmitted ? (
              <div className="mt-1 flex items-baseline gap-2">
                <span data-metric className="text-3xl font-semibold tracking-tight">
                  {evaluation.overallRating.toFixed(1)}
                </span>
                <span className="text-muted-foreground text-sm">/ 10</span>
                <Badge className="ml-auto">{evaluation.recommendation.replaceAll("_", " ")}</Badge>
              </div>
            ) : (
              <p className="mt-1 text-sm font-medium">Not yet evaluated</p>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t pt-4">
            <FactRow icon={AlertTriangle} label="Status" value={<KaizenStatusBadge status={kaizen.status} />} />
            <FactRow icon={Building2} label="Department" value={kaizen.department.name} />
            <FactRow icon={User} label="Submitter" value={kaizen.submitter.displayName} />
            <FactRow icon={Calendar} label="Submitted" value={kaizen.submittedAt ? formatDate(kaizen.submittedAt) : "—"} />
            <FactRow icon={HardHat} label="Implementation Readiness" value={implementationReadiness(kaizen, implementation?.progressPercent)} />
            <FactRow
              icon={IndianRupee}
              label="Business Impact"
              value={
                businessImpact?.moneySaved != null
                  ? `${formatCurrency(businessImpact.moneySaved)} saved (actual)`
                  : `${IMPACT_LABELS[kaizen.estimatedImpact]} (estimated)`
              }
            />
            <FactRow
              icon={AlertTriangle}
              label="Risk Level"
              value={<Badge variant={RISK_LEVEL_TONE[kaizen.priority]}>{RISK_LEVEL_LABEL[kaizen.priority]}</Badge>}
            />
          </div>

          {dept ? (
            <div className="flex flex-col gap-2 rounded-lg border p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <TrendingUp className="h-3 w-3" />
                {kaizen.department.name} — Quick Stats
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Approval Rate</p>
                  <p data-metric className="font-semibold">
                    {dept.approvalRate}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Pending Reviews</p>
                  <p data-metric className="font-semibold">
                    {formatNumber(dept.pendingReviews)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ReviewActionBar ref={actionBarRef} kaizen={kaizen} currentUser={currentUser} onOpenAssign={() => setAssignOpen(true)} />
      <AssignImplementationDialog kaizen={kaizen} open={assignOpen} onOpenChange={setAssignOpen} />
    </div>
  );
});
