"use client";

import { CheckCircle2, Circle, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";
import type { BusinessImpact } from "@/features/implementation/types/implementation";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import { IMPACT_LABELS } from "@/features/review/utils/badge-tones";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

const IMPROVEMENT_FIELDS = [
  { key: "processImprovement", label: "Process Improvement" },
  { key: "qualityImprovement", label: "Quality Improvement" },
  { key: "safetyImprovement", label: "Safety Improvement" },
  { key: "productivityImprovement", label: "Productivity Improvement" },
  { key: "customerSatisfactionImprovement", label: "Customer Satisfaction Improvement" },
] as const;

interface ImplementationBusinessImpactProps {
  kaizen: KaizenDetail;
  businessImpact: BusinessImpact | null | undefined;
}

/**
 * Read-only expected-vs-actual comparison. Recording business impact (the write path) lives in
 * the Action Bar's "Business Impact" dialog — this section is purely "read a live project," same
 * split as `ImplementationOverview`/progress. Reuses the same `useBusinessImpact` hook the old
 * shared `BusinessImpactPanel` used to (deleted in Milestone 15); also reused directly, unmodified,
 * by the My Ideas case-study page rather than forking a third copy of this same comparison UI.
 */
export function ImplementationBusinessImpact({ kaizen, businessImpact }: ImplementationBusinessImpactProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-3 rounded-xl border p-4">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Expected</p>
        <Badge variant="rewards" className="w-fit">
          {IMPACT_LABELS[kaizen.estimatedImpact]}
        </Badge>
        {kaizen.benefits.length > 0 ? (
          <ul className="flex flex-col gap-1.5 text-sm">
            {kaizen.benefits.map((benefit) => (
              <li key={benefit.id} className="flex items-start gap-1.5">
                <Circle className="text-muted-foreground mt-1 h-2 w-2 shrink-0 fill-current" />
                <span>{benefit.description}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No expected benefits recorded.</p>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border p-4">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Actual</p>
        {!businessImpact ? (
          <EmptyState icon={Sparkles} title="Not yet recorded" description="Recorded once the implementation is complete and verified." className="border-none px-0 py-4" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Money Saved</p>
                <p data-metric className="text-lg font-semibold">
                  {businessImpact.moneySaved != null ? formatCurrency(businessImpact.moneySaved) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Hours Saved</p>
                <p data-metric className="text-lg font-semibold">
                  {businessImpact.hoursSaved != null ? formatNumber(businessImpact.hoursSaved) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Employees Benefited</p>
                <p data-metric className="text-lg font-semibold">
                  {businessImpact.employeesBenefited != null ? formatNumber(businessImpact.employeesBenefited) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Customers Benefited</p>
                <p data-metric className="text-lg font-semibold">
                  {businessImpact.customersBenefited != null ? formatNumber(businessImpact.customersBenefited) : "—"}
                </p>
              </div>
            </div>
            <ul className="flex flex-col gap-1.5 text-sm">
              {IMPROVEMENT_FIELDS.map((field) => {
                const achieved = businessImpact[field.key];
                return (
                  <li key={field.key} className={achieved ? "flex items-center gap-1.5" : "text-muted-foreground flex items-center gap-1.5"}>
                    {achieved ? <CheckCircle2 className="text-success h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    {field.label}
                  </li>
                );
              })}
            </ul>
            {businessImpact.remarks ? <p className="text-sm whitespace-pre-wrap">{businessImpact.remarks}</p> : null}
            <p className="text-muted-foreground text-xs">
              Recorded by {businessImpact.recordedBy.displayName} on {formatDate(businessImpact.createdAt)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
