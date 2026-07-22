"use client";

import { Check } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  COST_TYPE_OPTIONS,
  DURATION_UNIT_OPTIONS,
  IMPACT_LEVEL_OPTIONS,
} from "@/features/kaizen/constants/cost-of-implementation";
import { FieldError } from "@/features/kaizen/components/field-error";
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";
import { cn } from "@/lib/utils";

function FieldGroup({ label, htmlFor, error, children }: { label: string; htmlFor?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

/**
 * Replaces the removed 5 Whys step — a business estimation form for the effort and impact of
 * implementing this Kaizen. Every required field mirrors the backend's submit-time check
 * (kaizen.service.ts#validateForSubmit) and the wizard schema (wizard-schema.ts).
 */
export function Step3CostOfImplementation() {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<WizardFormValues>();

  const departmentsQuery = useDepartments();
  const vendorRequired = watch("costOfImplementation.vendorRequired");
  const departmentIds = watch("costOfImplementation.departmentIds");
  const costErrors = errors.costOfImplementation;

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-4">
        <p className="text-sm font-semibold">Implementation Cost</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldGroup label="Estimated Cost (₹)" htmlFor="estimatedCost" error={costErrors?.estimatedCost?.message}>
            <Input id="estimatedCost" type="number" min={0} step="0.01" {...register("costOfImplementation.estimatedCost", { valueAsNumber: true })} />
          </FieldGroup>
          <FieldGroup label="Currency" htmlFor="currency" error={costErrors?.currency?.message}>
            <Input id="currency" {...register("costOfImplementation.currency")} />
          </FieldGroup>
          <FieldGroup label="Cost Type" htmlFor="costType" error={costErrors?.costType?.message}>
            <Select id="costType" {...register("costOfImplementation.costType")} defaultValue="">
              <option value="" disabled>
                Select cost type
              </option>
              {COST_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <div className="grid grid-cols-2 gap-2">
            <FieldGroup label="Estimated Duration" htmlFor="estimatedDurationValue" error={costErrors?.estimatedDurationValue?.message}>
              <Input id="estimatedDurationValue" type="number" min={1} {...register("costOfImplementation.estimatedDurationValue", { valueAsNumber: true })} />
            </FieldGroup>
            <FieldGroup label="Unit" htmlFor="estimatedDurationUnit" error={costErrors?.estimatedDurationUnit?.message}>
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
            </FieldGroup>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <p className="text-sm font-semibold">Resources Required</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldGroup label="Number of Employees Required" htmlFor="employeesRequired" error={costErrors?.employeesRequired?.message}>
            <Input id="employeesRequired" type="number" min={0} {...register("costOfImplementation.employeesRequired", { valueAsNumber: true })} />
          </FieldGroup>
        </div>

        <div className="space-y-2">
          <Label>Departments Involved</Label>
          <Controller
            control={control}
            name="costOfImplementation.departmentIds"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {(departmentsQuery.data ?? []).map((department) => {
                  const isSelected = departmentIds.includes(department.id);
                  return (
                    <Button
                      key={department.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(isSelected && "border-primary bg-primary/10 text-primary")}
                      onClick={() =>
                        field.onChange(
                          isSelected
                            ? field.value.filter((id: string) => id !== department.id)
                            : [...field.value, department.id],
                        )
                      }
                    >
                      {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                      {department.name}
                    </Button>
                  );
                })}
              </div>
            )}
          />
        </div>

        <FieldGroup label="Materials Required" htmlFor="materialsRequired" error={costErrors?.materialsRequired?.message}>
          <Textarea id="materialsRequired" rows={2} {...register("costOfImplementation.materialsRequired")} />
        </FieldGroup>

        <FieldGroup label="Machines Required" htmlFor="machinesRequired" error={costErrors?.machinesRequired?.message}>
          <Textarea id="machinesRequired" rows={2} {...register("costOfImplementation.machinesRequired")} />
        </FieldGroup>

        <div className="space-y-2">
          <Label>External Vendor Required</Label>
          <div className="flex gap-2">
            <Controller
              control={control}
              name="costOfImplementation.vendorRequired"
              render={({ field }) => (
                <>
                  <Button
                    type="button"
                    variant={field.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => field.onChange(true)}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={!field.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => field.onChange(false)}
                  >
                    No
                  </Button>
                </>
              )}
            />
          </div>
        </div>

        {vendorRequired ? (
          <FieldGroup label="Vendor Details" htmlFor="vendorDetails" error={costErrors?.vendorDetails?.message}>
            <Textarea id="vendorDetails" rows={2} {...register("costOfImplementation.vendorDetails")} />
          </FieldGroup>
        ) : null}
      </div>

      <div className="space-y-4 border-t pt-6">
        <p className="text-sm font-semibold">Expected Benefits</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldGroup label="Estimated Annual Savings (₹)" htmlFor="estimatedAnnualSavings" error={costErrors?.estimatedAnnualSavings?.message}>
            <Input id="estimatedAnnualSavings" type="number" min={0} step="0.01" {...register("costOfImplementation.estimatedAnnualSavings", { valueAsNumber: true })} />
          </FieldGroup>
          <FieldGroup label="Time Saved (hours/day)" htmlFor="timeSavedHoursPerDay" error={costErrors?.timeSavedHoursPerDay?.message}>
            <Input id="timeSavedHoursPerDay" type="number" min={0} step="0.1" {...register("costOfImplementation.timeSavedHoursPerDay", { valueAsNumber: true })} />
          </FieldGroup>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldGroup label="Quality Improvement" htmlFor="qualityImprovement" error={costErrors?.qualityImprovement?.message}>
            <Select id="qualityImprovement" {...register("costOfImplementation.qualityImprovement")} defaultValue="">
              <option value="" disabled>
                Select level
              </option>
              {IMPACT_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Safety Improvement" htmlFor="safetyImprovement" error={costErrors?.safetyImprovement?.message}>
            <Select id="safetyImprovement" {...register("costOfImplementation.safetyImprovement")} defaultValue="">
              <option value="" disabled>
                Select level
              </option>
              {IMPACT_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Customer Satisfaction Improvement" htmlFor="customerSatisfactionImprovement" error={costErrors?.customerSatisfactionImprovement?.message}>
            <Select id="customerSatisfactionImprovement" {...register("costOfImplementation.customerSatisfactionImprovement")} defaultValue="">
              <option value="" disabled>
                Select level
              </option>
              {IMPACT_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Waste Reduction" htmlFor="wasteReductionImprovement" error={costErrors?.wasteReductionImprovement?.message}>
            <Select id="wasteReductionImprovement" {...register("costOfImplementation.wasteReductionImprovement")} defaultValue="">
              <option value="" disabled>
                Select level
              </option>
              {IMPACT_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </div>
      </div>

      <div className="space-y-4 border-t pt-6">
        <p className="text-sm font-semibold">ROI</p>
        <FieldGroup label="Expected Payback Period" htmlFor="expectedPaybackPeriod" error={costErrors?.expectedPaybackPeriod?.message}>
          <Input id="expectedPaybackPeriod" placeholder="e.g. 8 months" {...register("costOfImplementation.expectedPaybackPeriod")} />
        </FieldGroup>
        <FieldGroup label="Additional Business Notes" htmlFor="additionalNotes" error={costErrors?.additionalNotes?.message}>
          <Textarea id="additionalNotes" rows={3} {...register("costOfImplementation.additionalNotes")} />
        </FieldGroup>
      </div>
    </div>
  );
}
