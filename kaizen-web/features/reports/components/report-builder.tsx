"use client";

import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { REPORT_TYPE_OPTIONS } from "@/features/reports/constants/report-types";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useCategories } from "@/features/kaizen/hooks/use-categories";
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import { useDepartmentUsers } from "@/features/kaizen/hooks/use-department-users";
import {
  PRIORITY_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/features/kaizen/constants/filter-options";
import { SavedViewsBar } from "@/features/saved-views/components/saved-views-bar";
import type { SavedViewFilters } from "@/features/saved-views/types/saved-view";
import type { ReportBuilderFilters } from "@/features/reports/types/report";

interface ReportBuilderProps {
  filters: ReportBuilderFilters;
  onChange: (updates: Partial<ReportBuilderFilters>) => void;
  onApplySavedView: (filters: SavedViewFilters) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const COMPARISON_OPTIONS = [
  { value: "NONE", label: "No Comparison" },
  { value: "MONTH", label: "vs Previous Month" },
  { value: "QUARTER", label: "vs Previous Quarter" },
  { value: "YEAR", label: "vs Previous Year" },
];

const REWARD_STATUS_OPTIONS = [
  { value: "ISSUED", label: "Reward Issued" },
  { value: "NOT_ISSUED", label: "No Reward Yet" },
];

const BUSINESS_IMPACT_STATUS_OPTIONS = [
  { value: "RECORDED", label: "Impact Recorded" },
  { value: "NOT_RECORDED", label: "Not Recorded" },
];

/** Report Builder (Part 3) — every filter dimension mirrors the exact vocabulary the backend's
 * `generateReportSchema` accepts, which itself reuses Chunk 2's filter field names (Part 9). */
export function ReportBuilder({ filters, onChange, onApplySavedView, onGenerate, isGenerating }: ReportBuilderProps) {
  const { data: currentUser } = useCurrentUser();
  const isCompanyWide = currentUser ? (["HR", "CMD", "SUPER_ADMIN"] as const).includes(currentUser.role as never) : false;
  const isDeptManagerOnly = currentUser?.role === "DEPARTMENT_MANAGER";

  const departmentsQuery = useDepartments();
  const categoriesQuery = useCategories();
  const effectiveDepartmentId = isCompanyWide ? (filters.departmentId ?? "") : (currentUser?.department?.id ?? "");
  const departmentUsersQuery = useDepartmentUsers(effectiveDepartmentId);

  const activeFilters: SavedViewFilters = Object.fromEntries(
    Object.entries(filters).filter(([key, value]) => key !== "reportType" && value !== undefined && value !== ""),
  );

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-5">
      <SavedViewsBar entityType="REPORTS" currentFilters={activeFilters} onApply={onApplySavedView} />

      <div className="flex flex-col gap-1.5">
        <Label>Report Type</Label>
        <Select
          value={filters.reportType}
          onChange={(event) => onChange({ reportType: event.target.value as ReportBuilderFilters["reportType"] })}
        >
          {REPORT_TYPE_OPTIONS.filter((option) => !isDeptManagerOnly || option.value === "DEPARTMENT").map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">From</Label>
          <Input type="date" value={filters.dateFrom ?? ""} onChange={(event) => onChange({ dateFrom: event.target.value || undefined })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">To</Label>
          <Input type="date" value={filters.dateTo ?? ""} onChange={(event) => onChange({ dateTo: event.target.value || undefined })} />
        </div>

        {isCompanyWide ? (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Department</Label>
            <Select value={filters.departmentId ?? ""} onChange={(event) => onChange({ departmentId: event.target.value || undefined })}>
              <option value="">All Departments</option>
              {departmentsQuery.data?.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Category</Label>
          <Select value={filters.categoryId ?? ""} onChange={(event) => onChange({ categoryId: event.target.value || undefined })}>
            <option value="">All Categories</option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Priority</Label>
          <Select value={filters.priority ?? ""} onChange={(event) => onChange({ priority: event.target.value || undefined })}>
            <option value="">Any Priority</option>
            {PRIORITY_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Status</Label>
          <Select value={filters.status ?? ""} onChange={(event) => onChange({ status: event.target.value || undefined })}>
            <option value="">Any Status</option>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Employee</Label>
          <Select
            value={filters.employeeId ?? ""}
            onChange={(event) => onChange({ employeeId: event.target.value || undefined })}
            disabled={!effectiveDepartmentId}
          >
            <option value="">{effectiveDepartmentId ? "Anyone" : "Pick a department first"}</option>
            {departmentUsersQuery.data?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Reviewer</Label>
          <Select
            value={filters.reviewerId ?? ""}
            onChange={(event) => onChange({ reviewerId: event.target.value || undefined })}
            disabled={!effectiveDepartmentId}
          >
            <option value="">{effectiveDepartmentId ? "Anyone" : "Pick a department first"}</option>
            {departmentUsersQuery.data?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Implementation Owner</Label>
          <Select
            value={filters.implementationOwnerId ?? ""}
            onChange={(event) => onChange({ implementationOwnerId: event.target.value || undefined })}
            disabled={!effectiveDepartmentId}
          >
            <option value="">{effectiveDepartmentId ? "Anyone" : "Pick a department first"}</option>
            {departmentUsersQuery.data?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Reward Status</Label>
          <Select value={filters.rewardStatus ?? ""} onChange={(event) => onChange({ rewardStatus: event.target.value || undefined })}>
            <option value="">Any</option>
            {REWARD_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Business Impact Status</Label>
          <Select
            value={filters.businessImpactStatus ?? ""}
            onChange={(event) => onChange({ businessImpactStatus: event.target.value || undefined })}
          >
            <option value="">Any</option>
            {BUSINESS_IMPACT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Comparison</Label>
          <Select value={filters.comparisonPeriod ?? "NONE"} onChange={(event) => onChange({ comparisonPeriod: event.target.value as ReportBuilderFilters["comparisonPeriod"] })}>
            {COMPARISON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Button className="w-fit self-end" onClick={onGenerate} disabled={isGenerating}>
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Generate Report
      </Button>
    </div>
  );
}
