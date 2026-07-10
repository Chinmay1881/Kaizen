"use client";

import { Pencil } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PRESET_BENEFIT_TYPES } from "@/features/kaizen/constants/benefit-types";
import { useCategories } from "@/features/kaizen/hooks/use-categories";
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";

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

interface Step7ReviewProps {
  onEditStep: (step: number) => void;
}

export function Step7Review({ onEditStep }: Step7ReviewProps) {
  const { watch } = useFormContext<WizardFormValues>();
  const values = watch();
  const categoriesQuery = useCategories();
  const departmentsQuery = useDepartments();

  const category = categoriesQuery.data?.find((item) => item.id === values.categoryId);
  const department = departmentsQuery.data?.find((item) => item.id === values.departmentId);

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
        <p className="whitespace-pre-wrap">{values.proposedSolution || "—"}</p>
      </ReviewSection>

      <ReviewSection title="5 Why Analysis" step={3} onEditStep={onEditStep}>
        <ol className="list-decimal space-y-1 pl-4">
          {values.fiveWhy.map((entry) => (
            <li key={entry.level}>{entry.answer || "—"}</li>
          ))}
        </ol>
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

      <ReviewSection title="Attachments" step={6} onEditStep={onEditStep}>
        {values.attachments.length > 0 ? (
          <p>{values.attachments.length} file(s) attached.</p>
        ) : (
          <p className="text-muted-foreground">No attachments.</p>
        )}
      </ReviewSection>
    </div>
  );
}
