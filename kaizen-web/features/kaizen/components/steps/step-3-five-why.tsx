"use client";

import { useFormContext } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/features/kaizen/components/field-error";
import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";

export function Step3FiveWhy() {
  const {
    register,
    formState: { errors },
  } = useFormContext<WizardFormValues>();

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">
        Identify the root cause — ask &ldquo;Why?&rdquo; five times, each answer building on the
        last.
      </p>

      {[0, 1, 2, 3, 4].map((index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium">
              {index + 1}
            </div>
            {index < 4 ? <div className="bg-border my-1 w-px flex-1" aria-hidden="true" /> : null}
          </div>
          <div className="flex-1 space-y-2 pb-6">
            <Label htmlFor={`five-why-${index}`}>Why? (Level {index + 1})</Label>
            <Textarea
              id={`five-why-${index}`}
              rows={2}
              placeholder="Answer this level's Why..."
              {...register(`fiveWhy.${index}.answer` as const)}
            />
            <FieldError message={errors.fiveWhy?.[index]?.answer?.message} />
          </div>
        </div>
      ))}
    </div>
  );
}
