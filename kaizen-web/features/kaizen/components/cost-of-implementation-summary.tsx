import { COST_TYPE_OPTIONS, DURATION_UNIT_OPTIONS, IMPACT_LEVEL_LABELS } from "@/features/kaizen/constants/cost-of-implementation";
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import type { CostOfImplementation } from "@/features/kaizen/types/kaizen";
import { formatCurrency } from "@/utils/format";

interface CostOfImplementationSummaryProps {
  cost: CostOfImplementation | null;
}

/**
 * The "reviewers should clearly see Implementation Cost, Resources, Benefits, ROI as a structured
 * section" display — shared by the Review Workspace (review-document.tsx) and the Kaizen Details
 * page (kaizen-case-study.tsx) rather than duplicated between them. Not reused by the PDF export
 * (kaizen-report-document.tsx uses @react-pdf/renderer primitives, a different rendering engine
 * entirely — see that file's own doc comment on why JSX isn't shared across the two).
 */
export function CostOfImplementationSummary({ cost }: CostOfImplementationSummaryProps) {
  const departmentsQuery = useDepartments();

  if (!cost) {
    return <p className="text-muted-foreground text-sm">Not provided.</p>;
  }

  const involvedDepartments = departmentsQuery.data?.filter((item) => cost.departmentIds?.includes(item.id)) ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
      <div>
        <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">Implementation Cost</p>
        <dl className="space-y-1">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Estimated Cost</dt>
            <dd>{cost.estimatedCost != null ? formatCurrency(cost.estimatedCost) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Type</dt>
            <dd>{COST_TYPE_OPTIONS.find((o) => o.value === cost.costType)?.label ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Duration</dt>
            <dd>
              {cost.estimatedDurationValue ?? "—"} {DURATION_UNIT_OPTIONS.find((o) => o.value === cost.estimatedDurationUnit)?.label ?? ""}
            </dd>
          </div>
        </dl>
      </div>

      <div>
        <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">Resources</p>
        <dl className="space-y-1">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Employees Required</dt>
            <dd>{cost.employeesRequired ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Departments Involved</dt>
            <dd className="text-right">{involvedDepartments.length > 0 ? involvedDepartments.map((d) => d.name).join(", ") : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Materials</dt>
            <dd className="text-right">{cost.materialsRequired || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Machines</dt>
            <dd className="text-right">{cost.machinesRequired || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">External Vendor</dt>
            <dd>{cost.vendorRequired ? "Yes" : "No"}</dd>
          </div>
          {cost.vendorRequired && cost.vendorDetails ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Vendor Details</dt>
              <dd className="text-right">{cost.vendorDetails}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div>
        <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">Expected Benefits</p>
        <dl className="space-y-1">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Annual Savings</dt>
            <dd>{cost.estimatedAnnualSavings != null ? formatCurrency(cost.estimatedAnnualSavings) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Time Saved</dt>
            <dd>{cost.timeSavedHoursPerDay != null ? `${cost.timeSavedHoursPerDay} hrs/day` : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Quality</dt>
            <dd>{cost.qualityImprovement ? IMPACT_LEVEL_LABELS[cost.qualityImprovement] : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Safety</dt>
            <dd>{cost.safetyImprovement ? IMPACT_LEVEL_LABELS[cost.safetyImprovement] : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Customer Satisfaction</dt>
            <dd>{cost.customerSatisfactionImprovement ? IMPACT_LEVEL_LABELS[cost.customerSatisfactionImprovement] : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Waste Reduction</dt>
            <dd>{cost.wasteReductionImprovement ? IMPACT_LEVEL_LABELS[cost.wasteReductionImprovement] : "—"}</dd>
          </div>
        </dl>
      </div>

      <div>
        <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">ROI</p>
        <dl className="space-y-1">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Payback Period</dt>
            <dd>{cost.expectedPaybackPeriod || "—"}</dd>
          </div>
        </dl>
        {cost.additionalNotes ? <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{cost.additionalNotes}</p> : null}
      </div>
    </div>
  );
}
