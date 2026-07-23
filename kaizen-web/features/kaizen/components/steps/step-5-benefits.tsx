"use client";

import { Plus, X } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CharCounter } from "@/features/kaizen/components/char-counter";
import { FieldError } from "@/features/kaizen/components/field-error";
import { PRESET_BENEFIT_TYPES } from "@/features/kaizen/constants/benefit-types";
import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";

export function Step5Benefits() {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<WizardFormValues>();

  const { fields, append, remove } = useFieldArray({ control, name: "benefits" });
  const addedPresetTypes = new Set(watch("benefits").map((benefit) => benefit.benefitType));

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-3">
        <Label>Expected Benefits</Label>
        <p className="text-muted-foreground text-sm">
          Add at least one benefit. Pick a preset or add a custom one.
        </p>

        <div className="flex flex-wrap gap-2">
          {PRESET_BENEFIT_TYPES.map((preset) => (
            <Button
              key={preset.value}
              type="button"
              variant="outline"
              size="sm"
              disabled={addedPresetTypes.has(preset.value)}
              onClick={() =>
                append({ benefitType: preset.value, description: "", isCustom: false })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              {preset.label}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ benefitType: "CUSTOM", description: "", isCustom: true })}
          >
            <Plus className="h-3.5 w-3.5" />
            Custom Benefit
          </Button>
        </div>

        <FieldError message={errors.benefits?.message} />

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const preset = PRESET_BENEFIT_TYPES.find((p) => p.value === field.benefitType);

            return (
              <Card key={field.id}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex-1 space-y-2">
                    {field.isCustom ? (
                      <Input
                        placeholder="Benefit name (e.g. Reduced Waste)"
                        {...register(`benefits.${index}.benefitType` as const)}
                      />
                    ) : (
                      <p className="text-sm font-medium">{preset?.label ?? field.benefitType}</p>
                    )}
                    <Textarea
                      rows={2}
                      placeholder="Describe this benefit..."
                      {...register(`benefits.${index}.description` as const)}
                    />
                    <FieldError message={errors.benefits?.[index]?.description?.message} />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove benefit"
                    onClick={() => remove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessImpact">Business Impact</Label>
        <p className="text-muted-foreground text-sm">
          Optional — describe the anticipated business impact.
        </p>
        <Textarea id="businessImpact" rows={3} {...register("businessImpact")} />
        <div className="flex items-center justify-between gap-4">
          <FieldError message={errors.businessImpact?.message} />
          <CharCounter current={watch("businessImpact")?.length ?? 0} max={500} />
        </div>
      </div>
    </div>
  );
}
