"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { FileBarChart, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import { useAnalyticsSavedViews } from "@/features/analytics/hooks/use-analytics-saved-views";
import { cn } from "@/lib/utils";

export interface AnalyticsFilterValues {
  dateFrom: string;
  dateTo: string;
  departmentId: string;
  compare: string;
  search: string;
  [key: string]: string;
}

interface StudioFilterBarProps {
  values: AnalyticsFilterValues;
  onChange: <K extends keyof AnalyticsFilterValues>(key: K, value: string) => void;
  onApplyAll: (filters: Partial<AnalyticsFilterValues>) => void;
  showDepartmentFilter: boolean;
  userId: string | undefined;
}

/**
 * Sticky top bar. "Category selector" from the brief is not present — no analytics endpoint
 * accepts a category filter (`AnalyticsDateRange`/`DepartmentAnalyticsQuery` only take
 * `dateFrom`/`dateTo`[/`departmentId`]), so rather than build a control that silently does
 * nothing, it's omitted. "Export" links to the existing Reports page (real, already-built export
 * engine) instead of a new one-off export action.
 */
export function StudioFilterBar({ values, onChange, onApplyAll, showDepartmentFilter, userId }: StudioFilterBarProps) {
  const departmentsQuery = useDepartments();
  const queryClient = useQueryClient();
  const { views, saveView, deleteView } = useAnalyticsSavedViews(userId);
  const [isSaving, setIsSaving] = useState(false);
  const [newViewName, setNewViewName] = useState("");

  const hasActiveFilters = Boolean(values.dateFrom || values.dateTo || values.departmentId || values.search);

  function handleRefresh() {
    void queryClient.invalidateQueries({ queryKey: ["analytics"] });
  }

  function handleSaveView() {
    const trimmed = newViewName.trim();
    if (!trimmed) return;
    saveView(trimmed, values);
    setNewViewName("");
    setIsSaving(false);
  }

  return (
    <div className="sticky top-16 z-20 -mx-4 flex flex-col gap-3 border-b bg-background/95 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Studio</h1>
          <p className="text-muted-foreground text-sm">Company performance, decisions, and trends in one workspace.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports?reportType=EXECUTIVE_SUMMARY">
              <FileBarChart className="h-3.5 w-3.5" />
              Export
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input value={values.search} onChange={(event) => onChange("search", event.target.value)} placeholder="Search departments or people…" className="h-9 w-56 pl-9" aria-label="Search analytics" />
        </div>

        <Input type="date" value={values.dateFrom} onChange={(event) => onChange("dateFrom", event.target.value)} aria-label="From date" className="h-9 w-auto" />
        <span className="text-muted-foreground text-xs">to</span>
        <Input type="date" value={values.dateTo} onChange={(event) => onChange("dateTo", event.target.value)} aria-label="To date" className="h-9 w-auto" />

        {showDepartmentFilter ? (
          <Select value={values.departmentId} onChange={(event) => onChange("departmentId", event.target.value)} aria-label="Filter by department" className="h-9 w-auto text-xs">
            <option value="">All Departments</option>
            {departmentsQuery.data?.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
        ) : null}

        <button
          type="button"
          onClick={() => onChange("compare", values.compare === "1" ? "" : "1")}
          disabled={!values.dateFrom || !values.dateTo}
          title={!values.dateFrom || !values.dateTo ? "Pick a date range to compare against the previous period" : undefined}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            values.compare === "1" ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:bg-accent",
          )}
        >
          Compare vs. previous period
        </button>

        {hasActiveFilters ? (
          <button type="button" onClick={() => onApplyAll({ dateFrom: "", dateTo: "", departmentId: "", search: "", compare: "" })} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs">
            <X className="h-3 w-3" />
            Clear
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {views.map((view) => (
          <div key={view.id} className="group flex items-center gap-1 rounded-full border bg-background py-1 pr-1 pl-3 text-xs">
            <button type="button" onClick={() => onApplyAll(view.filters)} className="font-medium">
              {view.name}
            </button>
            <button type="button" onClick={() => deleteView(view.id)} aria-label={`Delete saved view "${view.name}"`} className="hover:bg-destructive/10 hover:text-destructive rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}

        {isSaving ? (
          <div className="flex items-center gap-1.5">
            <Input
              value={newViewName}
              onChange={(event) => setNewViewName(event.target.value)}
              placeholder="View name…"
              className="h-8 w-40 text-xs"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSaveView();
                if (event.key === "Escape") setIsSaving(false);
              }}
            />
            <Button size="sm" className="h-8" onClick={handleSaveView}>
              Save
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsSaving(false)} aria-label="Cancel saving view">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="h-8 text-xs" disabled={!hasActiveFilters} onClick={() => setIsSaving(true)} title={hasActiveFilters ? "Save current filters (saved to this browser only)" : "Set some filters first"}>
            <Plus className="h-3.5 w-3.5" />
            Save view
          </Button>
        )}
      </div>
    </div>
  );
}
