"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Clock, LayoutTemplate, Star } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { PRIORITY_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } from "@/features/kaizen/constants/filter-options";
import { useCategories } from "@/features/kaizen/hooks/use-categories";
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import { useDepartmentUsers } from "@/features/kaizen/hooks/use-department-users";
import { REPORT_TYPE_LABEL, REPORT_TYPE_OPTIONS } from "@/features/reports/constants/report-types";
import { useReportHistory } from "@/features/reports/hooks/use-reports";
import { useReportTemplates } from "@/features/reports/hooks/use-report-templates";
import type { ReportBuilderFilters } from "@/features/reports/types/report";
import { getQuickPresets } from "@/features/reports/utils/quick-presets";
import { templateApplyHref } from "@/features/reports/utils/report-url";
import { SavedViewsBar } from "@/features/saved-views/components/saved-views-bar";
import type { SavedViewFilters } from "@/features/saved-views/types/saved-view";
import { formatRelativeTime } from "@/utils/format";

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

interface ReportBuilderSidebarProps {
  filters: ReportBuilderFilters;
  onChange: (updates: Partial<ReportBuilderFilters>) => void;
  onApplySavedView: (filters: SavedViewFilters) => void;
}

function FilterGroup({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details className="group border-b py-3" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
        {title}
        <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </details>
  );
}

/**
 * Left panel. Every field mirrors the exact vocabulary the backend's `generateReportSchema`
 * accepts (same filters the old `ReportBuilder` used) — grouped into collapsible sections
 * instead of one long flat grid. "Saved Templates" here is a quick top-4 shortlist (pinned/
 * favorite first); the full gallery lives at `/reports/templates`.
 */
export function ReportBuilderSidebar({ filters, onChange, onApplySavedView }: ReportBuilderSidebarProps) {
  const { data: currentUser } = useCurrentUser();
  const isCompanyWide = currentUser ? (["HR", "CMD", "SUPER_ADMIN"] as const).includes(currentUser.role as never) : false;
  const isDeptManagerOnly = currentUser?.role === "DEPARTMENT_MANAGER";

  const departmentsQuery = useDepartments();
  const categoriesQuery = useCategories();
  const effectiveDepartmentId = isCompanyWide ? (filters.departmentId ?? "") : (currentUser?.department?.id ?? "");
  const departmentUsersQuery = useDepartmentUsers(effectiveDepartmentId);
  const templatesQuery = useReportTemplates();
  const historyQuery = useReportHistory({ page: 1, pageSize: 5 });

  const activeFilters: SavedViewFilters = Object.fromEntries(Object.entries(filters).filter(([key, value]) => key !== "reportType" && value !== undefined && value !== ""));
  // Computed once via a lazy initializer rather than fresh on every render — the presets are
  // relative to "now" at mount, not a value that needs to track a live clock.
  const [presets] = useState(getQuickPresets);

  const shortlistedTemplates = [...(templatesQuery.data ?? [])].sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || Number(b.isFavorite) - Number(a.isFavorite)).slice(0, 4);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="mb-4 flex flex-col gap-1.5">
        <Label>Report Type</Label>
        <Select value={filters.reportType} onChange={(event) => onChange({ reportType: event.target.value as ReportBuilderFilters["reportType"] })}>
          {REPORT_TYPE_OPTIONS.filter((option) => !isDeptManagerOnly || option.value === "DEPARTMENT").map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange({ dateFrom: preset.dateFrom, dateTo: preset.dateTo })}
            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mb-2 border-b pb-3">
        <SavedViewsBar entityType="REPORTS" currentFilters={activeFilters} onApply={onApplySavedView} />
      </div>

      <FilterGroup title="Date Range" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">From</Label>
            <Input type="date" value={filters.dateFrom ?? ""} onChange={(event) => onChange({ dateFrom: event.target.value || undefined })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">To</Label>
            <Input type="date" value={filters.dateTo ?? ""} onChange={(event) => onChange({ dateTo: event.target.value || undefined })} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Compare</Label>
          <Select value={filters.comparisonPeriod ?? "NONE"} onChange={(event) => onChange({ comparisonPeriod: event.target.value as ReportBuilderFilters["comparisonPeriod"] })}>
            {COMPARISON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </FilterGroup>

      <FilterGroup title="Scope" defaultOpen>
        {isCompanyWide ? (
          <div className="flex flex-col gap-1">
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
        <div className="flex flex-col gap-1">
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
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Employee</Label>
          <Select value={filters.employeeId ?? ""} onChange={(event) => onChange({ employeeId: event.target.value || undefined })} disabled={!effectiveDepartmentId}>
            <option value="">{effectiveDepartmentId ? "Anyone" : "Pick a department first"}</option>
            {departmentUsersQuery.data?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName}
              </option>
            ))}
          </Select>
        </div>
      </FilterGroup>

      <FilterGroup title="Status &amp; Priority">
        <div className="flex flex-col gap-1">
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
        <div className="flex flex-col gap-1">
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
        <div className="flex flex-col gap-1">
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
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Business Impact</Label>
          <Select value={filters.businessImpactStatus ?? ""} onChange={(event) => onChange({ businessImpactStatus: event.target.value || undefined })}>
            <option value="">Any</option>
            {BUSINESS_IMPACT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </FilterGroup>

      <FilterGroup title="People">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Reviewer</Label>
          <Select value={filters.reviewerId ?? ""} onChange={(event) => onChange({ reviewerId: event.target.value || undefined })} disabled={!effectiveDepartmentId}>
            <option value="">{effectiveDepartmentId ? "Anyone" : "Pick a department first"}</option>
            {departmentUsersQuery.data?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Implementation Owner</Label>
          <Select value={filters.implementationOwnerId ?? ""} onChange={(event) => onChange({ implementationOwnerId: event.target.value || undefined })} disabled={!effectiveDepartmentId}>
            <option value="">{effectiveDepartmentId ? "Anyone" : "Pick a department first"}</option>
            {departmentUsersQuery.data?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName}
              </option>
            ))}
          </Select>
        </div>
      </FilterGroup>

      {shortlistedTemplates.length > 0 ? (
        <div className="flex flex-col gap-2 border-b py-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <LayoutTemplate className="h-3.5 w-3.5" />
            Saved Templates
          </p>
          {shortlistedTemplates.map((template) => (
            <Link key={template.id} href={templateApplyHref(template.id, template.reportType, template.filters)} className="hover:bg-accent flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm">
              {template.isPinned ? <Star className="text-achievement-foreground h-3 w-3 shrink-0 fill-current" /> : <span className="w-3 shrink-0" />}
              <span className="truncate">{template.name}</span>
            </Link>
          ))}
          <Link href="/reports/templates" className="text-primary text-xs font-medium hover:underline">
            View all templates →
          </Link>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 py-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Clock className="h-3.5 w-3.5" />
          Recent Reports
        </p>
        {historyQuery.isLoading ? (
          <LoadingSkeleton className="h-16 w-full" />
        ) : !historyQuery.data || historyQuery.data.items.length === 0 ? (
          <p className="text-muted-foreground text-xs">Nothing generated yet.</p>
        ) : (
          historyQuery.data.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground truncate">{REPORT_TYPE_LABEL[item.reportType]}</span>
              <span className="text-muted-foreground shrink-0">{formatRelativeTime(item.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
