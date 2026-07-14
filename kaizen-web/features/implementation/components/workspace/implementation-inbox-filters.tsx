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
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import { useDepartmentUsers } from "@/features/kaizen/hooks/use-department-users";
import { KANBAN_STAGE_LABEL, type KanbanStage } from "@/features/implementation/utils/kanban-stage";
import type { VerificationStatus } from "@/features/implementation/types/implementation";

const VERIFICATION_STATUS_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

const KAIZEN_STATUS_OPTIONS = [
  { value: "IMPLEMENTATION_IN_PROGRESS", label: "In Progress" },
  { value: "IMPLEMENTATION_COMPLETED", label: "Completed" },
];

const STAGE_CHIPS: (KanbanStage | "")[] = ["", "PLANNED", "IN_PROGRESS", "BLOCKED", "COMPLETED"];

export interface ImplementationInboxFilterValues {
  status: string;
  departmentId: string;
  kaizenStatus: string;
  ownerId: string;
  dateFrom: string;
  dateTo: string;
}

interface ImplementationInboxFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  stage: KanbanStage | "";
  onStageChange: (stage: KanbanStage | "") => void;
  values: ImplementationInboxFilterValues;
  onChange: <K extends keyof ImplementationInboxFilterValues>(key: K, value: string) => void;
  showDepartmentFilter: boolean;
  effectiveDepartmentId: string;
  activeAdvancedCount: number;
}

/**
 * `GET /implementations` only documents `status`/`departmentId`/`ownerId`/`dateFrom`/`dateTo`/
 * `kaizenStatus` — no `search` and no `priority` param exist, so search here filters the
 * currently loaded page client-side (disclosed in `ImplementationInbox`) rather than faking a
 * server search, and there's no Priority filter at all (that field isn't even present on the
 * list response's `kaizen` sub-object).
 */
export function ImplementationInboxFilters({
  search,
  onSearchChange,
  stage,
  onStageChange,
  values,
  onChange,
  showDepartmentFilter,
  effectiveDepartmentId,
  activeAdvancedCount,
}: ImplementationInboxFiltersProps) {
  const departmentsQuery = useDepartments();
  const departmentUsersQuery = useDepartmentUsers(effectiveDepartmentId);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2.5 p-3">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Filter this page…" className="h-9 pl-9" aria-label="Filter implementations on this page" />
        {search ? (
          <button type="button" onClick={() => onSearchChange("")} aria-label="Clear filter" className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2">
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {STAGE_CHIPS.map((chip) => (
          <button
            key={chip || "all"}
            type="button"
            onClick={() => onStageChange(chip)}
            className={
              stage === chip
                ? "bg-primary text-primary-foreground border-primary rounded-full border px-2.5 py-1 text-xs font-medium"
                : "text-muted-foreground hover:bg-accent rounded-full border border-transparent px-2.5 py-1 text-xs font-medium"
            }
          >
            {chip ? KANBAN_STAGE_LABEL[chip] : "All"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Select value={values.kaizenStatus} onChange={(event) => onChange("kaizenStatus", event.target.value)} aria-label="Filter by implementation status" className="h-8 text-xs">
          <option value="">Any Status</option>
          {KAIZEN_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {showDepartmentFilter ? (
          <Select value={values.departmentId} onChange={(event) => onChange("departmentId", event.target.value)} aria-label="Filter by department" className="h-8 text-xs">
            <option value="">All Departments</option>
            {departmentsQuery.data?.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
        ) : null}

        <DropdownMenu open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              More
              {activeAdvancedCount > 0 ? (
                <span className="bg-primary text-primary-foreground flex h-4 w-4 items-center justify-center rounded-full text-[10px]">{activeAdvancedCount}</span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-3">
            <DropdownMenuLabel className="px-0">Advanced Filters</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex flex-col gap-3 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-muted-foreground text-xs">Started From</label>
                  <Input type="date" value={values.dateFrom} onChange={(event) => onChange("dateFrom", event.target.value)} className="h-8 text-xs" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-muted-foreground text-xs">Started To</label>
                  <Input type="date" value={values.dateTo} onChange={(event) => onChange("dateTo", event.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground text-xs">Verification</label>
                <Select value={values.status} onChange={(event) => onChange("status", event.target.value)} className="h-8 text-xs">
                  <option value="">Any</option>
                  {VERIFICATION_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground text-xs">Owner</label>
                <Select value={values.ownerId} onChange={(event) => onChange("ownerId", event.target.value)} disabled={!effectiveDepartmentId} className="h-8 text-xs">
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
