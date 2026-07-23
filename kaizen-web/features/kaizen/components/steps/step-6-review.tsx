"use client";

import { Pencil } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PRESET_BENEFIT_TYPES } from "@/features/kaizen/constants/benefit-types";
import { COST_TYPE_OPTIONS, DURATION_UNIT_OPTIONS } from "@/features/kaizen/constants/cost-of-implementation";
import { useCategories } from "@/features/kaizen/hooks/use-categories";
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";
import { formatCurrency } from "@/utils/format";

interface ReviewSectionProps {
  title: string;
  step: number;
  onEditStep: (step: number) => void;
  children: React.ReactNode;
}

function ReviewSection({ title, step, onEditStep, children }: ReviewSectionProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button type="button" variant="ghost" size="sm" onClick={() => onEditStep(step)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="text-sm">{children}</CardContent>
    </Card>
  );
}

interface Step6ReviewProps {
  onEditStep: (step: number) => void;
}

export function Step6Review({ onEditStep }: Step6ReviewProps) {
  const { watch } = useFormContext<WizardFormValues>();
  const values = watch();
  const categoriesQuery = useCategories();
  const departmentsQuery = useDepartments();

  const category = categoriesQuery.data?.find((item) => item.id === values.categoryId);
  const department = departmentsQuery.data?.find((item) => item.id === values.departmentId);
  const cost = values.costOfImplementation;
  const involvedDepartments = departmentsQuery.data?.filter((item) => cost.departmentIds.includes(item.id)) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Review everything below before submitting. You can edit any section.
      </p>

      <ReviewSection title="Basics" step={1} onEditStep={onEditStep}>
        <dl className="space-y-1">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Title</dt>
            <dd className="text-right font-medium">{values.title || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Category</dt>
            <dd>{category?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Department</dt>
            <dd>{department?.name ?? "—"}</dd>
          </div>
        </dl>
        <Separator className="my-3" />
        <p className="whitespace-pre-wrap">{values.problemStatement || "—"}</p>
      </ReviewSection>

      <ReviewSection title="Process" step={2} onEditStep={onEditStep}>
        <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
          Current Process
        </p>
        <p className="mb-3 whitespace-pre-wrap">{values.currentProcess || "—"}</p>
        <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
          Proposed Improvement
        </p>
        <p className="mb-3 whitespace-pre-wrap">{values.proposedSolution || "—"}</p>
        <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
          Estimated Duration
        </p>
        <p className="mb-3">
          {cost.estimatedDurationValue ?? "—"} {DURATION_UNIT_OPTIONS.find((o) => o.value === cost.estimatedDurationUnit)?.label ?? ""}
        </p>
        <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
          Attachments
        </p>
        <p>{values.attachments.length > 0 ? `${values.attachments.length} file(s) attached.` : "No attachments."}</p>
      </ReviewSection>

      <ReviewSection title="Cost of Implementation" step={3} onEditStep={onEditStep}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            </dl>
          </div>

          <div>
            <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">Resources</p>
            <dl className="space-y-1">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Departments Involved</dt>
                <dd className="text-right">{involvedDepartments.length > 0 ? involvedDepartments.map((d) => d.name).join(", ") : "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">External Vendor</dt>
                <dd>{cost.vendorRequired ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </div>

          <div>
            <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">Benefits &amp; ROI</p>
            <dl className="space-y-1">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Annual Savings</dt>
                <dd>{cost.estimatedAnnualSavings != null ? formatCurrency(cost.estimatedAnnualSavings) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Payback Period</dt>
                <dd>{cost.expectedPaybackPeriod || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
        {cost.additionalNotes ? (
          <>
            <Separator className="my-3" />
            <p className="whitespace-pre-wrap">{cost.additionalNotes}</p>
          </>
        ) : null}
      </ReviewSection>

      <ReviewSection title="5W1H" step={4} onEditStep={onEditStep}>
        <dl className="space-y-1">
          {(
            [
              ["What", values.fiveW1H.what],
              ["Where", values.fiveW1H.whereLocation],
              ["When", values.fiveW1H.whenOccurs],
              ["Who", values.fiveW1H.who],
              ["Why", values.fiveW1H.why],
              ["How", values.fiveW1H.how],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </ReviewSection>

      <ReviewSection title="Benefits" step={5} onEditStep={onEditStep}>
        {values.benefits.length > 0 ? (
          <ul className="space-y-1">
            {values.benefits.map((benefit, index) => (
              <li key={index}>
                <span className="font-medium">
                  {PRESET_BENEFIT_TYPES.find((p) => p.value === benefit.benefitType)?.label ??
                    benefit.benefitType}
                  :
                </span>{" "}
                {benefit.description || "—"}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No benefits added.</p>
        )}
        {values.businessImpact ? (
          <p className="mt-2">
            <span className="font-medium">Business Impact:</span> {values.businessImpact}
          </p>
        ) : null}
        {values.estimatedSavings ? (
          <p className="mt-1">
            <span className="font-medium">Estimated Savings:</span> {values.estimatedSavings}
          </p>
        ) : null}
      </ReviewSection>
    </div>
  );
}
