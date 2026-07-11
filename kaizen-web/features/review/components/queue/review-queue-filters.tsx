"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  PRIORITY_FILTER_OPTIONS,
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/features/kaizen/constants/filter-options";
import { useCategories } from "@/features/kaizen/hooks/use-categories";
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import { useDepartmentUsers } from "@/features/kaizen/hooks/use-department-users";
import type { KaizenSort } from "@/features/kaizen/types/kaizen";

const RECOMMENDATION_OPTIONS = [
  { value: "APPROVE", label: "Approve" },
  { value: "REJECT", label: "Reject" },
  { value: "NEEDS_CHANGES", label: "Needs Changes" },
];

interface ReviewQueueFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  priority: string;
  onPriorityChange: (value: string) => void;
  sort: KaizenSort;
  onSortChange: (value: KaizenSort) => void;
  /** Only rendered for company-wide roles (HR/CMD/Super Admin) — a Department Manager's queue
   * is already scoped to their own department server-side, so the filter would be redundant. */
  showDepartmentFilter: boolean;
  departmentId: string;
  onDepartmentChange: (value: string) => void;
  /** The department to scope the Employee/Assigned To pickers to — the selected `departmentId`
   * filter for company-wide roles, or the manager's own department otherwise (`useDepartmentUsers`
   * only fetches once a single department is known, matching the Implementation "assign owner"
   * picker's exact reuse — see Milestone 8). */
  effectiveDepartmentId: string;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  scoreMin: string;
  onScoreMinChange: (value: string) => void;
  scoreMax: string;
  onScoreMaxChange: (value: string) => void;
  recommendation: string;
  onRecommendationChange: (value: string) => void;
  submitterId: string;
  onSubmitterChange: (value: string) => void;
  assignedReviewerId: string;
  onAssignedReviewerChange: (value: string) => void;
}

export function ReviewQueueFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  categoryId,
  onCategoryChange,
  priority,
  onPriorityChange,
  sort,
  onSortChange,
  showDepartmentFilter,
  departmentId,
  onDepartmentChange,
  effectiveDepartmentId,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  scoreMin,
  onScoreMinChange,
  scoreMax,
  onScoreMaxChange,
  recommendation,
  onRecommendationChange,
  submitterId,
  onSubmitterChange,
  assignedReviewerId,
  onAssignedReviewerChange,
}: ReviewQueueFiltersProps) {
  const categoriesQuery = useCategories();
  const departmentsQuery = useDepartments();
  const departmentUsersQuery = useDepartmentUsers(effectiveDepartmentId);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by title, number, or description..."
          className="pl-9"
          aria-label="Search review queue"
        />
      </div>

      <div
        className={`grid grid-cols-2 gap-2 ${showDepartmentFilter ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}
      >
        <Select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {showDepartmentFilter ? (
          <Select
            value={departmentId}
            onChange={(event) => onDepartmentChange(event.target.value)}
            aria-label="Filter by department"
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
          value={categoryId}
          onChange={(event) => onCategoryChange(event.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categoriesQuery.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        <Select
          value={priority}
          onChange={(event) => onPriorityChange(event.target.value)}
          aria-label="Filter by priority"
        >
          <option value="">All Priorities</option>
          {PRIORITY_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as KaizenSort)}
          aria-label="Sort by"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground w-fit gap-1 text-xs"
        onClick={() => setAdvancedOpen((open) => !open)}
      >
        {advancedOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        Advanced Filters
      </Button>

      {advancedOpen ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className="text-muted-foreground text-xs">From</label>
            <Input type="date" value={dateFrom} onChange={(event) => onDateFromChange(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-muted-foreground text-xs">To</label>
            <Input type="date" value={dateTo} onChange={(event) => onDateToChange(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-muted-foreground text-xs">Score Min</label>
            <Input
              type="number"
              min={0}
              max={10}
              value={scoreMin}
              onChange={(event) => onScoreMinChange(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-muted-foreground text-xs">Score Max</label>
            <Input
              type="number"
              min={0}
              max={10}
              value={scoreMax}
              onChange={(event) => onScoreMaxChange(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-muted-foreground text-xs">Recommendation</label>
            <Select value={recommendation} onChange={(event) => onRecommendationChange(event.target.value)}>
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
              value={submitterId}
              onChange={(event) => onSubmitterChange(event.target.value)}
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
          <div className="flex flex-col gap-1">
            <label className="text-muted-foreground text-xs">Assigned To</label>
            <Select
              value={assignedReviewerId}
              onChange={(event) => onAssignedReviewerChange(event.target.value)}
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
        </div>
      ) : null}
    </div>
  );
}
