"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AttachmentUploader } from "@/features/kaizen/components/attachment-uploader";
import { CharCounter } from "@/features/kaizen/components/char-counter";
import { FieldError } from "@/features/kaizen/components/field-error";
import { DURATION_UNIT_OPTIONS } from "@/features/kaizen/constants/cost-of-implementation";
import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";

interface Step2ProcessProps {
  draftId: string | null;
}

export function Step2Process({ draftId }: Step2ProcessProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<WizardFormValues>();

  const costErrors = errors.costOfImplementation;

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
        <AttachmentUploader draftId={draftId} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="proposedSolution">Proposed Improvement</Label>
        <Textarea id="proposedSolution" rows={6} {...register("proposedSolution")} />
        <div className="flex items-center justify-between gap-4">
          <FieldError message={errors.proposedSolution?.message} />
          <CharCounter current={watch("proposedSolution").length} max={1500} />
        </div>
      </div>

      {/* Lives here rather than the Cost of Implementation step — duration describes how long
          implementing the proposed change will take, not what it costs. Still part of the same
          `costOfImplementation` object in the wizard schema and API payload; only the step that
          collects it changed. */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimatedDurationValue">Estimated Duration</Label>
          <Input
            id="estimatedDurationValue"
            type="number"
            min={1}
            {...register("costOfImplementation.estimatedDurationValue", { valueAsNumber: true })}
          />
          <FieldError message={costErrors?.estimatedDurationValue?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedDurationUnit">Unit</Label>
          <Select id="estimatedDurationUnit" {...register("costOfImplementation.estimatedDurationUnit")} defaultValue="">
            <option value="" disabled>
              Select unit
            </option>
            {DURATION_UNIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <FieldError message={costErrors?.estimatedDurationUnit?.message} />
        </div>
      </div>
    </div>
  );
}
