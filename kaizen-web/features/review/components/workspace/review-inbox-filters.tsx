"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { STATUS_FILTER_OPTIONS } from "@/features/kaizen/constants/filter-options";
import { useCategories } from "@/features/kaizen/hooks/use-categories";
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import { useDepartmentUsers } from "@/features/kaizen/hooks/use-department-users";
import { cn } from "@/lib/utils";

const QUICK_STATUS_CHIPS = [
  { value: "", label: "All" },
  ...STATUS_FILTER_OPTIONS.filter((option) =>
    ["SUBMITTED", "UNDER_REVIEW", "NEEDS_CHANGES", "APPROVED", "REJECTED"].includes(option.value),
  ),
];

const RECOMMENDATION_OPTIONS = [
  { value: "APPROVE", label: "Approve" },
  { value: "REJECT", label: "Reject" },
  { value: "NEEDS_CHANGES", label: "Needs Changes" },
];

export interface ReviewInboxFilterValues {
  search: string;
  status: string;
  departmentId: string;
  categoryId: string;
  priority: string;
  dateFrom: string;
  dateTo: string;
  scoreMin: string;
  scoreMax: string;
  recommendation: string;
  submitterId: string;
  assignedReviewerId: string;
}

interface ReviewInboxFiltersProps {
  values: ReviewInboxFilterValues;
  onChange: <K extends keyof ReviewInboxFilterValues>(key: K, value: string) => void;
  showDepartmentFilter: boolean;
  effectiveDepartmentId: string;
  activeAdvancedCount: number;
}

export function ReviewInboxFilters({
  values,
  onChange,
  showDepartmentFilter,
  effectiveDepartmentId,
  activeAdvancedCount,
}: ReviewInboxFiltersProps) {
  const categoriesQuery = useCategories();
  const departmentsQuery = useDepartments();
  const departmentUsersQuery = useDepartmentUsers(effectiveDepartmentId);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2.5 p-3">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={values.search}
          onChange={(event) => onChange("search", event.target.value)}
          placeholder="Search the queue…"
          className="h-9 pl-9"
          aria-label="Search review queue"
        />
        {values.search ? (
          <button
            type="button"
            onClick={() => onChange("search", "")}
            aria-label="Clear search"
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {QUICK_STATUS_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => onChange("status", chip.value)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150",
              values.status === chip.value
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground hover:bg-accent border-transparent",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {showDepartmentFilter ? (
          <Select
            value={values.departmentId}
            onChange={(event) => onChange("departmentId", event.target.value)}
            aria-label="Filter by department"
            className="h-8 text-xs"
          >
            <option value="">All Departments</option>
            {departmentsQuery.data?.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
        ) : null}

        <Select
          value={values.categoryId}
          onChange={(event) => onChange("categoryId", event.target.value)}
          aria-label="Filter by category"
          className="h-8 text-xs"
        >
          <option value="">All Categories</option>
          {categoriesQuery.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        <DropdownMenu open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              More
              {activeAdvancedCount > 0 ? (
                <span className="bg-primary text-primary-foreground flex h-4 w-4 items-center justify-center rounded-full text-[10px]">
                  {activeAdvancedCount}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-3">
            <DropdownMenuLabel className="px-0">Advanced Filters</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex flex-col gap-3 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-muted-foreground text-xs">From</label>
                  <Input type="date" value={values.dateFrom} onChange={(event) => onChange("dateFrom", event.target.value)} className="h-8 text-xs" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-muted-foreground text-xs">To</label>
                  <Input type="date" value={values.dateTo} onChange={(event) => onChange("dateTo", event.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-muted-foreground text-xs">Score Min</label>
                  <Input type="number" min={0} max={10} value={values.scoreMin} onChange={(event) => onChange("scoreMin", event.target.value)} className="h-8 text-xs" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-muted-foreground text-xs">Score Max</label>
                  <Input type="number" min={0} max={10} value={values.scoreMax} onChange={(event) => onChange("scoreMax", event.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground text-xs">Recommendation</label>
                <Select value={values.recommendation} onChange={(event) => onChange("recommendation", event.target.value)} className="h-8 text-xs">
                  <option value="">Any</option>
                  {RECOMMENDATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground text-xs">Employee</label>
                <Select
                  value={values.submitterId}
                  onChange={(event) => onChange("submitterId", event.target.value)}
                  disabled={!effectiveDepartmentId}
                  className="h-8 text-xs"
                >
                  <option value="">{effectiveDepartmentId ? "Anyone" : "Pick a department first"}</option>
                  {departmentUsersQuery.data?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground text-xs">Assigned To</label>
                <Select
                  value={values.assignedReviewerId}
                  onChange={(event) => onChange("assignedReviewerId", event.target.value)}
                  disabled={!effectiveDepartmentId}
                  className="h-8 text-xs"
                >
                  <option value="">{effectiveDepartmentId ? "Anyone" : "Pick a department first"}</option>
                  {departmentUsersQuery.data?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
