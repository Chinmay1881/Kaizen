"use client";

import { useFormContext } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CharCounter } from "@/features/kaizen/components/char-counter";
import { FieldError } from "@/features/kaizen/components/field-error";
import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";

export function Step2Process() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<WizardFormValues>();

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <Label htmlFor="currentProcess">Current Process</Label>
        <p className="text-muted-foreground text-sm">Describe the current workflow.</p>
        <Textarea id="currentProcess" rows={6} {...register("currentProcess")} />
        <div className="flex items-center justify-between gap-4">
          <FieldError message={errors.currentProcess?.message} />
          <CharCounter current={watch("currentProcess").length} max={1500} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proposedSolution">Proposed Improvement</Label>
        <Textarea id="proposedSolution" rows={6} {...register("proposedSolution")} />
        <div className="flex items-center justify-between gap-4">
          <FieldError message={errors.proposedSolution?.message} />
          <CharCounter current={watch("proposedSolution").length} max={1500} />
        </div>
      </div>
    </div>
  );
}
