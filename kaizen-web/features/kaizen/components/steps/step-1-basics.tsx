"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CategoryCardSelect } from "@/features/kaizen/components/category-card-select";
import { CharCounter } from "@/features/kaizen/components/char-counter";
import { FieldError } from "@/features/kaizen/components/field-error";
import { useCategories } from "@/features/kaizen/hooks/use-categories";
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";

export function Step1Basics() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<WizardFormValues>();

  const categoriesQuery = useCategories();
  const departmentsQuery = useDepartments();

  const title = watch("title");
  const categoryId = watch("categoryId");

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <Label>Category</Label>
        {categoriesQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[...new Array(8)].map((_, index) => (
              <LoadingSkeleton key={index} className="h-24" />
            ))}
          </div>
        ) : (
          <CategoryCardSelect
            categories={categoriesQuery.data ?? []}
            value={categoryId}
            onChange={(value) => setValue("categoryId", value, { shouldValidate: true })}
          />
        )}
        <FieldError message={errors.categoryId?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Kaizen Title</Label>
        <Input
          id="title"
          placeholder="e.g. Reduce inventory counting time"
          {...register("title")}
        />
        <div className="flex items-center justify-between gap-4">
          <FieldError message={errors.title?.message} />
          <CharCounter current={title.length} max={120} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="departmentId">Department</Label>
        {departmentsQuery.isLoading ? (
          <LoadingSkeleton className="h-12" />
        ) : (
          <Select id="departmentId" {...register("departmentId")}>
            <option value="">Select a department</option>
            {departmentsQuery.data?.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
        )}
        <FieldError message={errors.departmentId?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="problemStatement">Problem Statement</Label>
        <Textarea
          id="problemStatement"
          placeholder="Describe the problem clearly."
          rows={5}
          {...register("problemStatement")}
        />
        <div className="flex items-center justify-between gap-4">
          <FieldError message={errors.problemStatement?.message} />
          <CharCounter current={watch("problemStatement").length} max={1000} />
        </div>
      </div>
    </div>
  );
}
